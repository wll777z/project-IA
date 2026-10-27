import { parse } from "dotenv";
import { randomBytes } from "node:crypto";
export function ensureLocalSecret(content) {
  const secret = parse(content).BETTER_AUTH_SECRET;
  if (secret && secret.length >= 32) return content;
  const line = `BETTER_AUTH_SECRET="${randomBytes(40).toString("base64url")}"`;
  return /^BETTER_AUTH_SECRET=.*$/m.test(content)
    ? content.replace(/^BETTER_AUTH_SECRET=.*$/m, line)
    : content.replace(/\n?$/, `\n${line}\n`);
}
