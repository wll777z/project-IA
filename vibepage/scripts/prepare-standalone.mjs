import { cp, mkdir, access } from "node:fs/promises";
await mkdir(".next/standalone/.next", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
try {
  await access("public");
  await cp("public", ".next/standalone/public", { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

for (const file of ["launch.mjs", "production-env.mjs"])
  await cp(`scripts/${file}`, `.next/standalone/${file}`);
