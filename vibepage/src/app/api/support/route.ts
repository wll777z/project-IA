import { requireOrigin, readJSON, apiError } from "@/lib/http";
import { clientIdentity, consumeLimit } from "@/lib/limits";
import { createSupportCase } from "@/lib/support";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const identity = clientIdentity(request);
    await consumeLimit(identity, "support-minute", 5);
    await consumeLimit(identity, "support-day", 30, 86400);
    return Response.json(await createSupportCase(await readJSON(request)), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
