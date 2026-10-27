import { cp, mkdir, access, readFile, writeFile } from "node:fs/promises";
import { readBuildOrigin } from "./build-origin.mjs";
await mkdir(".next/standalone/.next", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
try {
  await access("public");
  await cp("public", ".next/standalone/public", { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

for (const file of ["launch.mjs", "production-env.mjs", "build-origin.mjs"])
  await cp(`scripts/${file}`, `.next/standalone/${file}`);

const manifest = readBuildOrigin({
  landing: await readFile(".next/server/app/index.html", "utf8"),
  sitemap: await readFile(".next/server/app/sitemap.xml.body", "utf8"),
  robots: await readFile(".next/server/app/robots.txt.body", "utf8"),
});
await writeFile(".next/standalone/build-origin.json", JSON.stringify(manifest));
