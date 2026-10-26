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
  const published = await db.profile.findFirst({
    where: {
      userId: upload.userId,
      published: true,
      OR: [{ avatarKey: id }, { backgroundKey: id }],
    },
    select: { id: true },
  });
  if (!published) {
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
