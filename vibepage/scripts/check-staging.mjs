import { readFile } from "node:fs/promises";
import { parse } from "dotenv";
import { validateStagingEnv } from "./staging-env.mjs";
try {
  const env = parse(await readFile(process.argv[2] || ".env.staging"));
  validateStagingEnv(env);
  console.log(
    "Configuração estrutural aprovada. Isso não valida Docker, DNS, TLS, PostgreSQL nativo, SMTP externo ou prontidão do beta.",
  );
} catch {
  console.error(
    "Configuração de homologação incompleta ou inválida. Confira os campos obrigatórios de .env.staging.example; nenhum segredo foi impresso.",
  );
  process.exitCode = 1;
}
