import { describe, it, expect } from "vitest";
import { parse } from "dotenv";
import { validateProductionEnv } from "../scripts/production-env.mjs";
import { ensureLocalSecret } from "../scripts/local-env.mjs";
const local = {
  BETTER_AUTH_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/vibepage",
  BETTER_AUTH_SECRET: "local-integration-key-at-least-32-characters",
};
const publicConfig = {
  ...local,
  BETTER_AUTH_URL: "https://vibepage.example.com",
  BETTER_AUTH_SECRET: "7TbwBxbMZbZKz5bQe3UZhHZAV4CZpScvXx9T3rWkjyq",
  REQUIRE_EMAIL_VERIFICATION: "true",
  SMTP_HOST: "smtp.example.com",
  SMTP_FROM: "hello@example.com",
  SMTP_USER: "test",
  SMTP_PASSWORD: "test",
  SMTP_PORT: "587",
};
describe("Configuração de execução de produção", () => {
  it("permite produção local explícita e pública com SMTP", () => {
    expect(validateProductionEnv(local).origin).toBe("http://localhost:3000");
    expect(validateProductionEnv(publicConfig).emailVerificationRequired).toBe(
      true,
    );
  });
  it.each([
    {},
    { ...local, BETTER_AUTH_SECRET: "" },
    {
      ...publicConfig,
      BETTER_AUTH_SECRET: "ci-only-placeholder-secret-which-is-public",
    },
    { ...publicConfig, BETTER_AUTH_URL: "http://public.example.com" },
    { ...publicConfig, BETTER_AUTH_URL: "https://public.example.com/path" },
    {
      ...publicConfig,
      BETTER_AUTH_URL: "https://user:pass@public.example.com",
    },
    { ...publicConfig, DATABASE_URL: "sqlite:test" },
    { ...publicConfig, AUTH_IP_HEADER: "x-real-ip, x-forwarded-for" },
    { ...publicConfig, SMTP_PASSWORD: "" },
    { ...publicConfig, REQUIRE_EMAIL_VERIFICATION: "false" },
    { ...publicConfig, SMTP_PORT: "99999" },
  ])(
    "rejeita configuração incompleta/insegura sem revelar credenciais",
    (env) => {
      expect(() => validateProductionEnv(env)).toThrow(
        "Configuração de produção inválida",
      );
    },
  );
  it("gera segredo quando a chave está ausente ou vazia sem rotacionar uma chave válida", () => {
    const missing = ensureLocalSecret("DATABASE_URL=local\n");
    expect(parse(missing).BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(
      parse(ensureLocalSecret('BETTER_AUTH_SECRET=""\n')).BETTER_AUTH_SECRET
        .length,
    ).toBeGreaterThanOrEqual(32);
    const existing = `BETTER_AUTH_SECRET="${local.BETTER_AUTH_SECRET}"\n`;
    expect(ensureLocalSecret(existing)).toBe(existing);
  });
});
