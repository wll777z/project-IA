import { z } from "zod";
import { getPublicProfile } from "@/lib/public-profile";
import { vibeCardPNG } from "@/lib/sharing";
import { vibeCardStyles } from "@/lib/studio-schema";
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
    const requested = new URL(request.url).searchParams.get("style");
    const style = requested
      ? z.enum(vibeCardStyles).parse(requested)
      : data.profile.vibeCardStyle;
    await consumeLimit(clientIdentity(request), "public-vibecard", 12);
    return await vibeCardPNG(data.profile, data.pro ? style : "minimal");
  } catch (e) {
    return apiError(e);
  }
}
