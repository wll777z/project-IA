// Synthetic SSR snapshots only. Never publish this test harness.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const checkout = resolve(".next/production-preview"),
  root = resolve(checkout, "dist");
await mkdir(root, { recursive: true });
await cp(".next/static", resolve(root, "_next/static"), { recursive: true });
const pages = [
  "landing",
  "login",
  "signup",
  "demo",
  "dashboard",
  "editor",
  "collections",
  "sharing",
  "analytics",
  "public-profile",
  "support",
  "moderation",
];
await mkdir(resolve(root, "qa-media"), { recursive: true });
for (const file of ["qr.png", "vibecard-minimal.png"])
  await cp(
    resolve(".next/production-snapshots", file),
    resolve(root, "qa-media", file),
  );
for (const page of pages) {
  const source = resolve(
    ["support", "moderation"].includes(page)
      ? ".next/polish-snapshots"
      : ".next/production-snapshots",
    `${page}.html`,
  );
  const html = (await readFile(source, "utf8"))
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (tag, body) =>
      /^\$(?:RS|RB)=/.test(body.trim()) ? tag : "",
    )
    .replace(/<link\b[^>]*as="script"[^>]*>/gi, "")
    .replace(/src="\/api\/qr\/audit_perf"/g, 'src="/qa-media/qr.png"')
    .replace(
      /src="\/api\/vibecard\/audit_perf[^\"]*"/g,
      'src="/qa-media/vibecard-minimal.png"',
    );
  await mkdir(resolve(root, page), { recursive: true });
  await writeFile(resolve(root, page, "index.html"), html);
}
const links = [];
for (const width of [360, 390, 768, 1024, 1440])
  for (const page of pages) {
    const file = `qa-${width}-${page}.html`;
    await writeFile(
      resolve(root, file),
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${width} ${page}</title></head><body style="margin:0;background:#0b0a10"><iframe title="${page} ${width}" src="/${page}/" style="width:${width}px;height:1100px;border:0"></iframe></body></html>`,
    );
    links.push(`<p><a href="/${file}">${width} · ${page}</a></p>`);
  }
await writeFile(
  resolve(root, "index.html"),
  `<!doctype html><html lang="pt-BR"><body style="background:#0b0a10;color:white;font:18px system-ui"><h1>Homologação visual local</h1><p>Snapshots sintéticos, sem hidratação, login, saves ou pagamentos. Não publicar.</p>${links.join("")}</body></html>`,
);
await mkdir(resolve(checkout, ".openai"), { recursive: true });
await writeFile(
  resolve(checkout, ".openai/hosting.json"),
  JSON.stringify({ static: { directory: "dist" } }),
);
console.log(checkout);

// A separate real, hydrated demo permits local interaction/paint observations.
const demoMetrics = `<script>document.addEventListener('DOMContentLoaded',()=>{const o=document.createElement('output');o.id='production-demo-metrics';o.hidden=true;document.body.append(o);const m={lcpMs:null,cls:0,observedInteractionMaxMs:null,interactionEntries:0};let start=0,last=0,sum=0;const sync=()=>o.setAttribute('data-metrics',JSON.stringify(m));for(const [type,fn] of [['largest-contentful-paint',e=>m.lcpMs=e.startTime],['layout-shift',e=>{if(e.hadRecentInput)return;if(e.startTime-last>1000||e.startTime-start>5000){start=e.startTime;sum=0}last=e.startTime;sum+=e.value;m.cls=Math.max(m.cls,sum)}],['event',e=>{if(e.interactionId){m.interactionEntries++;m.observedInteractionMaxMs=Math.max(m.observedInteractionMaxMs||0,e.duration)}}]])try{new PerformanceObserver(l=>{l.getEntries().forEach(fn);sync()}).observe({type,buffered:true,durationThreshold:16})}catch{}sync()});</script>`;
await mkdir(resolve(root, "demo-live"), { recursive: true });
const live = await readFile(".next/server/app/demo.html", "utf8");
await writeFile(
  resolve(root, "demo-live/index.html"),
  live.replace("</head>", demoMetrics + "</head>"),
);
