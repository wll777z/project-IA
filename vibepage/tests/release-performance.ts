// Isolated local probe. Never connects to an operator database or SMTP provider.
import { setupDB } from "./setup-db";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
Object.assign(process.env, { NODE_ENV: "test" });
const fixture = await setupDB();
const probe = createServer();
await new Promise<void>((r) => probe.listen(0, "127.0.0.1", r));
const address = probe.address();
assert(address && typeof address !== "string");
const port = address.port;
await new Promise<void>((r) => probe.close(() => r()));
const origin = `http://127.0.0.1:${port}`;
process.env.BETTER_AUTH_URL = origin;
const { emptyProfile, saveProfile } = await import("../src/lib/profiles");
const { demoProfile } = await import("../src/lib/demo-profile");
const { auth } = await import("../src/lib/auth");
const credentials = {
  email: "perf@example.test",
  password: "isolated-perf-password-123",
};
const registered = await auth.api.signUpEmail({
  body: { ...credentials, name: "Synthetic audit" },
});
const userId = registered.user.id;
const login = await auth.handler(
  new Request(origin + "/api/auth/sign-in/email", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(credentials),
  }),
);
assert.equal(login.status, 200);
const cookie = login.headers.get("set-cookie")!.split(";")[0];
await fixture.db.entitlement.create({ data: { userId, plan: "PRO" } });
const profile = await saveProfile(userId, {
  ...emptyProfile("Synthetic audit"),
  username: "audit_perf",
  published: true,
  gamerCards: Array.from({ length: 12 }, (_, i) => ({
    ...demoProfile.gamerCards[0],
    id: randomUUID(),
    displayName: `Audit Card ${i}`,
  })),
  links: Array.from({ length: 100 }, (_, i) => ({
    id: randomUUID(),
    title: `Audit Link ${i}`,
    url: `https://example.com/${i}`,
  })),
});
const child = spawn(process.execPath, [".next/standalone/launch.mjs"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: String(port),
    NEXT_TELEMETRY_DISABLED: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
child.stdout.on("data", (c) => {
  serverOutput += c.toString();
});
child.stderr.on("data", (c) => {
  serverOutput += c.toString();
});
const round = (v: number) => Math.round(v * 100) / 100;
async function sample(path: string, n: number, session = "") {
  const results = [];
  let bytes = 0,
    html = "";
  for (let i = 0; i < n; i++) {
    const start = performance.now();
    const response = await fetch(origin + path, {
      headers: session ? { cookie: session } : {},
    });
    assert.equal(response.status, 200);
    const body = await response.text();
    results.push(round(performance.now() - start));
    bytes = Buffer.byteLength(body);
    html = body;
  }
  const warm = results.slice(1).sort((a, b) => a - b);
  return {
    coldMs: results[0],
    warmMedianMs: warm[Math.floor(warm.length / 2)],
    warmP95Ms: warm[Math.ceil(warm.length * 0.95) - 1],
    samplesMs: results,
    decodedBytes: bytes,
    html,
  };
}
try {
  const deadline = Date.now() + 30000;
  while (true) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (Date.now() > deadline)
      throw new Error("Standalone failed: " + serverOutput.slice(-1000));
    await new Promise((r) => setTimeout(r, 100));
  }
  const page = await sample("/audit_perf", 10);
  assert(
    page.html.includes("Audit Link 99") && page.html.includes("Audit Card 11"),
  );
  const { getPublicProfile } = await import("../src/lib/public-profile");
  const reads = [];
  for (let i = 0; i < 10; i++) {
    const t = performance.now();
    assert(await getPublicProfile(profile.username));
    reads.push(round(performance.now() - t));
  }
  const assets = [
    ...new Set(
      [...page.html.matchAll(/src="([^"?]+\.js)(?:\?[^\"]*)?"/g)].map(
        (m) => m[1],
      ),
    ),
  ];
  const scripts = [];
  for (const path of assets) {
    const r = await fetch(origin + path);
    assert.equal(r.status, 200);
    const bytes = Buffer.from(await r.arrayBuffer());
    scripts.push({
      path,
      decodedBytes: bytes.length,
      gzipEstimateBytes: gzipSync(bytes).length,
    });
  }
  const png = [];
  const { vibeCardPNG } = await import("../src/lib/sharing");
  for (const style of [
    "minimal",
    "neon",
    "holographic",
    "galaxy",
    "retro",
  ] as const) {
    const cpu = process.cpuUsage();
    const before = process.memoryUsage().rss;
    const t = performance.now();
    const response = await vibeCardPNG(profile, style);
    const bytes = await response.arrayBuffer();
    const cost = process.cpuUsage(cpu);
    png.push({
      style,
      ms: round(performance.now() - t),
      bytes: bytes.byteLength,
      parentCpuMs: round((cost.user + cost.system) / 1000),
      parentRssMiB: round(process.memoryUsage().rss / 1024 ** 2),
      parentRssDeltaMiB: round(
        (process.memoryUsage().rss - before) / 1024 ** 2,
      ),
    });
  }
  const { html: _profile, ...profileAPI } = await sample(
    "/api/profile",
    10,
    cookie,
  );
  const { html: _stats, ...statsAPI } = await sample(
    "/api/stats/advanced?period=7",
    10,
    cookie,
  );
  void _profile;
  void _stats;
  const { html: _html, ...pageMetrics } = page;
  void _html;
  const evidence = {
    date: new Date().toISOString(),
    environment:
      "Node standalone loopback + isolated PGlite; not production PostgreSQL or mobile network",
    profile: { cards: 12, links: 100 },
    publicProfileHTTP: pageMetrics,
    authenticatedProfileAPI: profileAPI,
    authenticatedStatsAPI: statsAPI,
    publicProfileDomainReadMs: reads,
    scripts,
    scriptTotals: {
      decodedBytes: scripts.reduce((n, s) => n + s.decodedBytes, 0),
      gzipEstimateBytes: scripts.reduce((n, s) => n + s.gzipEstimateBytes, 0),
    },
    png,
    limits: [
      "10 sequential samples, not load or multi-process concurrency",
      "PNG CPU/RSS refer to the probe process including PGlite/Prisma, not an isolated server worker",
      "No native PostgreSQL, SMTP, real-user Web Vitals, slow-mobile network or animation CPU measurement",
    ],
  };
  await writeFile(".next/release-profile.html", page.html);
  await mkdir("docs/evidence", { recursive: true });
  await writeFile(
    "docs/evidence/release-performance.json",
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  child.kill("SIGTERM");
  await new Promise<void>((r) => {
    if (child.exitCode !== null) r();
    else child.once("exit", () => r());
  });
  await fixture.close();
}
