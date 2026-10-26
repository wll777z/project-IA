import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
let pg: PGlite;
let server: PGLiteSocketServer;
let auth: typeof import("../src/lib/auth").auth;
let db: typeof import("../src/lib/db").db;
let cookie = "";
const origin = "http://localhost:3000";
const email = "player@example.com";
const password = "a-long-secure-passphrase";
async function request(
  path: string,
  body?: object,
  session = "",
  requestOrigin = origin,
) {
  return auth.handler(
    new Request(`${origin}/api/auth/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "content-type": "application/json",
        origin: requestOrigin,
        ...(session ? { cookie: session } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}
beforeAll(async () => {
  pg = await PGlite.create();
  const migrationRoot = new URL("../prisma/migrations/", import.meta.url);
  for (const name of (await readdir(migrationRoot)).sort()) {
    if (name !== "migration_lock.toml")
      await pg.exec(
        await readFile(new URL(name + "/migration.sql", migrationRoot), "utf8"),
      );
  }
  server = new PGLiteSocketServer({
    db: pg,
    port: 0,
    host: "127.0.0.1",
    maxConnections: 20,
  });
  await server.start();
  process.env.DATABASE_URL = `postgresql://postgres:postgres@${server.getServerConn()}/postgres`;
  process.env.BETTER_AUTH_URL = origin;
  process.env.BETTER_AUTH_SECRET =
    "integration-only-secret-which-is-never-for-production-12345";
  ({ auth } = await import("../src/lib/auth"));
  ({ db } = await import("../src/lib/db"));
});
afterAll(async () => {
  await db?.$disconnect();
  await server?.stop();
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  await pg?.close();
});
describe("Autenticação real via Prisma e PostgreSQL embarcado", () => {
  it("recusa sessão ausente", async () => {
    expect(await (await request("get-session")).json()).toBeNull();
  });
  it("recusa origem externa", async () => {
    const r = await request(
      "sign-up/email",
      { email, password, name: "Player" },
      "",
      "https://attacker.example",
    );
    expect(r.status).toBe(403);
  });
  it("valida também no servidor", async () => {
    const r = await request("sign-up/email", {
      email,
      password: "short",
      name: "Player",
    });
    expect(r.ok).toBe(false);
    expect(await db.user.count()).toBe(0);
  });
  it("cadastra sem auto-login e protege a senha", async () => {
    const r = await request("sign-up/email", {
      email,
      password,
      name: "Player",
    });
    expect(r.status).toBe(200);
    expect((await r.json()).token).toBeNull();
    const a = await db.account.findFirstOrThrow();
    expect(a.password).not.toBe(password);
    expect(a.password?.length).toBeGreaterThan(60);
    expect(await db.session.count()).toBe(0);
  });
  it("não revela duplicidade de e-mail", async () => {
    await db.rateLimit.deleteMany();
    const r = await request("sign-up/email", {
      email,
      password,
      name: "Player",
    });
    expect(r.status).toBe(200);
    expect((await r.json()).token).toBeNull();
    expect(await db.user.count()).toBe(1);
  });
  it("retorna erro genérico para credenciais erradas", async () => {
    const a = await request("sign-in/email", {
      email,
      password: "another-long-wrong-password",
    });
    const b = await request("sign-in/email", {
      email: "missing@example.com",
      password,
    });
    expect(a.status).toBe(b.status);
    expect((await a.json()).code).toBe((await b.json()).code);
  });
  it("entra com cookie HttpOnly e SameSite", async () => {
    const r = await request("sign-in/email", { email, password });
    expect(r.status).toBe(200);
    const header = r.headers.get("set-cookie") || "";
    expect(header).toContain("HttpOnly");
    expect(header.toLowerCase()).toContain("samesite=lax");
    cookie = header.split(";")[0];
    const session = await (
      await request("get-session", undefined, cookie)
    ).json();
    expect(session.user.email).toBe(email);
  });
  it("não permite alteração de campos fora da etapa", async () => {
    const r = await request("update-user", { name: "hacked" }, cookie);
    expect(r.status).toBe(403);
  });
  it("expira sessões no banco", async () => {
    await db.session.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(
      await (await request("get-session", undefined, cookie)).json(),
    ).toBeNull();
    await db.rateLimit.deleteMany();
    const r = await request("sign-in/email", { email, password });
    cookie = (r.headers.get("set-cookie") || "").split(";")[0];
  });
  it("logout revoga sessão", async () => {
    const r = await request("sign-out", {}, cookie);
    expect(r.status).toBe(200);
    expect(
      await (await request("get-session", undefined, cookie)).json(),
    ).toBeNull();
  });
  it("limita tentativas, inclusive concorrentes", async () => {
    await db.rateLimit.deleteMany();
    const responses = await Promise.all(
      Array.from({ length: 9 }, () =>
        request("sign-in/email", { email, password: "wrong-long-passphrase" }),
      ),
    );
    expect(
      responses.filter((r) => r.status === 429).length,
    ).toBeGreaterThanOrEqual(4);
  });
  it("bloqueia exclusão anônima ou senha errada", async () => {
    await db.rateLimit.deleteMany();
    expect((await request("delete-user", { password })).ok).toBe(false);
    const login = await request("sign-in/email", { email, password });
    cookie = (login.headers.get("set-cookie") || "").split(";")[0];
    expect(
      (
        await request(
          "delete-user",
          { password: "wrong-long-passphrase" },
          cookie,
        )
      ).ok,
    ).toBe(false);
    expect(await db.user.count()).toBe(1);
  });
  it("exige senha mesmo com sessão recente", async () => {
    expect((await request("delete-user", {}, cookie)).ok).toBe(false);
    expect(await db.user.count()).toBe(1);
  });
  it("exclui dados e sessões em cascata", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    await db.entitlement.create({ data: { userId: user.id } });
    await db.verification.create({
      data: {
        id: "orphan-reset",
        identifier: "reset-password-token",
        value: user.id,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const r = await request("delete-user", { password }, cookie);
    expect(r.status).toBe(200);
    expect(await db.user.count()).toBe(0);
    expect(await db.account.count()).toBe(0);
    expect(await db.session.count()).toBe(0);
    expect(await db.entitlement.count()).toBe(0);
    expect(await db.verification.count()).toBe(0);
  });
  it("aplica unicidade e restrições do perfil", async () => {
    await db.theme.create({
      data: { id: "midnight-purple", name: "Midnight Purple" },
    });
    await db.user.create({
      data: { id: "profile-owner", email: "owner@example.com", name: "Owner" },
    });
    await expect(
      db.profile.create({
        data: {
          userId: "profile-owner",
          username: "dashboard",
          displayName: "Owner",
        },
      }),
    ).rejects.toThrow();
    await db.profile.create({
      data: {
        userId: "profile-owner",
        username: "player_1",
        displayName: "Owner",
      },
    });
    await expect(
      db.profile.create({
        data: {
          userId: "profile-owner",
          username: "other_user",
          displayName: "Other",
        },
      }),
    ).rejects.toThrow();
    await db.user.delete({ where: { id: "profile-owner" } });
    expect(await db.profile.count()).toBe(0);
  });
});
