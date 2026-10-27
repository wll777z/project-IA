import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { usernameSchema } from "@/lib/validation";
import { supportConfig } from "@/lib/support-config";
const text = (n: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(n)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
      "Texto inválido.",
    );
export const supportCaseSchema = z
  .object({
    kind: z.enum(["SUPPORT", "REPORT"]),
    category: z.enum([
      "ACCOUNT",
      "PRIVACY",
      "TECHNICAL",
      "PHISHING",
      "ABUSE",
      "ILLEGAL",
      "OTHER",
    ]),
    subject: text(120),
    message: text(2000),
    replyEmail: z.union([z.literal(""), z.email().max(254)]),
    username: z.union([z.literal(""), usernameSchema]),
    noticeVersion: z.string().max(80),
  })
  .strict();
export async function createSupportCase(input: unknown) {
  const config = supportConfig();
  if (!config)
    throw new HttpError(
      503,
      "O canal ainda não foi configurado pelo responsável.",
    );
  if (
    !(await db.administrator.count({
      where: { user: { emailVerified: true } },
    }))
  )
    throw new HttpError(503, "A equipe de suporte ainda não está disponível.");
  const data = supportCaseSchema.parse(input);
  if (data.noticeVersion !== config.version)
    throw new HttpError(
      409,
      "As informações de privacidade mudaram. Recarregue antes de enviar.",
    );
  const profile =
    data.kind === "REPORT" && data.username
      ? await db.profile.findUnique({
          where: { username: data.username },
          select: { id: true, published: true, suspendedAt: true },
        })
      : null;
  if (data.kind === "REPORT" && (!profile?.published || profile.suspendedAt))
    throw new HttpError(
      400,
      "Informe um perfil público disponível para denunciar.",
    );
  const item = await db.supportCase.create({
    data: {
      id: randomUUID(),
      kind: data.kind,
      category: data.category,
      subject: data.subject,
      message: data.message,
      replyEmail: data.replyEmail || null,
      targetUsername: data.kind === "REPORT" ? data.username : null,
      profileId: profile?.id,
      expiresAt: new Date(Date.now() + config.retentionDays * 86400000),
    },
  });
  return { id: item.id };
}
export const caseStatus = z.enum([
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "DISMISSED",
]);
export async function listSupportCases(status: string, cursor?: string) {
  const filter = z.union([caseStatus, z.literal("ALL")]).parse(status);
  if (cursor) z.uuid().parse(cursor);
  const items = await db.supportCase.findMany({
    where: {
      ...(filter === "ALL" ? {} : { status: filter }),
      expiresAt: { gt: new Date() },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 21,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      profile: { select: { username: true, suspendedAt: true } },
      events: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { action: true, createdAt: true },
      },
    },
  });
  return {
    items: items.slice(0, 20),
    cursor: items.length > 20 ? items[19].id : null,
  };
}
export const caseActionSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    status: caseStatus,
    note: text(1000).min(5),
    action: z.enum(["review", "hide-profile", "restore-profile"]),
  })
  .strict();
export async function reviewSupportCase(
  actorId: string,
  id: string,
  input: unknown,
) {
  z.uuid().parse(id);
  const data = caseActionSchema.parse(input);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id=${actorId} FOR UPDATE`;
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: {
        emailVerified: true,
        administrator: { select: { userId: true } },
      },
    });
    if (!actor?.emailVerified || !actor.administrator)
      throw new HttpError(403, "Acesso restrito à administração.");
    const item = await tx.supportCase.findUnique({ where: { id } });
    if (!item || item.expiresAt <= new Date())
      throw new HttpError(404, "Caso indisponível.");
    const updated = await tx.supportCase.updateMany({
      where: { id, revision: data.revision },
      data: {
        status: data.status,
        internalNote: data.note,
        revision: { increment: 1 },
      },
    });
    if (!updated.count)
      throw new HttpError(409, "O caso mudou. Recarregue antes de revisar.");
    if (data.action !== "review") {
      if (!item.profileId || item.kind !== "REPORT")
        throw new HttpError(
          400,
          "Este caso não possui perfil disponível para moderação.",
        );
      await tx.profile.update({
        where: { id: item.profileId },
        data: {
          suspendedAt: data.action === "hide-profile" ? new Date() : null,
          revision: { increment: 1 },
        },
      });
    }
    await tx.supportCaseEvent.create({
      data: {
        id: randomUUID(),
        caseId: id,
        actorId,
        action: data.action + ":" + data.status,
      },
    });
    return { updated: true };
  });
}
