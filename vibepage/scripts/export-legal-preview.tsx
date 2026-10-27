import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import Terms from "../src/app/termos/page";
import Privacy from "../src/app/privacidade/page";
const target = resolve(process.argv[2]);
const landing = await readFile(".next/server/app/index.html", "utf8");
const css = [...landing.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)]
  .map((m) => m[0])
  .join("");
// Static previews never claim configured support/legal operation from a staging host.
process.env.SUPPORT_INTAKE_ENABLED = "false";
for (const [name, Component] of [
  ["termos", Terms],
  ["privacidade", Privacy],
] as const) {
  await mkdir(resolve(target, name), { recursive: true });
  await writeFile(
    resolve(target, name, "index.html"),
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VibePage — ${name}</title>${css}</head><body>${renderToStaticMarkup(<Component />)}</body></html>`,
  );
}
await mkdir(resolve(target, "suporte"), { recursive: true });
await writeFile(
  resolve(target, "suporte/index.html"),
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VibePage — Suporte</title>${css}</head><body><main class="legal-page"><h1>Esta é uma demonstração visual.</h1><p>O canal de suporte e denúncias exige o aplicativo com banco e administração configurados. Nenhuma solicitação é recebida nesta prévia estática.</p><a href="/demo/">Voltar à demonstração</a></main></body></html>`,
);
