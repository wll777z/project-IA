import { expect, it } from "vitest";
import { validateStagingEnv } from "../scripts/staging-env.mjs";
const env = {
  POSTGRES_PASSWORD: "generated-test-password-not-production-123",
  BETTER_AUTH_URL: "https://staging.example.test",
  BETTER_AUTH_SECRET: "generated-test-secret-never-production-123456",
  VIBEPAGE_DOMAIN: "staging.example.test",
  TLS_EMAIL: "operator@example.test",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "synthetic",
  SMTP_PASSWORD: "synthetic-not-a-real-smtp-password",
  SMTP_FROM: "sender@example.test",
  STAGING_BASIC_USER: "operator",
  STAGING_BASIC_PASSWORD_HASH: "$2b$12$" + "a".repeat(53),
  SUPPORT_INTAKE_ENABLED: "false",
};
it("valida estrutura privada de homologação sem alegar conexão real", () => {
  expect(validateStagingEnv(env)).toEqual({
    origin: env.BETTER_AUTH_URL,
    supportEnabled: false,
  });
});
it("recusa segredo curto, domínio divergente, HTTP, Basic Auth em texto e SMTP incompleto", () => {
  for (const change of [
    { POSTGRES_PASSWORD: "short" },
    { BETTER_AUTH_SECRET: "short" },
    { BETTER_AUTH_URL: "https://wrong.example.test" },
    { BETTER_AUTH_URL: "http://staging.example.test" },
    { STAGING_BASIC_PASSWORD_HASH: "plaintext-not-accepted" },
    { SMTP_PASSWORD: "" },
  ])
    expect(() => validateStagingEnv({ ...env, ...change })).toThrow();
});
it("habilitar canal exige informações legais, sem dados inventados de operador", () => {
  expect(() =>
    validateStagingEnv({ ...env, SUPPORT_INTAKE_ENABLED: "true" }),
  ).toThrow();
});
