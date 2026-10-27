import { db } from "@/lib/db";
import { getPublicProfile } from "@/lib/public-profile";
import { consumeLimit, clientIdentity } from "@/lib/limits";
import { utcDay } from "@/lib/analytics";
import { safeLinkSchema } from "@/lib/validation";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const record = await db.gamerCard.findUnique({
    where: { id },
    select: { profile: { select: { username: true } } },
  });
  const visible = record
    ? await getPublicProfile(record.profile.username)
    : null;
  const card = visible?.profile.gamerCards.find((c) => c.id === id);
  const url = safeLinkSchema.safeParse(card?.url);
  if (!url.success)
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  try {
    if (
      !/bot|crawler|spider|preview/i.test(
        request.headers.get("user-agent") || "",
      )
    ) {
      await consumeLimit(clientIdentity(request), "public-click", 90);
      const day = utcDay();
      await db.cardClick.upsert({
        where: { cardId_day: { cardId: id, day } },
        create: { cardId: id, day, count: 1 },
        update: { count: { increment: 1 } },
      });
    }
  } catch {
    /* Counting must not block a valid link. */
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.data,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
