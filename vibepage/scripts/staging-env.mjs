import { z } from "zod";
import { validateProductionEnv } from "./production-env.mjs";
export function validateStagingEnv(env) {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(env.POSTGRES_PASSWORD || ""))
    throw new Error(
      "POSTGRES_PASSWORD precisa de pelo menos 32 caracteres URL-safe, gerados aleatoriamente.",
    );
  const databaseURL = `postgresql://vibepage:${env.POSTGRES_PASSWORD}@db:5432/vibepage?schema=public`;
  const result = validateProductionEnv({
    ...env,
    DATABASE_URL: databaseURL,
    REQUIRE_EMAIL_VERIFICATION: "true",
  });
  const domain = z
    .string()
    .regex(/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/)
    .parse(env.VIBEPAGE_DOMAIN);
  if (
    result.origin !== `https://${domain}` ||
    ["localhost", "127.0.0.1"].includes(domain)
  )
    throw new Error(
      "BETTER_AUTH_URL deve ser HTTPS e corresponder ao domínio real de homologação.",
    );
  z.email().parse(env.TLS_EMAIL);
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(env.STAGING_BASIC_USER || ""))
    throw new Error(
      "Defina um usuário seguro para o acesso privado à homologação.",
    );
  if (
    !/^\$2[abxy]\$(?:1[0-6])\$[./A-Za-z0-9]{53}$/.test(
      env.STAGING_BASIC_PASSWORD_HASH || "",
    )
  )
    throw new Error(
      "STAGING_BASIC_PASSWORD_HASH deve ser bcrypt válido (custo 10–16), não senha em texto.",
    );
  if (!["true", "false"].includes(env.SUPPORT_INTAKE_ENABLED ?? "false"))
    throw new Error("SUPPORT_INTAKE_ENABLED aceita true ou false.");
  if (env.SUPPORT_INTAKE_ENABLED === "true") {
    z.object({
      controller: z.string().trim().min(2),
      contact: z.email(),
      version: z.string().trim().min(1),
      retention: z.string().trim().min(20),
      age: z.string().trim().min(20),
      days: z.coerce.number().int().min(7).max(365),
    }).parse({
      controller: env.LEGAL_CONTROLLER_NAME,
      contact: env.LEGAL_CONTACT_EMAIL,
      version: env.LEGAL_NOTICE_VERSION,
      retention: env.LEGAL_RETENTION_NOTICE,
      age: env.LEGAL_AGE_NOTICE,
      days: env.SUPPORT_RETENTION_DAYS,
    });
  }
  return {
    origin: result.origin,
    supportEnabled: env.SUPPORT_INTAKE_ENABLED === "true",
  };
}
