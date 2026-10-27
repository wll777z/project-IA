import { it, expect } from "vitest";
import { z } from "zod";
import { clientId } from "../src/lib/client-id";
it("gera UUID v4 válido sem randomUUID em contexto HTTP", () => {
  const httpCrypto = { getRandomValues: crypto.getRandomValues.bind(crypto) };
  const ids = Array.from({ length: 100 }, () => clientId(httpCrypto));
  expect(
    ids.every((id) => z.uuid().safeParse(id).success && id[14] === "4"),
  ).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
});
it("continua usando Web Crypto nativo em contexto seguro", () => {
  expect(z.uuid().safeParse(clientId()).success).toBe(true);
});
