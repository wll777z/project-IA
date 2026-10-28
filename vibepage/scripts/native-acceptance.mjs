// Creates and removes ONLY a new, randomly named Docker fixture; never uses .env.
import { spawn } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const nonce = randomBytes(8).toString("hex");
const container = `vibepage-acceptance-${nonce}`;
const database = `vibepage_acceptance_${nonce}`;
const restored = `vibepage_restore_${nonce}`;
const password = randomBytes(24).toString("hex");
const root = await mkdtemp(join(tmpdir(), "vibepage-acceptance-"));
let created = false;
const started = Date.now(),
  results = [];
function run(
  command,
  args,
  { env = {}, input, quiet = false, timeout = 300000 } = {},
) {
  return new Promise((resolve, reject) => {
    const childEnv = { ...process.env, ...env };
    for (const key of Object.keys(childEnv))
      if (key.startsWith("SMTP_")) delete childEnv[key];
    delete childEnv.DATABASE_URL;
    if (env.DATABASE_URL) childEnv.DATABASE_URL = env.DATABASE_URL;
    const child = spawn(command, args, {
      env: childEnv,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const chunks = [],
      errors = [];
    child.stdout.on("data", (c) => {
      chunks.push(c);
      if (!quiet) process.stdout.write(c);
    });
    child.stderr.on("data", (c) => {
      errors.push(c); /* only sanitized fixture diagnostics on failure */
    });
    child.once("error", reject);
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        // Only our fresh synthetic databases are used. Still redact credentials/URLs.
        const diagnostic = Buffer.concat(errors)
          .toString()
          .replaceAll(password, "[redacted]")
          .replace(/postgres(?:ql)?:\/\/[^\s'"]+/g, "[database-url]");
        console.error(diagnostic.slice(-3500));
        reject(
          new Error(
            `${command} failed (exit ${code}); no credentials or provider diagnostics printed.`,
          ),
        );
      } else resolve(Buffer.concat(chunks));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
const docker = (args, options) => run("docker", args, options);
const sql = (databaseName, input) =>
  docker(
    [
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      "vibepage_test",
      "-d",
      databaseName,
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input, quiet: true },
  );
async function stage(label, fn) {
  const begin = Date.now();
  console.log(`START ${label}`);
  await fn();
  results.push({ label, status: "passed", durationMs: Date.now() - begin });
  console.log(`PASS ${label}`);
}
try {
  await stage("Docker daemon available", () =>
    docker(["info"], { quiet: true, timeout: 15000 }),
  );
  // Synthetic credentials are ephemeral; Docker receives password through environment.
  await docker(
    [
      "run",
      "--detach",
      "--name",
      container,
      "--label",
      `vibepage.acceptance=${nonce}`,
      "--publish",
      "127.0.0.1::5432",
      "--env",
      "POSTGRES_USER=vibepage_test",
      "--env",
      `POSTGRES_DB=${database}`,
      "--env",
      "POSTGRES_PASSWORD",
      "postgres:17-alpine",
    ],
    { env: { POSTGRES_PASSWORD: password }, quiet: true },
  );
  created = true;
  for (let attempt = 0; ; attempt++) {
    try {
      await docker(
        [
          "exec",
          container,
          "pg_isready",
          "-U",
          "vibepage_test",
          "-d",
          database,
        ],
        { quiet: true, timeout: 5000 },
      );
      break;
    } catch (error) {
      if (attempt >= 60) throw error;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  const portText = (
    await docker(["port", container, "5432/tcp"], { quiet: true })
  )
    .toString()
    .trim();
  const match = /^127\.0\.0\.1:(\d+)$/.exec(portText);
  if (!match) throw new Error("Fixture port must bind only to loopback.");
  const url = `postgresql://vibepage_test:${password}@127.0.0.1:${match[1]}/${database}`;
  const env = {
    DATABASE_URL: url,
    VIBEPAGE_NATIVE_TEST_URL: url,
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "native-fixture-only-secret-never-production-12345",
    REQUIRE_EMAIL_VERIFICATION: "false",
  };
  await stage("Eight migrations on empty native PostgreSQL", () =>
    run("npm", ["run", "db:migrate"], { env, quiet: true }),
  );
  await stage("Read-only index/FK/migration acceptance", async () => {
    await sql(database, await readFile("ops/native-postgres-acceptance.sql"));
  });
  await stage("Production standalone HTTP journeys on native PostgreSQL", () =>
    run("npm", ["run", "test:http"], { env }),
  );
  await stage(
    "Native content, optimistic race, collections, seasons, downgrade and cleanup fixtures",
    () =>
      run(
        process.execPath,
        ["--import", "tsx", "tests/native-lifecycle.ts", "create"],
        { env },
      ),
  );
  await stage(
    "Upgrade from four-migration fixture preserves legacy IDs and content",
    async () => {
      const legacy = `${database}_upgrade`;
      await docker(
        ["exec", container, "createdb", "-U", "vibepage_test", legacy],
        { quiet: true },
      );
      const migrations = (await readdir("prisma/migrations"))
        .filter((n) => n !== "migration_lock.toml")
        .sort()
        .slice(0, 4);
      const legacyEnv = { ...env, DATABASE_URL: url.replace(database, legacy) };
      for (const migration of migrations) {
        await sql(
          legacy,
          await readFile(`prisma/migrations/${migration}/migration.sql`),
        );
        await run(
          "npm",
          [
            "exec",
            "--",
            "prisma",
            "migrate",
            "resolve",
            "--applied",
            migration,
          ],
          { env: legacyEnv, quiet: true },
        );
      }
      await sql(
        legacy,
        `INSERT INTO "Theme"(id,name,premium) VALUES ('midnight-purple','Midnight Purple',false);
      INSERT INTO "User"(id,name,email,"updatedAt") VALUES ('legacy-owner','Legacy','legacy@example.test',now());
      INSERT INTO "Profile"(id,"userId",username,"displayName","updatedAt") VALUES ('legacy-profile','legacy-owner','legacy_native','Legacy',now());
      INSERT INTO "ProfileLink"(id,"profileId",title,url,position) VALUES ('legacy-link','legacy-profile','Keep','https://example.com/',0);`,
      );
      await run("npm", ["run", "db:migrate"], { env: legacyEnv, quiet: true });
      await sql(legacy, await readFile("ops/native-postgres-acceptance.sql"));
      await sql(
        legacy,
        `DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM "ProfileLink" l JOIN "Profile" p ON p.id=l."profileId" WHERE l.id='legacy-link' AND p.id='legacy-profile' AND l.title='Keep' AND l.url='https://example.com/' AND p.username='legacy_native') THEN RAISE EXCEPTION 'Legacy content lost'; END IF; END $$;`,
      );
    },
  );
  const fingerprintSQL = await readFile("ops/fixture-fingerprint.sql");
  const before = await sql(database, fingerprintSQL);
  await stage("Database restart preserves every fixture row", async () => {
    await docker(["restart", container], { quiet: true });
    for (let i = 0; ; i++) {
      try {
        await sql(database, "SELECT 1;");
        break;
      } catch (error) {
        if (i >= 60) throw error;
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    if (!(await sql(database, fingerprintSQL)).equals(before))
      throw new Error("Persistence fingerprint mismatch.");
    // Docker may reallocate an automatically published host port on restart.
    const restartedPort = (
      await docker(["port", container, "5432/tcp"], { quiet: true })
    )
      .toString()
      .trim();
    const restartedMatch = /^127\.0\.0\.1:(\d+)$/.exec(restartedPort);
    if (!restartedMatch)
      throw new Error("Restarted fixture must remain loopback-only.");
    const restartedURL = new URL(url);
    restartedURL.port = restartedMatch[1];
    env.DATABASE_URL = env.VIBEPAGE_NATIVE_TEST_URL = restartedURL.href;
    await run(
      process.execPath,
      ["--import", "tsx", "tests/native-lifecycle.ts", "restart"],
      { env },
    );
  });
  await stage(
    "Custom backup, checksum, empty isolated restore and full-row comparison",
    async () => {
      const dump = await docker(
        [
          "exec",
          container,
          "pg_dump",
          "-U",
          "vibepage_test",
          "-d",
          database,
          "--format=custom",
          "--no-owner",
          "--no-acl",
        ],
        { quiet: true },
      );
      const backup = join(root, "synthetic.dump");
      await writeFile(backup, dump, { mode: 0o600 });
      const digest = createHash("sha256").update(dump).digest("hex");
      await writeFile(backup + ".sha256", digest, { mode: 0o600 });
      if (
        createHash("sha256")
          .update(await readFile(backup))
          .digest("hex") !== digest
      )
        throw new Error("Backup checksum mismatch.");
      await docker(
        ["exec", container, "createdb", "-U", "vibepage_test", restored],
        { quiet: true },
      );
      await sql(restored, await readFile("ops/assert-empty-restore.sql"));
      await docker(
        [
          "exec",
          "-i",
          container,
          "pg_restore",
          "-U",
          "vibepage_test",
          "-d",
          restored,
          "--exit-on-error",
          "--single-transaction",
          "--no-owner",
          "--no-privileges",
        ],
        { input: dump, quiet: true },
      );
      await sql(restored, await readFile("ops/native-postgres-acceptance.sql"));
      if (!(await sql(restored, fingerprintSQL)).equals(before))
        throw new Error("Restored full-row fingerprint mismatch.");
    },
  );
  await stage("Cleanup deletes expired records only", async () => {
    await run("npm", ["run", "db:cleanup"], { env });
    await run(
      process.execPath,
      ["--import", "tsx", "tests/native-lifecycle.ts", "cleanup"],
      { env },
    );
  });
  await stage("Account cascades and referential integrity", () =>
    run(
      process.execPath,
      ["--import", "tsx", "tests/native-lifecycle.ts", "delete"],
      { env },
    ),
  );
  console.log(
    JSON.stringify(
      {
        environment:
          "isolated Docker PostgreSQL 17, synthetic data, no SMTP/TLS",
        durationMs: Date.now() - started,
        results,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    error.code === "ENOENT"
      ? "BLOCKED: Docker unavailable. Install Docker Engine/Desktop with Compose and rerun npm run test:native after a localhost build."
      : error.message,
  );
  process.exitCode = 1;
} finally {
  if (created)
    await docker(["rm", "--force", "--volumes", container], {
      quiet: true,
    }).catch(() => {
      console.error(
        "Fixture cleanup failed; inspect only the container generated by this run.",
      );
      process.exitCode = 1;
    });
  await rm(root, { recursive: true, force: true });
}
