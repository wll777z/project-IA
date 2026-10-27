import { getPublicProfile } from "@/lib/public-profile";
import { qrPNG } from "@/lib/sharing";
import { consumeLimit, clientIdentity } from "@/lib/limits";
import { apiError, HttpError } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const data = await getPublicProfile((await params).username);
    if (!data)
      throw new HttpError(404, "Publique seu perfil antes de compartilhar.");
    await consumeLimit(clientIdentity(request), "public-qr", 30);
    return new Response(new Uint8Array(await qrPNG(data.profile.username)), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="qr-${data.profile.username}.png"`,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
