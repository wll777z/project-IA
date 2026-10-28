// Local-only hydrated QA, never deploy. Creates an ephemeral synthetic session.
// Browser login/signup/SMTP are NOT validated by this fixture; HTTP tests cover auth.
import { spawn } from "node:child_process";
import { createServer, request } from "node:http";
import { randomBytes } from "node:crypto";
import { setupDB } from "./setup-db";
const fixture = await setupDB();
const port = Number(process.env.PORT || "4173");
const origin = `http://terminal.local:${port}`;
process.env.BETTER_AUTH_URL = origin;
const { auth } = await import("../src/lib/auth");
const credentials = {
  name: "Browser QA",
  email: "browser@example.test",
  password: randomBytes(24).toString("hex"),
};
await auth.api.signUpEmail({ body: credentials });
const login = await auth.handler(
  new Request(origin + "/api/auth/sign-in/email", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(credentials),
  }),
);
if (!login.ok) throw new Error("Synthetic fixture login failed");
const cookies = login.headers.getSetCookie();
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port + 1),
  ],
  {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      NODE_ENV: "development",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "inherit", "inherit"],
  },
);
const proxy = createServer((req, res) => {
  if (req.url === "/__qa/start") {
    res.writeHead(302, {
      "set-cookie": cookies,
      location: "/dashboard",
      "cache-control": "no-store",
    });
    res.end();
    return;
  }
  if (req.url === "/__qa/mobile") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      '<!doctype html><html lang="pt-BR"><title>VibePage mobile QA</title><body style="margin:0;background:#08070c"><iframe title="VibePage 390px" src="/__qa/start" style="display:block;width:390px;height:100vh;border:0;margin:auto"></iframe></body></html>',
    );
    return;
  }
  const upstream = request(
    {
      hostname: "127.0.0.1",
      port: port + 1,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (response) => {
      res.writeHead(response.statusCode || 502, response.headers);
      response.pipe(res);
    },
  );
  upstream.on("error", () => {
    res.writeHead(503);
    res.end("Local QA warming up");
  });
  req.pipe(upstream);
});
proxy.listen(port, "0.0.0.0");
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  proxy.close();
  app.kill("SIGTERM");
  await fixture.close();
  process.exit(code);
}
process.once("SIGTERM", () => {
  void stop();
});
process.once("SIGINT", () => {
  void stop();
});
app.once("exit", (code) => {
  void stop(code ?? 1);
});
