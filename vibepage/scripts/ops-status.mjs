// Read-only local monitoring. No raw logs, secrets, mail or external requests.
import { spawn } from "node:child_process";
import { statfs } from "node:fs/promises";
import { caddyMetrics } from "./caddy-metrics.mjs";
const envFile = process.argv[2];
if (!envFile) {
  console.error("Usage: npm run ops:status -- /private/path/staging.env");
  process.exit(1);
}
const args = ["compose", "--env-file", envFile, "-f", "compose.staging.yaml"];
async function docker(tail) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", [...args, ...tail], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    let output = "";
    child.stdout.on("data", (c) => {
      output += c;
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), 20000);
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new Error("Docker check failed"));
    });
  });
}
try {
  const raw = await docker(["ps", "--format", "json"]);
  const rows = raw.trim().startsWith("[")
    ? JSON.parse(raw)
    : raw
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
  const services = ["db", "web", "proxy"].map((service) => {
    const row = rows.find((r) => r.Service === service);
    return {
      service,
      state: row?.State || "missing",
      health: row?.Health || "not-reported",
    };
  });
  const logs = await docker([
    "logs",
    "--no-color",
    "--since",
    "15m",
    "--tail",
    "1000",
    "web",
  ]);
  const metrics = caddyMetrics(
    await docker([
      "exec",
      "-T",
      "proxy",
      "wget",
      "-qO-",
      "http://127.0.0.1:2019/metrics",
    ]),
  );
  const disk = await statfs(process.cwd());
  const diskAvailablePercent = Math.round((disk.bavail / disk.blocks) * 100);
  const events = Object.fromEntries(
    ["SMTP_DELIVERY_FAILED", "READINESS_DATABASE_UNAVAILABLE"].map((code) => [
      code,
      logs.split(code).length - 1,
    ]),
  );
  const ok =
    services.every(
      (r) =>
        r.state === "running" &&
        (r.service === "proxy" || r.health === "healthy"),
    ) &&
    diskAvailablePercent >= 10 &&
    !Object.values(events).some(Boolean);
  console.log(
    JSON.stringify(
      {
        status: ok ? "ok" : "attention",
        checkedAt: new Date().toISOString(),
        services,
        caddyHTTP: metrics,
        diskAvailablePercent,
        sampledEventsLast15m: events,
        limits:
          "Last 1000 log lines only; HTTP series are cumulative by handler; do not sum handlers or treat them as interval rates. No SMTP inbox delivery or external HTTPS check. Disk refers to checkout filesystem; inspect other volume filesystems separately.",
      },
      null,
      2,
    ),
  );
  if (!ok) process.exitCode = 1;
} catch {
  console.error(
    "OPS_STATUS_UNAVAILABLE: inspect Docker access and private env file. No raw logs printed.",
  );
  process.exitCode = 1;
}
