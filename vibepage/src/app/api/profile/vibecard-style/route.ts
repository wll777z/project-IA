import { z } from "zod";
import { db } from "@/lib/db";
import { isPro } from "@/lib/entitlements";
import { requireUser, readJSON, apiError, HttpError } from "@/lib/http";
import { consumeLimit } from "@/lib/limits";
import { vibeCardStyles } from "@/lib/studio-schema";
const schema = z
  .object({
    style: z.enum(vibeCardStyles),
    revision: z.number().int().nonnegative(),
  })
  .strict();
export async function POST(request: Request) {
  try {
    const user = await requireUser(request, true);
    await consumeLimit(user.id, "vibecard-style", 20);
    const data = schema.parse(await readJSON(request));
    const saved = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${user.id} FOR UPDATE`;
      if (
        data.style !== "minimal" &&
        !isPro(await tx.entitlement.findUnique({ where: { userId: user.id } }))
      )
        throw new HttpError(
          403,
          "Esse modelo de VibeCard precisa do plano Pro.",
        );
      const profile = await tx.profile.findUnique({
        where: { userId: user.id },
      });
      if (!profile?.published)
        throw new HttpError(400, "Publique seu perfil antes de compartilhar.");
      if (profile.revision !== data.revision)
        throw new HttpError(
          409,
          "Seu perfil mudou. Recarregue antes de salvar.",
        );
      return tx.profile.update({
        where: { id: profile.id },
        data: { vibeCardStyle: data.style, revision: { increment: 1 } },
        select: { revision: true },
      });
    });
    return Response.json(saved, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return apiError(e);
  }
}
