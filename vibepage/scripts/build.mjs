import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
// Build workers import auth modules, but compilation must not need production secrets.
// These values exist only in the child environment; Next keeps server env lookups dynamic.
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET || randomBytes(40).toString("base64url"),
    },
  },
);
child.on("error", () => {
  console.error("Não foi possível iniciar o build Next.js.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
