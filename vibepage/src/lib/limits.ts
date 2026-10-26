import { createHmac, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
export async function consumeLimit(
  identity: string,
  action: string,
  max = 30,
  seconds = 60,
) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET ausente");
  const key =
    "app:" +
    createHmac("sha256", secret)
      .update(action + ":" + identity)
      .digest("hex");
  const now = BigInt(Date.now()),
    cutoff = now - BigInt(seconds * 1000);
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" (id,key,count,"lastRequest") VALUES (${randomUUID()},${key},1,${now}) ON CONFLICT (key) DO UPDATE SET count=CASE WHEN "RateLimit"."lastRequest" <= ${cutoff} THEN 1 ELSE "RateLimit".count+1 END,"lastRequest"=CASE WHEN "RateLimit"."lastRequest" <= ${cutoff} THEN ${now} ELSE "RateLimit"."lastRequest" END RETURNING count`;
  if (rows[0].count > max)
    throw new HttpError(429, "Muitas tentativas. Aguarde um minuto.");
}
export function clientIdentity(request: Request) {
  const trusted = process.env.AUTH_IP_HEADER;
  return trusted
    ? request.headers.get(trusted)?.split(",").at(-1)?.trim() || "shared"
    : "shared";
}
