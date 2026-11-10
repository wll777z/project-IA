import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("envia recuperação por HTTPS sem depender de SMTP", async () => {
  vi.stubEnv("RESEND_API_KEY", "test-only-key");
  vi.stubEnv("MAIL_FROM", "VibePage <conta@example.com>");
  const fetchMail = vi
    .fn()
    .mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMail);
  const { mailConfigured, sendMail } = await import("../src/lib/mail");
  expect(mailConfigured).toBe(true);
  await sendMail(
    "player@example.com",
    "Recuperar senha",
    "Link de recuperação",
  );
  const [url, options] = fetchMail.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  expect(JSON.parse(options.body)).toEqual({
    from: "VibePage <conta@example.com>",
    to: ["player@example.com"],
    subject: "Recuperar senha",
    text: "Link de recuperação",
  });
  expect(options.headers.Authorization).toBe("Bearer test-only-key");
});

it("não informa sucesso quando o provedor recusa o envio", async () => {
  vi.stubEnv("RESEND_API_KEY", "test-only-key");
  vi.stubEnv("MAIL_FROM", "conta@example.com");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("private details", { status: 403 })),
  );
  const { sendMail } = await import("../src/lib/mail");
  await expect(sendMail("player@example.com", "Senha", "Link")).rejects.toThrow(
    "Falha no envio do e-mail de recuperação",
  );
});

it("exige remetente e credencial antes de habilitar recuperação", async () => {
  for (const name of [
    "MAIL_FROM",
    "SMTP_HOST",
    "SMTP_FROM",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ])
    vi.stubEnv(name, "");
  vi.stubEnv("RESEND_API_KEY", "test-only-key");
  const { mailConfigured, sendMail } = await import("../src/lib/mail");
  expect(mailConfigured).toBe(false);
  await expect(sendMail("player@example.com", "Senha", "Link")).rejects.toThrow(
    "não configurado",
  );
});
