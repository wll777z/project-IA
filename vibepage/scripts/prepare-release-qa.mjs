// Local-only visual harness. No registration, credentials, upload or deployment.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const checkout = resolve(".next/release-preview");
const root = resolve(checkout, "dist");
await mkdir(root, { recursive: true });
await cp(".next/static", resolve(root, "_next/static"), { recursive: true });
const instrumentation = `<script>(()=>{
const metrics={lcpMs:null,cls:0,observedInteractionMaxMs:null,interactionEntries:0,longTasksMs:0};
let start=0,last=0,windowSum=0;
const output=document.createElement('output');output.hidden=true;output.id='audit-metrics';
const sync=()=>output.setAttribute('data-metrics',JSON.stringify(metrics));
document.addEventListener('DOMContentLoaded',()=>{document.body.append(output);sync()});
for(const [type,collect] of [
['largest-contentful-paint',e=>metrics.lcpMs=e.startTime],
['layout-shift',e=>{if(e.hadRecentInput)return;if(e.startTime-last>1000||e.startTime-start>5000){start=e.startTime;windowSum=0}last=e.startTime;windowSum+=e.value;metrics.cls=Math.max(metrics.cls,windowSum)}],
['event',e=>{if(e.interactionId){metrics.interactionEntries++;metrics.observedInteractionMaxMs=Math.max(metrics.observedInteractionMaxMs||0,e.duration)}}],
['longtask',e=>metrics.longTasksMs+=e.duration]]){
try{new PerformanceObserver(list=>{list.getEntries().forEach(collect);sync()}).observe({type,buffered:true,durationThreshold:16})}catch{}
}})();</script>`;
for (const [route, source] of [
  ["demo", ".next/server/app/demo.html"],
  ["landing", ".next/server/app/index.html"],
  ["login-real", ".next/server/app/login.html"],
  ["audit_perf", ".next/release-profile.html"],
]) {
  const target = resolve(root, route);
  await mkdir(target, { recursive: true });
  const html = await readFile(source, "utf8");
  await writeFile(
    resolve(target, "index.html"),
    html.replace("</head>", instrumentation + "</head>"),
  );
}
const pages = ["demo", "audit_perf", "landing", "login-real"],
  widths = [360, 390, 768, 1440];
const links = [];
for (const width of widths)
  for (const page of pages) {
    const file = `qa-${width}-${page}.html`;
    await writeFile(
      resolve(root, file),
      `<!doctype html><html><head><meta charset="utf-8"><title>QA ${width} ${page}</title></head><body style="margin:0;background:#111"><iframe title="${page} ${width}px" src="/${page}/" style="width:${width}px;height:1000px;border:0"></iframe></body></html>`,
    );
    links.push(`<p><a href="/${file}">${page} ${width}px</a></p>`);
  }
await writeFile(
  resolve(root, "index.html"),
  `<!doctype html><html><body style="color:white;background:#111;font:20px system-ui"><h1>Auditoria local — sem publicação</h1>${links.join("")}</body></html>`,
);
await mkdir(resolve(checkout, ".openai"), { recursive: true });
await writeFile(
  resolve(checkout, ".openai/hosting.json"),
  JSON.stringify({ static: { directory: "dist" } }),
);
console.log(
  `Local QA prepared at ${checkout}. Static visual evidence only; no auth/backend here.`,
);
