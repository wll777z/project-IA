import { db } from "@/lib/db";
import {
  profileSchema,
  gamerCardDTO,
  type GamerCardInput,
  type ProfileInput,
} from "@/lib/validation";
import { defaultEffects, FREE_CARD_LIMIT } from "@/lib/customization";
import { isPro } from "@/lib/entitlements";
import { findTheme } from "@/lib/themes";
import { HttpError } from "@/lib/http";
export const profileInclude = {
  gamerCards: { orderBy: { position: "asc" as const } },
  links: { orderBy: { position: "asc" as const } },
};
export function emptyProfile(name = ""): ProfileInput {
  return {
    ...defaultEffects,
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
  // Preserve legacy invalid values so owners can open the editor and fix them.
  // All new writes still go through profileSchema; renderers validate links.
  return {
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
  const data = profileSchema.parse(body);
  return db.$transaction(
    async (tx) => {
      // Serialize saves for the same owner; compare revision to reject stale tabs.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      const entitlement = await tx.entitlement.findUnique({
        where: { userId },
      });
      const pro = isPro(entitlement);
      const theme = findTheme(data.themeId);
      if (
        !pro &&
        (theme.premium ||
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
      const current = await tx.profile.findUnique({ where: { userId } });
      if (data.revision !== (current?.revision ?? 0))
        throw new HttpError(
          409,
          "Seu perfil foi alterado em outra aba. Recarregue antes de salvar.",
        );
      const keys = [
        data.avatarKey,
        data.backgroundKey,
        ...data.gamerCards.map((c) => c.avatarKey),
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
      const { links, gamerCards, revision, ...fields } = data;
      const profile = current
        ? await tx.profile.update({
            where: { id: current.id },
            data: { ...fields, revision: { increment: 1 } },
          })
        : await tx.profile.create({
            data: { ...fields, userId, revision: revision + 1 },
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
      return { ...data, revision: profile.revision };
    },
    { timeout: 15000 },
  );
}
