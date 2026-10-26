import { requireUser, readJSON, apiError } from "@/lib/http";
import { consumeLimit } from "@/lib/limits";
import { getOwnedProfile, saveProfile } from "@/lib/profiles";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return Response.json(
      { profile: await getOwnedProfile(user.id) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(request: Request) {
  try {
    const user = await requireUser(request, true);
    await consumeLimit(user.id, "profile-save");
    return Response.json({
      profile: await saveProfile(user.id, await readJSON(request)),
    });
  } catch (e) {
    return apiError(e);
  }
}
