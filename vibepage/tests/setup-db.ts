import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readdir, readFile } from "node:fs/promises";
export async function setupDB() {
  const pg = await PGlite.create();
  const root = new URL("../prisma/migrations/", import.meta.url);
  for (const name of (await readdir(root)).sort())
    if (name !== "migration_lock.toml")
      await pg.exec(
        await readFile(new URL(name + "/migration.sql", root), "utf8"),
      );
  const server = new PGLiteSocketServer({
    db: pg,
    host: "127.0.0.1",
    port: 0,
    maxConnections: 20,
  });
  await server.start();
  process.env.DATABASE_URL = `postgresql://postgres:postgres@${server.getServerConn()}/postgres`;
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET =
    "integration-only-key-never-use-in-production-12345";
  // Never inherit a real mail provider or public signup policy in isolated tests.
  process.env.REQUIRE_EMAIL_VERIFICATION = "false";
  for (const key of [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_FROM",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ])
    delete process.env[key];
  const { db } = await import("../src/lib/db");
  return {
    db,
    async close() {
      await db.$disconnect();
      await server.stop();
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));
      await pg.close();
    },
  };
}
