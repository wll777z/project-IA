import { usernameSchema } from "@/lib/validation";
import { requireOrigin, apiError } from "@/lib/http";
import { consumeLimit, clientIdentity } from "@/lib/limits";
import { recordView } from "@/lib/analytics";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    requireOrigin(request);
    const username = usernameSchema.parse((await params).username);
    if (
      /bot|crawler|spider|preview/i.test(
        request.headers.get("user-agent") || "",
      )
    )
      return new Response(null, { status: 204 });
    await consumeLimit(clientIdentity(request), "public-view", 60);
    await recordView(username);
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
