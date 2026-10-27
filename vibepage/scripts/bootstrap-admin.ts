import "dotenv/config";
import { emitKeypressEvents } from "node:readline";
import { parseArgs } from "node:util";
import { db } from "../src/lib/db";
import {
  bootstrapAdministrator,
  bootstrapSchema,
} from "../src/lib/admin-bootstrap";
import { validateProductionEnv } from "./production-env.mjs";
const { values } = parseArgs({
  options: {
    email: { type: "string" },
    phone: { type: "string" },
    "grant-existing": { type: "boolean" },
    "password-stdin": { type: "boolean" },
  },
});
async function hiddenPassword(prompt: string) {
  if (!process.stdin.isTTY)
    throw new Error(
      "Use um terminal interativo, ou --password-stdin com um gerenciador de segredos. Não passe a senha nos argumentos.",
    );
  process.stdout.write(prompt);
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise<string>((resolve, reject) => {
    let password = "";
    const done = () => {
      process.stdin.off("keypress", onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    function onKey(value: string, key: { name?: string; ctrl?: boolean }) {
      if (key.ctrl && key.name === "c") {
        done();
        reject(new Error("Cancelado."));
      } else if (key.name === "return") {
        done();
        resolve(password);
      } else if (key.name === "backspace") {
        password = Array.from(password).slice(0, -1).join("");
      } else if (value && !key.ctrl && password.length < 128) {
        password += value;
      }
    }
    process.stdin.on("keypress", onKey);
  });
}
try {
  validateProductionEnv(process.env);
  const existing = !!values["grant-existing"];
  let password: string | undefined;
  if (!existing) {
    if (values["password-stdin"]) {
      let size = 0;
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        const data = Buffer.from(chunk);
        size += data.length;
        if (size > 1024) throw new Error("Entrada de senha muito grande.");
        chunks.push(data);
      }
      password = Buffer.concat(chunks)
        .toString("utf8")
        .replace(/\r?\n$/, "");
    } else {
      password = await hiddenPassword(
        "Nova senha do administrador (entrada oculta): ",
      );
      const confirmation = await hiddenPassword("Confirme a nova senha: ");
      if (password !== confirmation)
        throw new Error("As senhas não coincidem.");
    }
  }
  const input = bootstrapSchema.safeParse({
    email: values.email ?? process.env.ADMIN_BOOTSTRAP_EMAIL,
    phone: values.phone ?? process.env.ADMIN_BOOTSTRAP_PHONE,
    existing,
    password,
  });
  if (!input.success)
    throw new Error(input.error.issues.map((i) => i.message).join(" "));
  const result = await bootstrapAdministrator(input.data);
  console.log(
    result.pendingVerification
      ? "Conta criada. A administração só será liberada após confirmar o e-mail. Telefone de contato informado, sem verificação SMS."
      : "Administração configurada para conta confirmada. Nenhuma senha existente foi alterada.",
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Não foi possível configurar a administração.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
