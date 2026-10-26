import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
let env;
try {
  env = await readFile(".env", "utf8");
} catch {
  env = await readFile(".env.example", "utf8");
}
if (!/^BETTER_AUTH_SECRET=["']?[^"'\r\n]{32,}/m.test(env))
  env = env.replace(
    /^BETTER_AUTH_SECRET=.*$/m,
    `BETTER_AUTH_SECRET="${randomBytes(40).toString("base64url")}"`,
  );
await writeFile(".env", env, { mode: 0o600 });
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", () =>
      reject(
        new Error(
          `Não foi possível executar ${command}. Confira se o Docker Desktop está instalado e aberto.`,
        ),
      ),
    );
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} terminou com código ${code}.`)),
    );
  });
}
await run("docker", ["compose", "up", "-d", "--wait"]);
for (const args of [["generate"], ["migrate", "deploy"], ["db", "seed"]])
  await run(process.execPath, ["node_modules/prisma/build/index.js", ...args]);
console.log(
  "VibePage preparado. Execute npm run dev e abra http://localhost:3000",
);
