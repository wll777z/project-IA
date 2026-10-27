import { z } from "zod";
import { requireUser, apiError } from "@/lib/http";
import { advancedStats } from "@/lib/analytics-advanced";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const period = Number(
      z
        .enum(["7", "30"])
        .parse(new URL(request.url).searchParams.get("period") ?? "7"),
    ) as 7 | 30;
    return Response.json(await advancedStats(user.id, period), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
