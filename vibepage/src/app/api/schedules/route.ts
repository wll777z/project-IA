import { requireUser, readJSON, apiError } from "@/lib/http";
import { consumeLimit } from "@/lib/limits";
import { changeSchedule } from "@/lib/appearance-store";
export async function POST(request: Request) {
  try {
    const user = await requireUser(request, true);
    await consumeLimit(user.id, "schedules", 15);
    return Response.json(
      await changeSchedule(user.id, await readJSON(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
