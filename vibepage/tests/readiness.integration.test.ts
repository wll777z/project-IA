import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { setupDB } from "./setup-db";
let fixture: Awaited<ReturnType<typeof setupDB>>,
  route: typeof import("../src/app/api/health/route"),
  closed = false;
beforeAll(async () => {
  fixture = await setupDB();
  route = await import("../src/app/api/health/route");
});
afterAll(async () => {
  if (!closed) await fixture?.close();
});
it("readiness consulta o banco e expõe somente estado, sem cache", async () => {
  const response = await route.GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("banco indisponível produz 503 sem URL ou diagnóstico privado", async () => {
  await fixture.close();
  closed = true;
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const response = await route.GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
    expect(log).toHaveBeenCalledWith("READINESS_DATABASE_UNAVAILABLE");
  } finally {
    log.mockRestore();
  }
});
