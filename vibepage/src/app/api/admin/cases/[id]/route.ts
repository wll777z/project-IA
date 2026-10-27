import { requireAdministrator } from "@/lib/administrators";
import { readJSON, apiError } from "@/lib/http";
import { consumeLimit } from "@/lib/limits";
import { reviewSupportCase } from "@/lib/support";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdministrator(request, true);
    await consumeLimit(user.id, "case-review", 30);
    return Response.json(
      await reviewSupportCase(
        user.id,
        (await params).id,
        await readJSON(request),
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
