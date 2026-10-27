import { requireAdministrator } from "@/lib/administrators";
import { apiError } from "@/lib/http";
import { listSupportCases } from "@/lib/support";
export async function GET(request: Request) {
  try {
    await requireAdministrator(request);
    const params = new URL(request.url).searchParams;
    return Response.json(
      await listSupportCases(
        params.get("status") ?? "OPEN",
        params.get("cursor") ?? undefined,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
