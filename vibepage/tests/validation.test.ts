import { describe, it, expect } from "vitest";
import {
  credentialsSchema,
  registrationSchema,
  safeLinkSchema,
  usernameSchema,
} from "../src/lib/validation";
describe("Validação de entrada", () => {
  it("normaliza e-mail e exige senha longa", () => {
    expect(
      credentialsSchema.parse({
        email: "PLAYER@EXAMPLE.COM",
        password: "my-long-passphrase",
      }).email,
    ).toBe("player@example.com");
    expect(
      credentialsSchema.safeParse({ email: "a@b.com", password: "123" })
        .success,
    ).toBe(false);
  });
  it("limita os nomes", () => {
    expect(
      registrationSchema.safeParse({
        name: "a".repeat(61),
        email: "a@b.com",
        password: "my-long-passphrase",
      }).success,
    ).toBe(false);
  });
  it.each([
    "dashboard",
    "ADMIN",
    "api",
    "_next",
    "privacidade",
    "a",
    "a/b",
    "a<script>",
  ])("rejeita username %s", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });
  it("normaliza usernames válidos", () => {
    expect(usernameSchema.parse("Wendell_77")).toBe("wendell_77");
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "http://example.com",
    "https://localhost",
    "https://192.168.1.1",
    "https://127.1",
    "https://[::1]",
    "https://user:pass@example.com",
    "https://test.local",
    "https://example.com:8443",
  ])("bloqueia link inseguro %s", (value) => {
    expect(safeLinkSchema.safeParse(value).success).toBe(false);
  });
  it("aceita link HTTPS público", () =>
    expect(
      safeLinkSchema.safeParse("https://example.com/player?q=hello").success,
    ).toBe(true));
});
