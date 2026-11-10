import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { setupDB } from "./setup-db";
const delivery = vi.hoisted(() => vi.fn());
vi.mock("../src/lib/mail", () => ({
  mailConfigured: true,
  sendMail: delivery,
}));
let fixture: Awaited<ReturnType<typeof setupDB>>;
let auth: typeof import("../src/lib/auth").auth;
const origin = "http://localhost:3000";
async function request(path: string, body: object) {
  return auth.handler(
    new Request(`${origin}/api/auth/${path}`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
beforeAll(async () => {
  fixture = await setupDB();
  ({ auth } = await import("../src/lib/auth"));
});
afterAll(async () => {
  await fixture?.close();
});
it("recupera por link, revoga sessões e impede reutilizar o token", async () => {
  const email = "recovery@example.com";
  const password = "original-long-passphrase";
  expect(
    (await request("sign-up/email", { email, password, name: "Player" })).ok,
  ).toBe(true);
  expect((await request("sign-in/email", { email, password })).ok).toBe(true);
  expect(await fixture.db.session.count()).toBe(1);
  const reset = await request("request-password-reset", {
    email,
    redirectTo: "/redefinir-senha",
  });
  expect(reset.ok).toBe(true);
  expect(delivery).toHaveBeenCalledTimes(1);
  const [recipient, , text] = delivery.mock.calls[0];
  expect(recipient).toBe(email);
  const url = new URL(text.match(/https?:\/\/\S+/)[0]);
  expect(url.origin).toBe(origin);
  const follow = await auth.handler(new Request(url));
  expect(follow.status).toBe(302);
  const redirect = new URL(follow.headers.get("location")!, origin);
  expect(redirect.pathname).toBe("/redefinir-senha");
  const token = redirect.searchParams.get("token");
  expect(token).toBeTruthy();
  const newPassword = "new-long-secure-passphrase";
  expect((await request("reset-password", { token, newPassword })).ok).toBe(
    true,
  );
  expect(await fixture.db.session.count()).toBe(0);
  expect(
    (await request("reset-password", { token, newPassword: password })).ok,
  ).toBe(false);
  expect((await request("sign-in/email", { email, password })).ok).toBe(false);
  expect(
    (await request("sign-in/email", { email, password: newPassword })).ok,
  ).toBe(true);
  const unknown = await request("request-password-reset", {
    email: "missing@example.com",
    redirectTo: "/redefinir-senha",
  });
  expect(unknown.status).toBe(reset.status);
  expect(delivery).toHaveBeenCalledTimes(1);
});
