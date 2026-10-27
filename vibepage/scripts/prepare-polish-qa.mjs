// Local-only snapshots of HTTP-smoke synthetic accounts. Never deploy this harness.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const checkout = resolve(".next/polish-preview");
const root = resolve(checkout, "dist");
await mkdir(root, { recursive: true });
await cp(".next/static", resolve(root, "_next/static"), { recursive: true });
const pages = [
  "first-access",
  "editor",
  "draft",
  "published",
  "share",
  "unavailable",
  "unavailable-editor",
  "unavailable-share",
  "expired",
];
for (const page of pages) {
  const html = await readFile(`.next/polish-snapshots/${page}.html`, "utf8");
  // No hydration, authentication, saves or network APIs in static QA.
  // Native details/summary remains interactive for keyboard/mobile navigation.
  const clean = html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (tag, body) =>
      /^\$(?:RS|RB)=/.test(body.trim()) ? tag : "",
    )
    .replace(/<link\b[^>]*as="script"[^>]*>/gi, "");
  const target = resolve(root, page);
  await mkdir(target, { recursive: true });
  await writeFile(resolve(target, "index.html"), clean);
}
const links = [];
for (const width of [360, 390, 768, 1440]) {
  for (const page of pages) {
    const filename = `qa-${width}-${page}.html`;
    await writeFile(
      resolve(root, filename),
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QA ${width} ${page}</title></head><body style="margin:0;background:#0b0a10"><iframe title="${page} ${width}px" src="/${page}/" style="width:${width}px;height:1100px;border:0"></iframe></body></html>`,
    );
    links.push(`<p><a href="/${filename}">${page} · ${width}px</a></p>`);
  }
}
await writeFile(
  resolve(root, "index.html"),
  `<!doctype html><html lang="pt-BR"><body style="background:#0b0a10;color:white;font:18px system-ui;padding:24px"><h1>Polimento — QA local</h1><p>Snapshots sintéticos de HTTP. Sem autenticação, saves ou publicação. HTML sem hidratação; menu nativo permanece testável.</p>${links.join("")}</body></html>`,
);
await writeFile(
  resolve(root, "comparison.html"),
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QA VibePage — polimento mobile</title></head><body style="margin:0;background:#100d18;color:#ddd0f5;font:16px system-ui;padding:20px"><h1 style="font-size:22px;margin:0 0 10px">VibePage · revisão mobile</h1><p>Snapshots sintéticos · 360 px · sem publicação</p><div style="display:flex;gap:20px"><section><h2 style="font-size:16px">Primeiro acesso</h2><iframe title="Primeiro acesso 360" src="/first-access/" style="width:360px;height:760px;border:1px solid #a78bfa40"></iframe></section><section><h2 style="font-size:16px">Menu e editor</h2><iframe title="Editor 360" src="/editor/" style="width:360px;height:760px;border:1px solid #a78bfa40"></iframe></section><section><h2 style="font-size:16px">Perfil indisponível</h2><iframe title="Indisponível 360" src="/unavailable-share/" style="width:360px;height:760px;border:1px solid #a78bfa40"></iframe></section></div></body></html>`,
);
await mkdir(resolve(checkout, ".openai"), { recursive: true });
await writeFile(
  resolve(checkout, ".openai/hosting.json"),
  JSON.stringify({ static: { directory: "dist" } }),
);
console.log(`Snapshots locais preparados em ${checkout}; não publicar.`);
