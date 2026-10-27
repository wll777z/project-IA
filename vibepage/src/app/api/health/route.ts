import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Read-only readiness. The supplied proxy blocks this path from external clients.
export async function GET() {
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers });
  } catch {
    console.error("READINESS_DATABASE_UNAVAILABLE");
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
