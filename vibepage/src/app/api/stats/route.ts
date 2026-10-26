import { requireUser, apiError } from "@/lib/http";
import { getStats } from "@/lib/analytics";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return Response.json(await getStats(user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
