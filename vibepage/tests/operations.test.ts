import { expect, it } from "vitest";
import { createServer, type Socket } from "node:net";
import { Pool } from "pg";
import { databaseOptions } from "../src/lib/database-options";
it("PostgreSQL sem handshake não deixa conexão pendente indefinidamente", async () => {
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const address = server.address();
  expect(address && typeof address !== "string").toBeTruthy();
  if (!address || typeof address === "string")
    throw new Error("Socket fixture indisponível");
  const pool = new Pool(
    databaseOptions({
      NODE_ENV: "test",
      DATABASE_URL: `postgresql://synthetic:synthetic@127.0.0.1:${address.port}/fixture`,
    }),
  );
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = pool.query("SELECT 1").then(
      () => "unexpected success",
      () => "connection rejected",
    );
    const bound = new Promise<string>((resolve) => {
      deadline = setTimeout(() => resolve("still pending"), 8000);
    });
    expect(await Promise.race([result, bound])).toBe("connection rejected");
  } finally {
    if (deadline) clearTimeout(deadline);
    for (const socket of sockets) socket.destroy();
    await pool.end();
    await new Promise<void>((r) => server.close(() => r()));
  }
}, 15000);
