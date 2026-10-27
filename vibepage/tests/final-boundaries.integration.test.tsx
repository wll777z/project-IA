import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { setupDB } from "./setup-db";
import { ProfileBlocks } from "../src/components/profile-blocks";
import { demoProfile } from "../src/lib/demo-profile";
const origin = "https://vibepage.example.test";
const credentials = {
  email: "audit-boundaries@example.com",
  password: "isolated-audit-password-123",
};
let f: Awaited<ReturnType<typeof setupDB>>,
  authModule: typeof import("../src/lib/auth"),
  strict: ReturnType<typeof import("../src/lib/auth").createAuth>,
  cookie: string,
  userId: string,
  verifyURL: string;
beforeAll(async () => {
  f = await setupDB();
  process.env.BETTER_AUTH_URL = origin;
  authModule = await import("../src/lib/auth");
  strict = authModule.createAuth({
    requireVerification: true,
    deliver: async (_to, _subject, text) => {
      verifyURL = text.match(/https:\/\/\S+/)![0];
    },
  });
  await strict.handler(
    new Request(origin + "/api/auth/sign-up/email", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ ...credentials, name: "Audit" }),
    }),
  );
  userId = (
    await f.db.user.findUniqueOrThrow({ where: { email: credentials.email } })
  ).id;
});
afterAll(async () => f?.close());
const request = (path: string, session = "") =>
  new Request(origin + path, { headers: session ? { cookie: session } : {} });
it("origem HTTPS usa cookies protegidos e bloqueia sessão legada ainda não verificada", async () => {
  const make = () =>
    new Request(origin + "/api/auth/sign-in/email", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(credentials),
    });
  expect((await strict.handler(make())).status).toBe(403);
  const legacy = await authModule.auth.handler(make());
  expect(legacy.status).toBe(200);
  const set = legacy.headers.get("set-cookie")!;
  expect(set).toContain("Secure");
  expect(set).toContain("HttpOnly");
  expect(set.toLowerCase()).toContain("samesite=lax");
  cookie = set.split(";")[0];
  process.env.REQUIRE_EMAIL_VERIFICATION = "true";
  const api = await import("../src/app/api/account/export/route");
  expect((await api.GET(request("/api/account/export", cookie))).status).toBe(
    403,
  );
});
it("confirmação libera exportação própria, sem segredos; mutação cross-origin falha", async () => {
  expect([200, 302]).toContain(
    (await strict.handler(new Request(verifyURL))).status,
  );
  const api = await import("../src/app/api/account/export/route");
  const exported = await api.GET(request("/api/account/export", cookie));
  expect(exported.status).toBe(200);
  const value = await exported.json();
  expect(value.email).toBe(credentials.email);
  expect(value.accounts).toBeUndefined();
  expect(value.sessions).toBeUndefined();
  expect(JSON.stringify(value)).not.toContain(credentials.password);
  const collections = await import("../src/app/api/appearances/route");
  expect(
    (
      await collections.POST(
        new Request(origin + "/api/appearances", {
          method: "POST",
          headers: {
            cookie,
            origin: "https://attacker.example",
            "content-type": "application/json",
          },
          body: JSON.stringify({ action: "create", name: "Forged" }),
        }),
      )
    ).status,
  ).toBe(403);
});
it("despublicar revoga QR, VibeCard e mídia da galeria, mantendo acesso do dono", async () => {
  const p = await import("../src/lib/profiles");
  await f.db.entitlement.create({ data: { userId, plan: "PRO" } });
  const key = randomUUID();
  const content = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "red" },
  })
    .webp()
    .toBuffer();
  await f.db.upload.create({
    data: { id: key, userId, kind: "gallery", content, width: 8, height: 8 },
  });
  let profile = await p.saveProfile(userId, {
    ...p.emptyProfile("Audit"),
    username: "audit_boundaries",
    published: true,
    blocks: [
      {
        id: randomUUID(),
        kind: "gallery",
        title: "Gallery",
        description: "",
        icon: "sparkles",
        url: "",
        imageKeys: [key],
        items: [],
        game: "",
        date: "",
        cardId: null,
        hidden: false,
        width: 2,
      },
    ],
  });
  const qr = await import("../src/app/api/qr/[username]/route"),
    vibe = await import("../src/app/api/vibecard/[username]/route"),
    media = await import("../src/app/api/media/[id]/route");
  const params = { params: Promise.resolve({ username: profile.username }) };
  const imageParams = { params: Promise.resolve({ id: key }) };
  expect(
    (await qr.GET(request("/api/qr/" + profile.username), params)).status,
  ).toBe(200);
  expect(
    (await vibe.GET(request("/api/vibecard/" + profile.username), params))
      .status,
  ).toBe(200);
  expect(
    (await media.GET(request("/api/media/" + key), imageParams)).status,
  ).toBe(200);
  profile = await p.saveProfile(userId, { ...profile, published: false });
  expect(
    (await qr.GET(request("/api/qr/" + profile.username), params)).status,
  ).toBe(404);
  expect(
    (await vibe.GET(request("/api/vibecard/" + profile.username), params))
      .status,
  ).toBe(404);
  expect(
    (await media.GET(request("/api/media/" + key), imageParams)).status,
  ).toBe(404);
  expect(
    (await media.GET(request("/api/media/" + key, cookie), imageParams)).status,
  ).toBe(200);
});
it("textos dos blocos escapam conteúdo ativo sem aceitar links executáveis", () => {
  const html = renderToStaticMarkup(
    <ProfileBlocks
      preview
      profile={{
        ...demoProfile,
        blocks: [
          {
            id: randomUUID(),
            kind: "project",
            title: "<script>alert(1)</script>",
            description: '<img src=x onerror="alert(1)">',
            icon: "sparkles",
            url: "javascript:alert(1)",
            imageKeys: [],
            items: [],
            game: "",
            date: "",
            cardId: null,
            hidden: false,
            width: 2,
          },
        ],
      }}
    />,
  );
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain("<img src=x");
});
