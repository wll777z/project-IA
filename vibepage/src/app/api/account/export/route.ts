import { db } from "@/lib/db";
import { requireUser, apiError } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const record = await db.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        createdAt: true,
        profile: { include: { links: true, views: true, gamerCards: true } },
        entitlement: { select: { plan: true, expiresAt: true } },
        uploads: {
          select: {
            id: true,
            kind: true,
            mimeType: true,
            width: true,
            height: true,
            createdAt: true,
          },
        },
      },
    });
    return Response.json(record, {
      headers: {
        "Content-Disposition": "attachment; filename=vibepage-meus-dados.json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
