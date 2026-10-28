import { beforeAll, afterAll, it, expect } from "vitest";
import { setupDB } from "./setup-db";
import { createEmailVerificationToken } from "better-auth/api";
let fixture: Awaited<ReturnType<typeof setupDB>>;
let auth: ReturnType<typeof import("../src/lib/auth").createAuth>;
const messages: { to: string; text: string }[] = [];
const email = "verified@example.com",
  password = "a-long-enough-email-test-password";
async function request(path: string, body?: object, cookie = "") {
  return auth.handler(
    new Request(`http://localhost:3000/api/auth/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}
function lastURL() {
  return messages.at(-1)!.text.match(/http:\/\/\S+/)![0];
}
beforeAll(async () => {
  fixture = await setupDB();
  const { createAuth } = await import("../src/lib/auth");
  auth = createAuth({
    requireVerification: true,
    deliver: async (to, _subject, text) => {
      messages.push({ to, text });
    },
  });
});
afterAll(async () => fixture?.close());
it("cadastro exige confirmação, responde genericamente e não cria sessão", async () => {
  expect(
    (
      await request("sign-up/email", {
        name: "Verified Player",
        email,
        password,
      })
    ).status,
  ).toBe(200);
  expect(messages).toHaveLength(1);
  expect(messages[0].to).toBe(email);
  expect(await fixture.db.session.count()).toBe(0);
  expect(
    (
      await request("sign-up/email", {
        name: "Verified Player",
        email,
        password,
      })
    ).status,
  ).toBe(200);
});
it("não permite login antes de confirmar o e-mail", async () => {
  expect((await request("sign-in/email", { email, password })).status).toBe(
    403,
  );
  expect(await fixture.db.session.count()).toBe(0);
});
it("token de confirmação expirado não verifica conta pendente nem cria sessão", async () => {
  const token = await createEmailVerificationToken(
    process.env.BETTER_AUTH_SECRET!,
    email,
    undefined,
    -60,
  );
  expect((await request(`verify-email?token=${token}`)).ok).toBe(false);
  expect(
    (await fixture.db.user.findUniqueOrThrow({ where: { email } }))
      .emailVerified,
  ).toBe(false);
  expect(await fixture.db.session.count()).toBe(0);
});
it("rejeita token inválido e aceita a confirmação sem auto-login", async () => {
  expect((await request("verify-email?token=invalid")).ok).toBe(false);
  const response = await auth.handler(new Request(lastURL()));
  expect([200, 302]).toContain(response.status);
  expect(
    (await fixture.db.user.findUniqueOrThrow({ where: { email } }))
      .emailVerified,
  ).toBe(true);
  expect(await fixture.db.session.count()).toBe(0);
});
it("repetir confirmação já concluída não cria sessão nem altera identidade", async () => {
  const before = await fixture.db.user.findUniqueOrThrow({ where: { email } });
  const result = await auth.handler(new Request(lastURL()));
  expect([200, 302]).toContain(result.status);
  expect(
    (await fixture.db.user.findUniqueOrThrow({ where: { email } })).id,
  ).toBe(before.id);
  expect(await fixture.db.session.count()).toBe(0);
});
it("recuperação não enumera contas e troca a senha revogando sessões", async () => {
  const login = await request("sign-in/email", { email, password });
  expect(login.status).toBe(200);
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  await fixture.db.rateLimit.deleteMany();
  const known = await request("request-password-reset", {
    email,
    redirectTo: "/redefinir-senha",
  });
  const resetURL = lastURL();
  const missing = await request("request-password-reset", {
    email: "missing@example.com",
    redirectTo: "/redefinir-senha",
  });
  expect(known.status).toBe(missing.status);
  expect(await known.json()).toEqual(await missing.json());
  const link = new URL(resetURL);
  const token = link.pathname.split("/").at(-1)!;
  const newPassword = "a-new-long-enough-passphrase";
  const result = await request("reset-password", { token, newPassword });
  expect(result.status).toBe(200);
  expect(await fixture.db.session.count()).toBe(0);
  expect(
    await (await request("get-session", undefined, cookie)).json(),
  ).toBeNull();
  expect((await request("reset-password", { token, newPassword })).ok).toBe(
    false,
  );
  await fixture.db.rateLimit.deleteMany();
  expect((await request("sign-in/email", { email, password })).ok).toBe(false);
  expect(
    (await request("sign-in/email", { email, password: newPassword })).status,
  ).toBe(200);
});

it("reset expirado não altera senha nem revoga sessão válida", async () => {
  await fixture.db.rateLimit.deleteMany();
  await request("request-password-reset", {
    email,
    redirectTo: "/redefinir-senha",
  });
  const token = new URL(lastURL()).pathname.split("/").at(-1)!;
  const user = await fixture.db.user.findUniqueOrThrow({ where: { email } });
  const before = await fixture.db.account.findFirstOrThrow({
    where: { userId: user.id },
  });
  const sessions = await fixture.db.session.count({
    where: { userId: user.id },
  });
  expect(
    (
      await fixture.db.verification.updateMany({
        where: { identifier: `reset-password:${token}` },
        data: { expiresAt: new Date(0) },
      })
    ).count,
  ).toBe(1);
  expect(
    (
      await request("reset-password", {
        token,
        newPassword: "expired-token-must-not-change-password",
      })
    ).status,
  ).toBe(400);
  expect(
    (await fixture.db.account.findUniqueOrThrow({ where: { id: before.id } }))
      .password,
  ).toBe(before.password);
  expect(await fixture.db.session.count({ where: { userId: user.id } })).toBe(
    sessions,
  );
});
