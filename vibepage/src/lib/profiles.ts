import type { Prisma } from "@/generated/prisma/client";
import { isDeepStrictEqual } from "node:util";
import { studioSchema, defaultStudio } from "@/lib/studio-schema";
import { db } from "@/lib/db";
import {
  profileSchema,
  blockSchema,
  gamerCardDTO,
  type GamerCardInput,
  type ProfileInput,
} from "@/lib/validation";
import { defaultEffects, FREE_CARD_LIMIT } from "@/lib/customization";
import { isPro } from "@/lib/entitlements";
import { findTheme } from "@/lib/themes";
import { HttpError } from "@/lib/http";
export const profileInclude = {
  blocks: { orderBy: { position: "asc" as const } },
  gamerCards: { orderBy: { position: "asc" as const } },
  links: { orderBy: { position: "asc" as const } },
};
export function emptyProfile(name = ""): ProfileInput {
  return {
    ...defaultEffects,
    studio: studioSchema.parse(defaultStudio),
    blocks: [],
    vibeCardStyle: "minimal",
    gamerCards: [],
    username: "",
    displayName: name,
    bio: "",
    themeId: "midnight-purple",
    accentColor: "#a78bfa",
    backgroundColor: "#100c1b",
    buttonStyle: "soft",
    animation: "none",
    hideBranding: false,
    published: false,
    avatarKey: null,
    backgroundKey: null,
    revision: 0,
    links: [],
  };
}
export async function getOwnedProfile(userId: string) {
  const profile = await db.profile.findUnique({
    where: { userId },
    include: profileInclude,
  });
  if (!profile) return null;
  return ownedProfileDTO(profile);
}
export function ownedProfileDTO(
  profile: Prisma.ProfileGetPayload<{ include: typeof profileInclude }>,
): ProfileInput {
  return {
    studio: studioSchema.parse(profile.studio),
    blocks: profile.blocks.map((b) => blockSchema.parse(b.payload)),
    vibeCardStyle: profile.vibeCardStyle as ProfileInput["vibeCardStyle"],
    backgroundEffect:
      profile.backgroundEffect as ProfileInput["backgroundEffect"],
    avatarEffect: profile.avatarEffect as ProfileInput["avatarEffect"],
    buttonEffect: profile.buttonEffect as ProfileInput["buttonEffect"],
    entranceEffect: profile.entranceEffect as ProfileInput["entranceEffect"],
    fontFamily: profile.fontFamily as ProfileInput["fontFamily"],
    gamerCards: profile.gamerCards.map((card) =>
      gamerCardDTO(card as GamerCardInput),
    ),
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    themeId: profile.themeId as ProfileInput["themeId"],
    accentColor: profile.accentColor,
    backgroundColor: profile.backgroundColor,
    buttonStyle: profile.buttonStyle as ProfileInput["buttonStyle"],
    animation: profile.animation as ProfileInput["animation"],
    hideBranding: profile.hideBranding,
    published: profile.published,
    avatarKey: profile.avatarKey,
    backgroundKey: profile.backgroundKey,
    revision: profile.revision,
    links: profile.links.map((l) => ({ id: l.id, title: l.title, url: l.url })),
  };
}
export async function saveProfile(userId: string, body: unknown) {
  const incoming =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  const data = profileSchema.parse(
    incoming
      ? {
          studio: studioSchema.parse(defaultStudio),
          blocks: [],
          vibeCardStyle: "minimal",
          ...incoming,
        }
      : body,
  );
  return db.$transaction(
    async (tx) => {
      // Serialize saves for the same owner; compare revision to reject stale tabs.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      const entitlement = await tx.entitlement.findUnique({
        where: { userId },
      });
      const pro = isPro(entitlement);
      const current = await tx.profile.findUnique({
        where: { userId },
        include: profileInclude,
      });
      const storedStudio = current
        ? studioSchema.parse(current.studio)
        : studioSchema.parse(defaultStudio);
      const storedBlocks =
        current?.blocks.map((b) => blockSchema.parse(b.payload)) ?? [];
      // Older clients may submit identity/links without Studio metadata. Never
      // erase newer private configuration merely because a field was omitted.
      if (!Object.hasOwn(incoming ?? {}, "studio")) data.studio = storedStudio;
      if (!Object.hasOwn(incoming ?? {}, "blocks")) data.blocks = storedBlocks;
      if (!Object.hasOwn(incoming ?? {}, "vibeCardStyle"))
        data.vibeCardStyle =
          (current?.vibeCardStyle as ProfileInput["vibeCardStyle"]) ??
          "minimal";
      if (
        !pro &&
        ((!isDeepStrictEqual(data.studio, storedStudio) &&
          !isDeepStrictEqual(data.studio, studioSchema.parse(defaultStudio))) ||
          (data.blocks.length > 0 &&
            !isDeepStrictEqual(data.blocks, storedBlocks)) ||
          (data.vibeCardStyle !== "minimal" &&
            data.vibeCardStyle !== current?.vibeCardStyle))
      )
        throw new HttpError(
          403,
          "O Profile Studio e os blocos precisam do plano Pro.",
        );
      const theme = findTheme(data.themeId);
      if (
        !pro &&
        (theme.premium ||
          data.backgroundKey !== null ||
          data.gamerCards.length > FREE_CARD_LIMIT ||
          data.gamerCards.some(
            (c) =>
              c.glow ||
              c.animated ||
              !["minimal", "neon"].includes(c.style) ||
              c.layout !== "compact",
          ) ||
          data.backgroundEffect !== "none" ||
          data.avatarEffect !== "none" ||
          data.buttonEffect !== "none" ||
          !["none", "fade"].includes(data.entranceEffect) ||
          data.fontFamily !== "modern" ||
          data.hideBranding ||
          data.animation !== "none" ||
          data.buttonStyle !== "soft" ||
          data.backgroundColor !== theme.background)
      )
        throw new HttpError(403, "Essa personalização precisa do plano Pro.");
      if (data.revision !== (current?.revision ?? 0))
        throw new HttpError(
          409,
          "Seu perfil foi alterado em outra aba. Recarregue antes de salvar.",
        );
      const keys = [
        data.avatarKey,
        data.backgroundKey,
        ...data.gamerCards.map((c) => c.avatarKey),
        ...data.blocks.flatMap((b) => b.imageKeys),
      ].filter((k): k is string => !!k);
      const uploads = await tx.upload.findMany({
        where: { userId, id: { in: keys } },
        select: { id: true, kind: true },
      });
      if (
        (data.avatarKey &&
          !uploads.some(
            (u) => u.id === data.avatarKey && u.kind === "avatar",
          )) ||
        (data.backgroundKey &&
          !uploads.some(
            (u) => u.id === data.backgroundKey && u.kind === "background",
          )) ||
        data.gamerCards.some(
          (c) =>
            c.avatarKey &&
            !uploads.some(
              (u) => u.id === c.avatarKey && u.kind === "gamer-avatar",
            ),
        )
      )
        throw new HttpError(403, "Use apenas imagens enviadas pela sua conta.");
      if (
        pro &&
        data.blocks.some(
          (b) =>
            b.imageKeys.some(
              (id) => !uploads.some((u) => u.id === id && u.kind === "gallery"),
            ) ||
            (b.cardId && !data.gamerCards.some((c) => c.id === b.cardId)),
        )
      )
        throw new HttpError(
          403,
          "Bloco referencia imagem ou cartão que não pertence ao perfil.",
        );
      if (
        pro &&
        (await tx.profileBlock.findFirst({
          where: {
            id: { in: data.blocks.map((b) => b.id) },
            ...(current ? { profileId: { not: current.id } } : {}),
          },
        }))
      )
        throw new HttpError(403, "Um dos blocos não pertence ao seu perfil.");
      const foreign = await tx.profileLink.findFirst({
        where: {
          id: { in: data.links.map((l) => l.id) },
          ...(current ? { profileId: { not: current.id } } : {}),
        },
      });
      if (foreign)
        throw new HttpError(403, "Um dos links não pertence ao seu perfil.");
      await tx.theme.upsert({
        where: { id: theme.id },
        create: { id: theme.id, name: theme.name, premium: theme.premium },
        update: {},
      });
      const foreignCard = await tx.gamerCard.findFirst({
        where: {
          id: { in: data.gamerCards.map((c) => c.id) },
          ...(current ? { profileId: { not: current.id } } : {}),
        },
      });
      if (foreignCard)
        throw new HttpError(403, "Um dos cartões não pertence ao seu perfil.");
      const {
        links,
        gamerCards,
        blocks,
        studio,
        vibeCardStyle,
        revision,
        ...fields
      } = data;
      const studioFields = pro ? { studio, vibeCardStyle } : {};
      const profile = current
        ? await tx.profile.update({
            where: { id: current.id },
            data: { ...fields, ...studioFields, revision: { increment: 1 } },
          })
        : await tx.profile.create({
            data: {
              ...fields,
              ...studioFields,
              userId,
              revision: revision + 1,
            },
          });
      await tx.profileLink.deleteMany({
        where: { profileId: profile.id, id: { notIn: links.map((l) => l.id) } },
      });
      // Move existing positions out of the target range before reordering unique slots.
      await tx.profileLink.updateMany({
        where: { profileId: profile.id },
        data: { position: { increment: 1000 } },
      });
      for (const [position, link] of links.entries()) {
        // Never upsert by a global, client-supplied id: another owner can claim
        // a new id after the preflight check. A collision must roll back.
        const owned = await tx.profileLink.updateMany({
          where: { id: link.id, profileId: profile.id },
          data: { title: link.title, url: link.url, position },
        });
        if (!owned.count)
          await tx.profileLink.create({
            data: { ...link, profileId: profile.id, position },
          });
      }
      await tx.gamerCard.deleteMany({
        where: {
          profileId: profile.id,
          id: { notIn: gamerCards.map((c) => c.id) },
        },
      });
      await tx.gamerCard.updateMany({
        where: { profileId: profile.id },
        data: { position: { increment: 1000 } },
      });
      for (const [position, card] of gamerCards.entries()) {
        const owned = await tx.gamerCard.updateMany({
          where: { id: card.id, profileId: profile.id },
          data: { ...card, position },
        });
        if (!owned.count)
          await tx.gamerCard.create({
            data: { ...card, profileId: profile.id, position },
          });
      }
      await tx.upload.deleteMany({
        where: {
          userId,
          kind: "gamer-avatar",
          id: {
            notIn: gamerCards.flatMap((c) =>
              c.avatarKey ? [c.avatarKey] : [],
            ),
          },
        },
      });
      if (pro) {
        await tx.profileBlock.deleteMany({
          where: {
            profileId: profile.id,
            id: { notIn: blocks.map((b) => b.id) },
          },
        });
        await tx.profileBlock.updateMany({
          where: { profileId: profile.id },
          data: { position: { increment: 1000 } },
        });
        for (const [position, block] of blocks.entries()) {
          const owned = await tx.profileBlock.updateMany({
            where: { id: block.id, profileId: profile.id },
            data: { payload: block, position },
          });
          if (!owned.count)
            await tx.profileBlock.create({
              data: {
                id: block.id,
                profileId: profile.id,
                payload: block,
                position,
              },
            });
        }
      }
      if (pro)
        await tx.upload.deleteMany({
          where: {
            userId,
            kind: "gallery",
            id: { notIn: blocks.flatMap((b) => b.imageKeys) },
          },
        });
      return {
        ...data,
        studio: pro ? studio : storedStudio,
        blocks: pro ? blocks : storedBlocks,
        vibeCardStyle: pro
          ? vibeCardStyle
          : ((current?.vibeCardStyle as ProfileInput["vibeCardStyle"]) ??
            "minimal"),
        revision: profile.revision,
      };
    },
    { timeout: 15000 },
  );
}
