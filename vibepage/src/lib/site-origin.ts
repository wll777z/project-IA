// Public origin is not a secret. Static metadata uses the build-time value.
export function appOrigin() {
  return new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").origin;
}
