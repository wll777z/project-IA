export function validateProductionEnv(env) {
  const fail = (message) => {
    throw new Error(`Configuração de produção inválida: ${message}`);
  };
  let url;
  try {
    url = new URL(env.BETTER_AUTH_URL);
  } catch {
    fail("defina BETTER_AUTH_URL com uma origem explícita.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    fail("BETTER_AUTH_URL deve ser apenas a origem.");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!local && url.protocol !== "https:")
    fail("use HTTPS para uma origem pública.");
  let db;
  try {
    db = new URL(env.DATABASE_URL);
  } catch {
    fail("defina DATABASE_URL.");
  }
  if (!["postgres:", "postgresql:"].includes(db.protocol))
    fail("DATABASE_URL precisa apontar para PostgreSQL.");
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
    fail("use BETTER_AUTH_SECRET com pelo menos 32 caracteres.");
  if (
    !local &&
    /^(build-only|ci-only|integration-only)|placeholder|change.?me/i.test(
      env.BETTER_AUTH_SECRET,
    )
  )
    fail("substitua a chave de exemplo por uma chave aleatória exclusiva.");
  if (env.AUTH_IP_HEADER && !/^[a-z0-9-]{1,80}$/.test(env.AUTH_IP_HEADER))
    fail(
      "AUTH_IP_HEADER deve conter um único nome de cabeçalho em minúsculas.",
    );
  if (
    env.REQUIRE_EMAIL_VERIFICATION &&
    !["true", "false"].includes(env.REQUIRE_EMAIL_VERIFICATION)
  )
    fail("REQUIRE_EMAIL_VERIFICATION aceita true ou false.");
  const required = env.REQUIRE_EMAIL_VERIFICATION === "true";
  const smtp = [env.SMTP_HOST, env.SMTP_FROM, env.SMTP_USER, env.SMTP_PASSWORD];
  if (smtp.some(Boolean) && !smtp.every(Boolean))
    fail("complete SMTP_HOST, SMTP_FROM, SMTP_USER e SMTP_PASSWORD.");
  if (required && !smtp.every(Boolean))
    fail("a confirmação de e-mail exige SMTP configurado.");
  if (!local && !required)
    fail(
      "ative REQUIRE_EMAIL_VERIFICATION=true antes de abrir cadastros ao público.",
    );
  if (
    env.SMTP_PORT &&
    (!/^\d+$/.test(env.SMTP_PORT) ||
      Number(env.SMTP_PORT) < 1 ||
      Number(env.SMTP_PORT) > 65535)
  )
    fail("porta SMTP inválida.");
  return { origin: url.origin, emailVerificationRequired: required };
}
