// Container-local probe only. No secrets, cookies or database diagnostics printed.
const port = process.env.PORT || "3000";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
  process.exit(1);
try {
  const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
    signal: AbortSignal.timeout(18000),
    redirect: "error",
  });
  if (!response.ok || (await response.json()).status !== "ok")
    process.exitCode = 1;
} catch {
  process.exitCode = 1;
}
