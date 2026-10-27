import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { resolve, join } from "node:path";
const destination = process.argv[2];
if (!destination)
  throw new Error(
    "Usage: node scripts/export-preview.mjs /absolute/preview-checkout",
  );
const target = resolve(destination, "dist");
await mkdir(target, { recursive: true });
await rm(join(target, "_next"), { recursive: true, force: true });
await cp(".next/static", join(target, "_next/static"), { recursive: true });
for (const name of ["index", "demo", "privacidade", "termos"]) {
  const html = await readFile(`.next/server/app/${name}.html`, "utf8");
  // Preserve hydration for the interactive landing showcase and editor.
  // Rewriting React's server HTML causes hydration mismatches; preview-only
  // auth destinations are handled by standalone static redirect documents below.
  const output =
    name === "index"
      ? join(target, "index.html")
      : join(target, name, "index.html");
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, html);
}
for (const route of ["cadastro", "login"]) {
  await mkdir(join(target, route), { recursive: true });
  await writeFile(
    join(target, route, "index.html"),
    `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/demo/"><title>Experimente o VibePage</title></head><body style="background:#0b0910;color:#eee;font-family:system-ui;padding:30px"><h1>Prévia do VibePage</h1><p>Contas reais não estão disponíveis nesta demonstração.</p><a style="color:#c4a1ff" href="/demo/">Abrir editor interativo</a></body></html>`,
  );
}
console.log(
  "Landing e demonstração interativa exportadas. Nenhum backend ou segredo incluído.",
);
