import { getPublicProfile } from "@/lib/public-profile";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const upload = await db.upload.findUnique({ where: { id } });
  if (!upload) return new Response(null, { status: 404 });
  const ownerProfile = await db.profile.findUnique({
    where: { userId: upload.userId },
    select: { username: true },
  });
  const visible = ownerProfile
    ? await getPublicProfile(ownerProfile.username)
    : null;
  const profile = visible?.profile;
  const isPublic =
    !!profile &&
    (profile.avatarKey === id ||
      profile.backgroundKey === id ||
      profile.gamerCards.some((c) => c.avatarKey === id) ||
      profile.blocks.some((b) => b.imageKeys.includes(id)));
  if (!isPublic) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user.id !== upload.userId)
      return new Response(null, { status: 404 });
  }
  return new Response(new Uint8Array(upload.content), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(upload.content.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
