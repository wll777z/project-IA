import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser, readLimited, apiError, HttpError } from "@/lib/http";
import { consumeLimit } from "@/lib/limits";
import { processImage, MAX_UPLOAD } from "@/lib/uploads";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    const user = await requireUser(request, true);
    const { kind } = await params;
    if (kind !== "avatar" && kind !== "background")
      throw new HttpError(400, "Tipo de imagem inválido.");
    await consumeLimit(user.id, "upload", 8);
    const image = await processImage(
      await readLimited(request, MAX_UPLOAD),
      request.headers.get("content-type") || "",
      kind,
    );
    const upload = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${user.id} FOR UPDATE`;
      const profile = await tx.profile.findUnique({
        where: { userId: user.id },
        select: { avatarKey: true, backgroundKey: true },
      });
      const activeId =
        kind === "avatar" ? profile?.avatarKey : profile?.backgroundKey;
      const active = activeId
        ? await tx.upload.findUnique({
            where: { id: activeId },
            select: { slot: true },
          })
        : null;
      const slot = active?.slot === 0 ? 1 : 0;
      await tx.upload.deleteMany({ where: { userId: user.id, kind, slot } });
      return tx.upload.create({
        data: { id: randomUUID(), userId: user.id, kind, slot, ...image },
        select: { id: true },
      });
    });
    return Response.json({ key: upload.id });
  } catch (e) {
    return apiError(e);
  }
}
