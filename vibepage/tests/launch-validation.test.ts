import { describe, it, expect } from "vitest";
import {
  safeLinkSchema,
  registrationSchema,
  profileSchema,
} from "../src/lib/validation";
describe("Regressões da auditoria de lançamento", () => {
  it.each([
    "",
    "not a url",
    "https://",
    "h",
    "https://[bad]",
    "https://example.com\n/path",
    "https://public.local.",
    "https://localhost.",
    "https://x.internal.",
    "https://example.com\\@evil.example",
  ])("rejeita entrada sem lançar exceção: %s", (value) => {
    expect(() => safeLinkSchema.safeParse(value)).not.toThrow();
    expect(safeLinkSchema.safeParse(value).success).toBe(false);
  });
  it("normaliza espaços ao redor de e-mails", () => {
    expect(
      registrationSchema.parse({
        name: "Player",
        email: " PLAYER@EXAMPLE.COM ",
        password: "a-long-enough-passphrase",
      }).email,
    ).toBe("player@example.com");
  });
  it("recusa controles incompatíveis com texto PostgreSQL", () => {
    expect(
      registrationSchema.safeParse({
        name: "bad\0name",
        email: "a@example.com",
        password: "a-long-passphrase",
      }).success,
    ).toBe(false);
    expect(profileSchema.shape.bio.safeParse("bio\0").success).toBe(false);
    expect(profileSchema.shape.bio.safeParse("linha 1\nlinha 2").success).toBe(
      true,
    );
  });
});

it("canonicaliza protocolo/host antes do CHECK HTTPS no banco", () => {
  expect(safeLinkSchema.parse("HTTPS://EXAMPLE.COM/profile")).toBe(
    "https://example.com/profile",
  );
});
