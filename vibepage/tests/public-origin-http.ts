// Local contract test of a build with a synthetic HTTPS origin. No TLS/SMTP service is contacted.
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
import sharp from "sharp";
import jsQR from "jsqr";
import { setupDB } from "./setup-db";
Object.assign(process.env, { NODE_ENV: "test" });
const fixture = await setupDB();
const publicOrigin = "https://freeze-origin.example.test";
const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "production",
  HOSTNAME: "127.0.0.1",
  BETTER_AUTH_URL: publicOrigin,
  BETTER_AUTH_SECRET: "synthetic-release-origin-key-at-least-32-characters",
  REQUIRE_EMAIL_VERIFICATION: "true",
  SMTP_HOST: "smtp.invalid",
  SMTP_FROM: "fixture@example.test",
  SMTP_USER: "fixture",
  SMTP_PASSWORD: "fixture",
  VIBEPAGE_PIX_KEY: "fixture-payment-key-must-never-be-displayed",
};
let checks = 0;
function check(condition: unknown, label: string) {
  assert(condition, label);
  console.log("PASS", label);
  checks++;
}
async function port() {
  const server = createServer();
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const a = server.address();
  assert(a && typeof a !== "string");
  const p = a.port;
  await new Promise<void>((r) => server.close(() => r()));
  return p;
}
async function stop(child: ChildProcess) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise<void>((r) => {
    child.once("exit", () => r());
    setTimeout(() => {
      child.kill("SIGKILL");
      r();
    }, 5000).unref();
  });
}
let app: ChildProcess | undefined;
try {
  // Mismatch must fail before starting Next, not silently keep a localhost canonical.
  const rejected = spawn(process.execPath, [".next/standalone/launch.mjs"], {
    env: {
      ...env,
      PORT: String(await port()),
      BETTER_AUTH_URL: "https://other-origin.example.test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let rejection = "";
  rejected.stderr!.on("data", (b) => {
    rejection += b.toString();
  });
  const result = await new Promise<number | null>((resolve) => {
    rejected.once("exit", resolve);
    setTimeout(() => {
      rejected.kill("SIGKILL");
      resolve(null);
    }, 10000).unref();
  });
  check(
    result !== null && result !== 0 && rejection.includes("Reconstrua"),
    "launcher recusa origem pública divergente antes de servir HTTP",
  );
  const { emptyProfile, saveProfile } = await import("../src/lib/profiles");
  await fixture.db.user.create({
    data: {
      id: "public-origin-fixture",
      name: "Synthetic origin fixture",
      email: "origin-fixture@example.test",
    },
  });
  await saveProfile("public-origin-fixture", {
    ...emptyProfile("Synthetic profile"),
    username: "origin_fixture",
    published: true,
  });
  const p = await port();
  app = spawn(process.execPath, [".next/standalone/launch.mjs"], {
    env: { ...env, PORT: String(p) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let startup = "";
  app.stdout!.on("data", (b) => {
    startup += b.toString();
  });
  app.stderr!.on("data", (b) => {
    startup += b.toString();
  });
  const localURL = `http://127.0.0.1:${p}`;
  const request = (path: string) =>
    fetch(localURL + path, { redirect: "manual" });
  const deadline = Date.now() + 15000;
  while (true) {
    try {
      await request("/");
      break;
    } catch {
      if (app.exitCode !== null || Date.now() > deadline)
        throw new Error(
          "Standalone sintético não iniciou: " + startup.slice(-1000),
        );
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  const landing = await (await request("/")).text();
  check(
    landing.includes(`rel="canonical" href="${publicOrigin}"`) &&
      landing.includes(`property="og:url" content="${publicOrigin}"`),
    "landing usa a origem HTTPS de build em canonical e Open Graph",
  );
  const sitemap = await (await request("/sitemap.xml")).text();
  check(
    sitemap.includes(`<loc>${publicOrigin}/</loc>`) &&
      !sitemap.includes("origin_fixture"),
    "sitemap usa a origem pública sem enumerar perfis",
  );
  const robots = await (await request("/robots.txt")).text();
  check(
    robots.includes(`Sitemap: ${publicOrigin}/sitemap.xml`),
    "robots anuncia sitemap na mesma origem HTTPS",
  );
  const profile = await (await request("/origin_fixture")).text();
  check(
    profile.includes(`rel="canonical" href="${publicOrigin}/origin_fixture"`) &&
      profile.includes(
        `content="${publicOrigin}/origin_fixture/opengraph-image"`,
      ),
    "perfil e imagem OG usam a origem pública runtime",
  );
  const qr = await request("/api/qr/origin_fixture");
  const raw = await sharp(Buffer.from(await qr.arrayBuffer()))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  check(
    jsQR(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height)
      ?.data === `${publicOrigin}/origin_fixture`,
    "QR servido por HTTP local contém a URL HTTPS canônica",
  );
  const card = await request("/api/vibecard/origin_fixture");
  const crop = await sharp(Buffer.from(await card.arrayBuffer()))
    .extract({ left: 966, top: 230, width: 220, height: 220 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  check(
    jsQR(new Uint8ClampedArray(crop.data), crop.info.width, crop.info.height)
      ?.data === `${publicOrigin}/origin_fixture`,
    "VibeCard contém QR da origem pública correta",
  );
  const pix = await request("/pro/pix");
  const pixHTML = await pix.text();
  check(
    pix.status === 404 &&
      !pixHTML.includes("fixture-payment-key-must-never-be-displayed") &&
      !landing.includes("fixture-payment-key-must-never-be-displayed"),
    "chave sintética configurada permanece inacessível e Pix continua 404",
  );
  check(
    ![landing, sitemap, robots, profile].some((text) =>
      /https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(text),
    ),
    "HTML e metadados públicos não vazam URLs de loopback",
  );
  console.log(
    `Public-origin contract: ${checks} verificações locais aprovadas. Não valida DNS, TLS ou SMTP externos.`,
  );
} finally {
  if (app) await stop(app);
  await fixture.close();
}
