import { getPublicProfile } from "@/lib/public-profile";
import { recordClick } from "@/lib/analytics";
import { consumeLimit, clientIdentity } from "@/lib/limits";
import { db } from "@/lib/db";
import { safeLinkSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return new Response("Link não encontrado.", { status: 404 });
  const link = await db.profileLink.findUnique({
    where: { id },
    include: { profile: { select: { published: true, username: true } } },
  });
  if (!link?.profile.published || !safeLinkSchema.safeParse(link.url).success)
    return new Response("Link não encontrado.", { status: 404 });
  const visible = await getPublicProfile(link.profile.username);
  if (!visible?.profile.links.some((l) => l.id === id))
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  try {
    if (
      !/bot|crawler|spider|preview/i.test(
        _request.headers.get("user-agent") || "",
      )
    ) {
      await consumeLimit(clientIdentity(_request), "public-click", 90);
      await recordClick(id);
    }
  } catch {
    /* Analytics failures must never block an otherwise valid destination. */
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: link.url,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
