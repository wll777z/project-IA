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
  let html = await readFile(`.next/server/app/${name}.html`, "utf8");
  if (name !== "demo") {
    html = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<link\b[^>]*as="script"[^>]*\/?\s*>/g, "");
    html = html.replace(
      /(class="profile-scene[^"]*"[^>]*style=")[^"]*"/g,
      '$1opacity:1;transform:none"',
    );
    html = html
      .replaceAll('href="/login"', 'href="/demo/"')
      .replaceAll('href="/cadastro"', 'href="/demo/"')
      .replaceAll('href="/demo"', 'href="/demo/"');
    html = html.replace(
      "<body>",
      '<body><div style="text-align:center;padding:10px 20px;background:#1e142d;color:#cfb8e5;font:12px/1.7 Arial,sans-serif">Demonstração do VibePage · <a style="text-decoration:underline" href="/demo/">Experimente o editor</a> · Contas reais dependem do ambiente PostgreSQL.</div>',
    );
  }
  const output =
    name === "index"
      ? join(target, "index.html")
      : join(target, name, "index.html");
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, html);
}
console.log(
  "Landing e demonstração interativa exportadas. Nenhum backend ou segredo incluído.",
);
