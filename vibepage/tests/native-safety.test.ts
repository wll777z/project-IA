import { expect, it } from "vitest";
import { nativeTestURL } from "../scripts/native-test-env.mjs";
const valid = `postgresql://vibepage_test:${"a".repeat(48)}@127.0.0.1:45432/vibepage_acceptance_0123456789abcdef`;
it("native acceptance never falls back to DATABASE_URL", () => {
  expect(
    nativeTestURL({ DATABASE_URL: "postgresql://production/db" }),
  ).toBeNull();
  expect(nativeTestURL({ VIBEPAGE_NATIVE_TEST_URL: valid })).toBe(valid);
});
it("rejects remote hosts, real database names, URL options and arbitrary credentials", () => {
  for (const url of [
    valid.replace("127.0.0.1", "db.example.com"),
    valid.replace("vibepage_acceptance_0123456789abcdef", "vibepage"),
    valid + "?schema=public",
    valid.replace("vibepage_test:", "production:"),
    valid.replace(":45432", ":543"),
    valid.replace("postgresql:", "https:"),
  ])
    expect(() => nativeTestURL({ VIBEPAGE_NATIVE_TEST_URL: url })).toThrow();
});
