import { z } from "zod";
import { requireUser, apiError } from "@/lib/http";
import { consumeLimit } from "@/lib/limits";
import { advancedStats, statsCSV } from "@/lib/analytics-advanced";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    await consumeLimit(user.id, "stats-export", 10);
    const period = Number(
      z
        .enum(["7", "30"])
        .parse(new URL(request.url).searchParams.get("period") ?? "30"),
    ) as 7 | 30;
    return new Response(statsCSV(await advancedStats(user.id, period)), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=vibepage-analytics.csv",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
