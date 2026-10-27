import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { isPro } from "@/lib/entitlements";
import { HttpError } from "@/lib/http";
import { getOwnedProfile } from "@/lib/profiles";
import {
  captureAppearance,
  applyAppearance,
  appearanceConfigSchema,
} from "@/lib/appearance-config";
import type { ProfileInput } from "@/lib/validation";
const name = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "Nome inválido.");
export const appearanceAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name }).strict(),
  z.object({ action: z.literal("duplicate"), id: z.uuid(), name }).strict(),
  z
    .object({
      action: z.literal("rename"),
      id: z.uuid(),
      name,
      revision: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      action: z.literal("remove"),
      id: z.uuid(),
      revision: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      action: z.literal("apply"),
      id: z.uuid(),
      profileRevision: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      action: z.literal("undo"),
      profileRevision: z.number().int().nonnegative(),
    })
    .strict(),
]);
export async function listAppearances(userId: string) {
  const [items, schedules, profile, entitlement, history] = await Promise.all([
    db.savedAppearance.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.appearanceSchedule.findMany({
      where: { userId },
      include: { appearance: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
    }),
    getOwnedProfile(userId),
    db.entitlement.findUnique({ where: { userId } }),
    db.profile.findUnique({
      where: { userId },
      select: { previousAppearance: true },
    }),
  ]);
  return {
    items: items.map(({ id, name, config, revision, createdAt }) => ({
      id,
      name,
      config,
      revision,
      createdAt,
    })),
    schedules: schedules.map(
      ({ id, appearanceId, startsAt, endsAt, timeZone, appearance }) => ({
        id,
        appearanceId,
        startsAt,
        endsAt,
        timeZone,
        name: appearance.name,
      }),
    ),
    profile,
    pro: isPro(entitlement),
    canUndo: !!history?.previousAppearance,
  };
}
export async function changeAppearance(userId: string, input: unknown) {
  const data = appearanceAction.parse(input);
  // Fetch the editable content after acquiring the owner lock in the transaction.
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      if (!isPro(await tx.entitlement.findUnique({ where: { userId } })))
        throw new HttpError(
          403,
          "Coleções de aparência precisam do plano Pro.",
        );
      const profile = await tx.profile.findUnique({
        where: { userId },
        include: {
          gamerCards: { orderBy: { position: "asc" } },
          links: { orderBy: { position: "asc" } },
          blocks: { orderBy: { position: "asc" } },
        },
      });
      if (!profile)
        throw new HttpError(400, "Salve seu perfil antes de criar aparências.");
      // The same DTO as the editor, built without a second connection during the lock.
      const { ownedProfileDTO } = await import("@/lib/profiles");
      const base = ownedProfileDTO(profile);
      if (data.action === "create" || data.action === "duplicate") {
        if ((await tx.savedAppearance.count({ where: { userId } })) >= 10)
          throw new HttpError(400, "Use no máximo dez aparências salvas.");
        const source =
          data.action === "duplicate"
            ? await tx.savedAppearance.findFirst({
                where: { id: data.id, userId },
              })
            : null;
        if (data.action === "duplicate" && !source)
          throw new HttpError(404, "Aparência não encontrada.");
        return tx.savedAppearance.create({
          data: {
            id: randomUUID(),
            userId,
            name: data.name,
            config: source
              ? appearanceConfigSchema.parse(source.config)
              : captureAppearance(base),
          },
        });
      }
      if (data.action === "rename" || data.action === "remove") {
        const item = await tx.savedAppearance.findFirst({
          where: { id: data.id, userId },
        });
        if (!item) throw new HttpError(404, "Aparência não encontrada.");
        if (item.revision !== data.revision)
          throw new HttpError(
            409,
            "A coleção mudou. Recarregue antes de continuar.",
          );
        if (data.action === "rename")
          return tx.savedAppearance.update({
            where: { id: item.id },
            data: { name: data.name, revision: { increment: 1 } },
          });
        await tx.savedAppearance.delete({ where: { id: item.id } });
        return { removed: true };
      }
      if (profile.revision !== data.profileRevision)
        throw new HttpError(
          409,
          "O perfil mudou. Recarregue antes de aplicar.",
        );
      const item =
        data.action === "apply"
          ? await tx.savedAppearance.findFirst({
              where: { id: data.id, userId },
            })
          : null;
      const config =
        data.action === "undo" ? profile.previousAppearance : item?.config;
      if (!config)
        throw new HttpError(
          404,
          "Aparência anterior ou coleção não encontrada.",
        );
      const next = applyAppearance(base, config);
      const settings = captureAppearance(next);
      const {
        version: _version,
        cardPresentation: _cards,
        blockSettings: _blocks,
        ...fields
      } = settings;
      void _version;
      void _cards;
      void _blocks;
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          ...fields,
          previousAppearance: captureAppearance(base),
          revision: { increment: 1 },
        },
      });
      for (const card of next.gamerCards) {
        const { id, color, style, layout, icon, glow, animated } = card;
        await tx.gamerCard.updateMany({
          where: { id, profileId: profile.id },
          data: { color, style, layout, icon, glow, animated },
        });
      }
      await tx.profileBlock.updateMany({
        where: { profileId: profile.id },
        data: { position: { increment: 1000 } },
      });
      for (const [position, block] of next.blocks.entries())
        await tx.profileBlock.updateMany({
          where: { id: block.id, profileId: profile.id },
          data: { payload: block, position },
        });
      return { applied: true, revision: profile.revision + 1 };
    },
    { timeout: 15000 },
  );
}
export const scheduleAction = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("create"),
      appearanceId: z.uuid(),
      startsAt: z.iso.datetime({ offset: true }),
      endsAt: z.iso.datetime({ offset: true }),
      timeZone: z
        .string()
        .max(80)
        .refine((v) => {
          try {
            new Intl.DateTimeFormat("pt-BR", { timeZone: v });
            return true;
          } catch {
            return false;
          }
        }, "Fuso inválido."),
    })
    .strict(),
  z.object({ action: z.literal("cancel"), id: z.uuid() }).strict(),
]);
export async function changeSchedule(
  userId: string,
  input: unknown,
  now = new Date(),
) {
  const data = scheduleAction.parse(input);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
    // Cancellation is always allowed to the owner after downgrade.
    if (data.action === "cancel") {
      const result = await tx.appearanceSchedule.deleteMany({
        where: { id: data.id, userId },
      });
      if (!result.count)
        throw new HttpError(404, "Agendamento não encontrado.");
      return { cancelled: true };
    }
    if (!isPro(await tx.entitlement.findUnique({ where: { userId } }), now))
      throw new HttpError(403, "Agendamentos precisam do plano Pro.");
    const startsAt = new Date(data.startsAt),
      endsAt = new Date(data.endsAt);
    if (
      endsAt <= startsAt ||
      endsAt <= now ||
      endsAt.getTime() - startsAt.getTime() > 90 * 86400000 ||
      startsAt.getTime() - now.getTime() > 366 * 86400000
    )
      throw new HttpError(
        400,
        "Use um intervalo futuro de até 90 dias, iniciando em até um ano.",
      );
    if (
      !(await tx.savedAppearance.findFirst({
        where: { id: data.appearanceId, userId },
      }))
    )
      throw new HttpError(404, "Aparência não encontrada.");
    if ((await tx.appearanceSchedule.count({ where: { userId } })) >= 20)
      throw new HttpError(
        400,
        "Limite de vinte registros. Cancele agendamentos encerrados para liberar espaço.",
      );
    if (
      (await tx.appearanceSchedule.count({
        where: { userId, endsAt: { gt: now } },
      })) >= 5
    )
      throw new HttpError(400, "Limite de cinco agendamentos futuros.");
    if (
      await tx.appearanceSchedule.findFirst({
        where: { userId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
      })
    )
      throw new HttpError(409, "Existe outro agendamento nesse intervalo.");
    return tx.appearanceSchedule.create({
      data: {
        id: randomUUID(),
        userId,
        appearanceId: data.appearanceId,
        startsAt,
        endsAt,
        timeZone: data.timeZone,
      },
    });
  });
}
export async function resolveSeason(
  userId: string,
  base: ProfileInput,
  pro: boolean,
  now = new Date(),
) {
  if (!pro) return base;
  const scheduled = await db.appearanceSchedule.findFirst({
    where: { userId, startsAt: { lte: now }, endsAt: { gt: now } },
    include: { appearance: true },
    orderBy: { startsAt: "desc" },
  });
  return scheduled && scheduled.appearance.userId === userId
    ? applyAppearance(base, scheduled.appearance.config)
    : base;
}
