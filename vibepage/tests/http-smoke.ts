import { spawn } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setupDB } from "./setup-db";
Object.assign(process.env, { NODE_ENV: "test" });
const fixture = await setupDB();
const probe = createServer();
await new Promise<void>((r) => probe.listen(0, "127.0.0.1", r));
const address = probe.address();
assert(address && typeof address !== "string");
const port = address.port;
await new Promise<void>((r) => probe.close(() => r()));
const origin = `http://127.0.0.1:${port}`;
const app = spawn(process.execPath, [".next/standalone/launch.mjs"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    BETTER_AUTH_URL: origin,
    NEXT_TELEMETRY_DISABLED: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
app.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
app.stderr.on("data", (chunk) => {
  output += chunk.toString();
});
let checks = 0;
let cookie = "";
async function request(
  path: string,
  method = "GET",
  body?: unknown,
  session = cookie,
) {
  return fetch(origin + path, {
    method,
    headers: {
      origin,
      "content-type": "application/json",
      ...(session ? { cookie: session } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
}
function check(ok: unknown, label: string) {
  assert(ok, label);
  console.log("PASS", label);
  checks++;
}
try {
  const deadline = Date.now() + 30000;
  while (true) {
    try {
      await fetch(origin);
      break;
    } catch {
      if (Date.now() > deadline)
        throw new Error("Aplicação não iniciou: " + output.slice(-2000));
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  const landing = await request("/");
  check(landing.status === 200, "landing responde HTTP 200");
  check(
    landing.headers.get("referrer-policy") === "no-referrer",
    "URLs com tokens não são encaminhadas como Referer",
  );
  check(
    (await request("/api/account/export")).status === 401,
    "exportação exige sessão",
  );
  const landingHTML = await landing.text();
  const css = landingHTML.match(/href="([^\"]+\.css[^\"]*)"/);
  check(
    css && (await fetch(origin + css[1])).status === 200,
    "CSS de produção é servido",
  );
  const privatePage = await request("/dashboard");
  if (privatePage.status >= 500) console.log(output.slice(-3000));
  check(
    privatePage.status === 307 &&
      new URL(privatePage.headers.get("location") || "/", origin).pathname ===
        "/login",
    "dashboard redireciona anônimo",
  );
  const password = "a-long-http-test-passphrase";
  const credentials = { email: "http@example.com", password };
  const signup = await request("/api/auth/sign-up/email", "POST", {
    ...credentials,
    name: "HTTP Player",
  });
  if (signup.status !== 200) {
    console.log("Signup:", signup.status, await signup.text());
    console.log(output.slice(-5000));
  }
  check(signup.status === 200, "cadastro pela rota real");
  const login = await request("/api/auth/sign-in/email", "POST", credentials);
  check(login.status === 200, "login pela rota real");
  cookie =
    login.headers
      .getSetCookie()
      .find((c) => c.includes("session_token="))
      ?.split(";")[0] || "";
  check(cookie.length > 0, "sessão recebida por cookie");
  const dashboard = await request("/dashboard");
  check(
    dashboard.status === 200 &&
      (await dashboard.text()).includes("HTTP Player"),
    "área autenticada renderiza o dono",
  );
  const { emptyProfile } = await import("../src/lib/profiles");
  let profile = {
    ...emptyProfile("HTTP Player"),
    username: "http_player",
    bio: "Meu universo de teste. <img src=x onerror=alert(1)>",
    gamerCards: [
      {
        id: randomUUID(),
        game: "roblox" as const,
        displayName: "HTTP gamer <script>alert(1)</script>",
        handle: "@http_player",
        detail: "Blox Fruits",
        edition: "" as const,
        url: "https://www.roblox.com/",
        avatarKey: null,
        color: "#a78bfa",
        style: "minimal" as const,
        layout: "compact" as const,
        icon: "swords" as const,
        glow: false,
        animated: false,
      },
    ],
    links: [
      {
        id: randomUUID(),
        title: "Meu canal",
        url: "https://example.com/channel",
      },
    ],
  };
  const csrf = await fetch(origin + "/api/profile", {
    method: "PUT",
    headers: {
      origin: "https://attacker.example",
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify(profile),
  });
  check(csrf.status === 403, "origem externa não altera perfil autenticado");
  const exported = await (await request("/api/account/export")).json();
  check(
    exported.email === credentials.email &&
      !JSON.stringify(exported).includes(password) &&
      !exported.sessions,
    "exportação não expõe credenciais ou sessões",
  );
  check(
    (
      await request("/api/profile", "PUT", {
        ...profile,
        gamerCards: [{ ...profile.gamerCards[0], url: "javascript:alert(1)" }],
      })
    ).status === 400,
    "API recusa URL ativa no cartão",
  );
  check(
    (
      await request("/api/profile", "PUT", {
        ...profile,
        backgroundEffect: "stars",
      })
    ).status === 403,
    "API recusa efeitos Pro no Free",
  );
  check(
    (
      await request("/api/profile", "PUT", {
        ...profile,
        gamerCards: Array.from({ length: 4 }, () => ({
          ...profile.gamerCards[0],
          id: randomUUID(),
        })),
      })
    ).status === 403,
    "API aplica limite Free de cartões",
  );
  let saved = await request("/api/profile", "PUT", profile);
  check(saved.status === 200, "editor salva perfil e links");
  profile = (await saved.json()).profile;
  check(
    (await request("/http_player", "GET", undefined, "")).status === 404,
    "rascunho invisível publicamente",
  );
  check(
    (await request("/http_player/opengraph-image", "GET", undefined, ""))
      .status === 404,
    "rascunho não gera imagem de compartilhamento",
  );
  saved = await request("/api/profile", "PUT", { ...profile, published: true });
  check(saved.status === 200, "perfil pode ser publicado");
  const publicPage = await request("/http_player", "GET", undefined, "");
  const publicHTML = await publicPage.text();
  check(
    publicPage.status === 200 && publicHTML.includes("Meu universo de teste."),
    "perfil público renderiza dados persistidos",
  );
  check(
    publicHTML.includes("&lt;img") &&
      !publicHTML.includes("<img src=x onerror="),
    "bio com HTML é escapada, sem executar conteúdo do usuário",
  );
  check(
    publicHTML.includes("Blox Fruits") && publicHTML.includes("www.roblox.com"),
    "página pública renderiza cartão persistido e destino seguro",
  );
  check(
    !publicHTML.includes("<script>alert(1)</script>"),
    "nome do cartão é escapado no HTML público",
  );
  const loaded = await (await request("/api/profile")).json();
  check(
    loaded.profile.gamerCards[0].id === profile.gamerCards[0].id,
    "API do dono preserva ID e conteúdo do cartão",
  );
  const dataExport = await (await request("/api/account/export")).json();
  check(
    dataExport.profile.gamerCards.length === 1,
    "exportação inclui cartões gamer",
  );
  const og = await request(
    "/http_player/opengraph-image",
    "GET",
    undefined,
    "",
  );
  check(
    og.status === 200 && og.headers.get("content-type")?.includes("image/png"),
    "imagem de compartilhamento gerada",
  );
  check(
    og.headers.get("cache-control")?.includes("no-store"),
    "Open Graph não fica em cache após despublicação",
  );
  check(
    (await request("/api/views/http_player", "POST", undefined, "")).status ===
      204,
    "visita agregada é registrada",
  );
  const destination = await request(
    `/go/${profile.links[0].id}`,
    "GET",
    undefined,
    "",
  );
  check(
    destination.status === 302 &&
      destination.headers.get("location") === "https://example.com/channel",
    "link redireciona ao destino persistido",
  );
  const stats = await (await request("/api/stats")).json();
  check(stats.views === 1 && !stats.days, "Free recebe resumo sem dados Pro");
  const user = await fixture.db.user.findUniqueOrThrow({
    where: { email: credentials.email },
  });
  await fixture.db.entitlement.create({
    data: { userId: user.id, plan: "PRO" },
  });
  profile = loaded.profile;
  const premium = await request("/api/profile", "PUT", {
    ...profile,
    themeId: "galaxy-purple",
    backgroundColor: "#100924",
    backgroundEffect: "stars",
    avatarEffect: "ring",
    buttonEffect: "shine",
    entranceEffect: "sequence",
  });
  check(premium.status === 200, "entitlement real permite tema e efeitos Pro");
  const premiumHTML = await (
    await request("/http_player", "GET", undefined, "")
  ).text();
  check(
    premiumHTML.includes("theme-galaxy-purple") &&
      premiumHTML.includes("bg-effect-stars"),
    "renderer público aplica aparência Pro persistida",
  );
  const detailed = await (await request("/api/stats")).json();
  check(
    detailed.pro && detailed.days.length === 30 && detailed.totalClicks === 1,
    "estatísticas Pro usam agregados reais",
  );
  await fixture.db.entitlement.update({
    where: { userId: user.id },
    data: { expiresAt: new Date(0) },
  });
  const expiredHTML = await (
    await request("/http_player", "GET", undefined, "")
  ).text();
  check(
    expiredHTML.includes("theme-midnight-purple") &&
      expiredHTML.includes("bg-effect-none"),
    "expiração revoga personalização Pro no servidor",
  );
  check(
    (await request("/api/auth/sign-out", "POST", {})).status === 200,
    "logout revoga sessão",
  );
  check(
    (await request("/dashboard")).status === 307,
    "cookie antigo não reabre dashboard",
  );
  const again = await request(
    "/api/auth/sign-in/email",
    "POST",
    credentials,
    "",
  );
  cookie =
    again.headers
      .getSetCookie()
      .find((c) => c.includes("session_token="))
      ?.split(";")[0] || "";
  check(
    (await request("/api/auth/delete-user", "POST", { password })).status ===
      200,
    "exclusão confirmada por senha funciona",
  );
  check((await fixture.db.user.count()) === 0, "conta removida do banco");
  check(
    (await request("/http_player", "GET", undefined, "")).status === 404,
    "página excluída não permanece pública",
  );
  check(
    (await request("/http_player/opengraph-image", "GET", undefined, ""))
      .status === 404,
    "imagem da conta excluída também retorna 404",
  );
  console.log(`HTTP smoke: ${checks} verificações aprovadas.`);
} finally {
  app.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    if (app.exitCode !== null) resolve();
    else {
      app.once("exit", () => resolve());
      setTimeout(() => {
        app.kill("SIGKILL");
        resolve();
      }, 5000).unref();
    }
  });
  await fixture.close();
}
