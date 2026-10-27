import { afterEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  send: vi.fn(),
  close: vi.fn(),
  create: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: { createTransport: fixture.create } }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});
async function configured(port = "587") {
  vi.resetModules();
  for (const [name, value] of Object.entries({
    SMTP_HOST: "smtp.invalid",
    SMTP_USER: "synthetic",
    SMTP_PASSWORD: "synthetic-fixture",
    SMTP_FROM: "sender@example.test",
    SMTP_PORT: port,
  }))
    vi.stubEnv(name, value);
  fixture.create.mockReturnValue({
    sendMail: fixture.send,
    close: fixture.close,
  });
  fixture.send.mockResolvedValue({});
  return import("../src/lib/mail");
}
it("SMTP exige STARTTLS em 587 e limita espera sem logging de conteúdo", async () => {
  const mail = await configured();
  await mail.sendMail("receiver@example.test", "Fixture", "Synthetic text");
  expect(fixture.create).toHaveBeenCalledWith(
    expect.objectContaining({
      secure: false,
      requireTLS: true,
      connectionTimeout: 10000,
      socketTimeout: 20000,
      logger: false,
      debug: false,
    }),
  );
  expect(fixture.close).toHaveBeenCalled();
});
it("SMTP 465 usa TLS implícito", async () => {
  const mail = await configured("465");
  await mail.sendMail("receiver@example.test", "Fixture", "Text");
  expect(fixture.create).toHaveBeenCalledWith(
    expect.objectContaining({ secure: true, requireTLS: false }),
  );
});
it("falha do provedor não repassa destinatário ou credenciais para logs/erro", async () => {
  const mail = await configured();
  fixture.send.mockRejectedValue(
    new Error("private-recipient@example.test SMTP synthetic-secret"),
  );
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    await expect(
      mail.sendMail("receiver@example.test", "Fixture", "Text"),
    ).rejects.toThrow("Serviço de e-mail temporariamente indisponível.");
    expect(log.mock.calls).toEqual([["SMTP_DELIVERY_FAILED"]]);
    expect(fixture.close).toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
