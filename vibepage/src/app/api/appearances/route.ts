import { requireUser, readJSON, apiError } from "@/lib/http";
import { consumeLimit } from "@/lib/limits";
import { listAppearances, changeAppearance } from "@/lib/appearance-store";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return Response.json(await listAppearances(user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireUser(request, true);
    await consumeLimit(user.id, "appearances", 20);
    return Response.json(
      await changeAppearance(user.id, await readJSON(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
