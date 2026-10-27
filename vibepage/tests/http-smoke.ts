import sharp from "sharp";
import jsQR from "jsqr";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
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
    SUPPORT_INTAKE_ENABLED: "true",
    SUPPORT_RETENTION_DAYS: "30",
    LEGAL_CONTROLLER_NAME: "Synthetic staging operator",
    LEGAL_CONTACT_EMAIL: "privacy@example.test",
    LEGAL_NOTICE_VERSION: "http-test-v1",
    LEGAL_RETENTION_NOTICE:
      "Synthetic retention notice for isolated HTTP tests only.",
    LEGAL_AGE_NOTICE: "Synthetic age policy for isolated HTTP tests only.",
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
  check(
    landingHTML.includes('href="/demo"'),
    "landing oferece acesso à rota funcional da demo",
  );
  check(
    (await request("/demo")).status === 200,
    "demonstração com editor responde HTTP 200",
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
  const backgroundImage = await sharp({
    create: { width: 24, height: 24, channels: 3, background: "#91f2df" },
  })
    .png()
    .toBuffer();
  const uploadBackground = () =>
    fetch(origin + "/api/uploads/background", {
      method: "POST",
      headers: { origin, cookie, "content-type": "image/png" },
      body: new Uint8Array(backgroundImage),
    });
  check(
    (await uploadBackground()).status === 403,
    "upload de fundo é restrito ao Pro no servidor",
  );
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
  check(
    (await request("/api/qr/http_player")).status === 200,
    "QR está disponível para perfil publicado",
  );
  check(
    (await request("/api/vibecard/http_player")).status === 200,
    "Free gera VibeCard Minimal sem assinatura fictícia",
  );
  check(
    (
      await request("/api/appearances", "POST", {
        action: "create",
        name: "No Free",
      })
    ).status === 403,
    "Free não cria coleções pela API",
  );
  check(
    (await request("/api/stats/advanced")).status === 403,
    "Free não consulta analytics avançado",
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
  const { consumeLimit } = await import("../src/lib/limits");
  for (let i = 0; i < 12; i++) {
    try {
      await consumeLimit("shared", "public-og", 12);
    } catch {
      /* Exhaust this isolated test bucket. */
    }
  }
  check(
    (await request("/http_player/opengraph-image", "GET", undefined, ""))
      .status === 429,
    "Open Graph limita geração PNG no servidor",
  );
  const ogBucket =
    "app:" +
    createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
      .update("public-og:shared")
      .digest("hex");
  await fixture.db.rateLimit.deleteMany({ where: { key: ogBucket } });
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
  const backgroundUpload = await uploadBackground();
  check(
    backgroundUpload.status === 200,
    "Pro envia imagem de fundo pela rota real",
  );
  const backgroundKey = (await backgroundUpload.json()).key;
  profile = loaded.profile;
  const premium = await request("/api/profile", "PUT", {
    ...profile,
    themeId: "aurora-blue",
    backgroundKey,
    backgroundColor: "#091627",
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
    premiumHTML.includes("theme-aurora-blue") &&
      premiumHTML.includes("bg-effect-stars"),
    "renderer público aplica aparência Pro persistida",
  );
  check(
    premiumHTML.includes(`/api/media/${backgroundKey}`),
    "renderer Pro inclui fundo publicado",
  );
  check(
    (await request(`/api/media/${backgroundKey}`, "GET", undefined, ""))
      .status === 200,
    "imagem de fundo Pro é pública enquanto permitido",
  );
  const detailed = await (await request("/api/stats")).json();
  check(
    detailed.pro && detailed.days.length === 30 && detailed.totalClicks === 1,
    "estatísticas Pro usam agregados reais",
  );
  const studioProfile = (await (await request("/api/profile")).json()).profile;
  const studioSaved = await request("/api/profile", "PUT", {
    ...studioProfile,
    studio: {
      ...studioProfile.studio,
      layout: "dashboard",
      columns: 2,
      width: "wide",
    },
    blocks: [
      {
        id: randomUUID(),
        kind: "achievement",
        title: "Conquista pessoal",
        description: "Informada pelo usuário",
        icon: "sparkles",
        url: "",
        imageKeys: [],
        items: [],
        game: "Minecraft",
        date: "2026-10-27",
        cardId: null,
        hidden: false,
        width: 2,
      },
    ],
  });
  check(
    studioSaved.status === 200,
    "Studio e conquista são persistidos pela API real",
  );
  const studioHTML = await (
    await request("/http_player", "GET", undefined, "")
  ).text();
  check(
    studioHTML.includes("studio-layout-dashboard") &&
      studioHTML.includes("Conquista pessoal") &&
      studioHTML.includes("sem verificação oficial"),
    "composição pública exibe layout e conquista autodeclarada",
  );
  const collection = await request("/api/appearances", "POST", {
    action: "create",
    name: "HTTP collection",
  });
  check(collection.status === 200, "coleção salva personalização real");
  const item = await collection.json();
  const agenda = await request("/api/schedules", "POST", {
    action: "create",
    appearanceId: item.id,
    startsAt: new Date(Date.now() + 60000).toISOString(),
    endsAt: new Date(Date.now() + 3600000).toISOString(),
    timeZone: "America/Sao_Paulo",
  });
  check(agenda.status === 200, "agenda sazonal grava instantes e fuso");
  const state = await (await request("/api/appearances")).json();
  const applied = await request("/api/appearances", "POST", {
    action: "apply",
    id: item.id,
    profileRevision: state.profile.revision,
  });
  check(
    applied.status === 200,
    "coleção pode ser aplicada sem substituir conteúdo",
  );
  const qrResponse = await request("/api/qr/http_player");
  const qrBytes = Buffer.from(await qrResponse.arrayBuffer());
  const qrRaw = await sharp(qrBytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  check(
    jsQR(new Uint8ClampedArray(qrRaw.data), qrRaw.info.width, qrRaw.info.height)
      ?.data ===
      origin + "/http_player",
    "QR decodifica para URL canônica da instância real",
  );
  const cardResponse = await request("/api/vibecard/http_player?style=galaxy");
  const cardBytes = Buffer.from(await cardResponse.arrayBuffer());
  check(
    cardResponse.status === 200 &&
      (await sharp(cardBytes).metadata()).width === 1280,
    "VibeCard Pro gera PNG na rota de produção",
  );
  check(
    (
      await request(
        `/go/card/${profile.gamerCards[0].id}`,
        "GET",
        undefined,
        "",
      )
    ).headers.get("location") === "https://www.roblox.com/",
    "clique de cartão usa destino salvo e é rastreável",
  );
  const advanced = await (await request("/api/stats/advanced?period=7")).json();
  check(
    advanced.days.length === 90 && advanced.weekly.cardClicks === 1,
    "analytics avançado registra somente cliques reais de cartões",
  );
  const csv = await request("/api/stats/export");
  check(
    csv.status === 200 && csv.headers.get("content-type")?.includes("text/csv"),
    "CSV autenticado é exportado",
  );
  for (const path of [
    "/dashboard/aparencias",
    "/dashboard/compartilhar",
    "/dashboard/analytics",
  ])
    check(
      (await request(path)).status === 200,
      `nova área autenticada renderiza ${path}`,
    );
  const supportBody = {
    kind: "REPORT",
    category: "ABUSE",
    subject: "HTTP moderation test",
    message: 'Test <img src=x onerror="alert(1)">',
    replyEmail: credentials.email,
    username: "http_player",
    noticeVersion: "http-test-v1",
  };
  check(
    (await request("/api/support", "POST", supportBody, "")).status === 503,
    "canal sem administrador não promete receber solicitações",
  );
  await fixture.db.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });
  await fixture.db.administrator.create({
    data: { userId: user.id, phone: "+5511999999999" },
  });
  check(
    (await request("/suporte")).status === 200,
    "suporte configurado renderiza no standalone",
  );
  const report = await request("/api/support", "POST", supportBody, "");
  check(report.status === 201, "denúncia real persiste no canal privado");
  const reportId = (await report.json()).id;
  check(
    (await request("/api/admin/cases", "GET", undefined, "")).status === 401,
    "fila administrativa não é pública",
  );
  check(
    (await request("/api/admin/cases")).status === 200,
    "administrador confirmado acessa fila privada",
  );
  const moderationHTML = await (await request("/dashboard/moderacao")).text();
  check(
    moderationHTML.includes("&lt;img") &&
      !moderationHTML.includes("<img src=x"),
    "administração renderiza denúncias com texto escapado",
  );
  check(
    (
      await request(`/api/admin/cases/${reportId}`, "POST", {
        revision: 0,
        status: "IN_REVIEW",
        note: "Teste HTTP de ocultação",
        action: "hide-profile",
      })
    ).status === 200,
    "administrador registra ocultação de perfil",
  );
  check(
    (await request("/http_player", "GET", undefined, "")).status === 404 &&
      (await request("/api/qr/http_player", "GET", undefined, "")).status ===
        404,
    "moderação retira página e QR públicos",
  );
  check(
    (await request(`/api/media/${backgroundKey}`, "GET", undefined, ""))
      .status === 404,
    "moderação retira acesso anônimo à mídia",
  );
  const ownerState = (await (await request("/api/profile")).json()).profile;
  check(
    (await request("/api/profile", "PUT", { ...ownerState, published: true }))
      .status === 200 &&
      (await request("/http_player", "GET", undefined, "")).status === 404,
    "save do dono não contorna bloqueio administrativo",
  );
  check(
    (
      await request(`/api/admin/cases/${reportId}`, "POST", {
        revision: 1,
        status: "RESOLVED",
        note: "Teste HTTP de restauração",
        action: "restore-profile",
      })
    ).status === 200 &&
      (await request("/http_player", "GET", undefined, "")).status === 200,
    "revisão administrativa restaura perfil sem apagar conteúdo",
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
    !expiredHTML.includes(`/api/media/${backgroundKey}`),
    "expiração omite imagem de fundo do HTML público",
  );
  check(
    (await request(`/api/media/${backgroundKey}`, "GET", undefined, ""))
      .status === 404,
    "expiração bloqueia acesso anônimo à imagem de fundo",
  );
  check(
    !expiredHTML.includes("Conquista pessoal") &&
      expiredHTML.includes("studio-layout-classic"),
    "expiração oculta blocos e aplica layout Free",
  );
  check(
    (await request("/api/stats/export")).status === 403,
    "expiração revoga CSV Pro no backend",
  );
  check(
    (await (await request("/api/appearances")).json()).items.length === 1,
    "downgrade preserva coleção privada",
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
    (await fixture.db.administrator.count()) === 0 &&
      (await fixture.db.supportCase.count({
        where: { replyEmail: credentials.email },
      })) === 0,
    "exclusão revoga administração e limpa contato de suporte",
  );
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
