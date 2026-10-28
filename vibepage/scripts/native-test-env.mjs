// Test-only URLs: never accept DATABASE_URL or a public/production database.
export function nativeTestURL(env = process.env) {
  const value = env.VIBEPAGE_NATIVE_TEST_URL;
  if (!value) return null;
  const url = new URL(value);
  if (
    url.protocol !== "postgresql:" ||
    url.hostname !== "127.0.0.1" ||
    !/^\d+$/.test(url.port) ||
    Number(url.port) < 1024 ||
    !/^\/vibepage_acceptance_[a-f0-9]{16}$/.test(url.pathname) ||
    url.username !== "vibepage_test" ||
    !/^[a-f0-9]{48}$/.test(url.password) ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Native acceptance requires its own isolated loopback fixture.",
    );
  return value;
}
