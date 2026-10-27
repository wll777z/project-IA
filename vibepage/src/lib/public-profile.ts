import { resolveSeason } from "@/lib/appearance-store";
import { studioSchema } from "@/lib/studio-schema";
import { blockSchema } from "@/lib/validation";
import { editableAppearance } from "@/lib/appearance";
import {
  gamerCardSchema,
  gamerCardDTO,
  type GamerCardInput,
} from "@/lib/validation";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  usernameSchema,
  safeLinkSchema,
  type ProfileInput,
} from "@/lib/validation";
import { findTheme } from "@/lib/themes";
import { isPro } from "@/lib/entitlements";
export const getPublicProfile = cache(async (username: string) => {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return null;
  const profile = await db.profile.findUnique({
    where: { username: parsed.data },
    include: {
      blocks: { orderBy: { position: "asc" } },
      gamerCards: { orderBy: { position: "asc" } },
      links: { orderBy: { position: "asc" } },
      user: { select: { entitlement: true } },
    },
  });
  if (!profile?.published || profile.suspendedAt) return null;
  const pro = isPro(profile.user.entitlement);
  const theme = findTheme(profile.themeId);
  const effectiveTheme =
    theme.premium && !pro ? findTheme("midnight-purple") : theme;
  // Explicit public DTO: never send email, userId, billing or session data.
  const data: ProfileInput = {
    studio: studioSchema.parse(profile.studio),
    blocks: pro
      ? profile.blocks.flatMap((b) => {
          const v = blockSchema.safeParse(b.payload);
          return v.success ? [v.data] : [];
        })
      : [],
    vibeCardStyle: pro
      ? (profile.vibeCardStyle as ProfileInput["vibeCardStyle"])
      : "minimal",
    backgroundEffect:
      profile.backgroundEffect as ProfileInput["backgroundEffect"],
    avatarEffect: profile.avatarEffect as ProfileInput["avatarEffect"],
    buttonEffect: profile.buttonEffect as ProfileInput["buttonEffect"],
    entranceEffect: profile.entranceEffect as ProfileInput["entranceEffect"],
    fontFamily: profile.fontFamily as ProfileInput["fontFamily"],
    gamerCards: profile.gamerCards.flatMap((card) => {
      const parsed = gamerCardSchema.safeParse(
        gamerCardDTO(card as GamerCardInput),
      );
      return parsed.success ? [parsed.data] : [];
    }),
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    themeId: effectiveTheme.id,
    accentColor: profile.accentColor,
    backgroundColor: pro ? profile.backgroundColor : effectiveTheme.background,
    buttonStyle: pro
      ? (profile.buttonStyle as ProfileInput["buttonStyle"])
      : "soft",
    animation: pro ? (profile.animation as ProfileInput["animation"]) : "none",
    hideBranding: pro && profile.hideBranding,
    published: true,
    avatarKey: profile.avatarKey,
    backgroundKey: pro ? profile.backgroundKey : null,
    revision: profile.revision,
    links: profile.links.flatMap((l) => {
      const parsed = safeLinkSchema.safeParse(l.url);
      return parsed.success
        ? [{ id: l.id, title: l.title, url: parsed.data }]
        : [];
    }),
  };
  const effective = editableAppearance(
    await resolveSeason(profile.userId, data, pro),
    pro,
  );
  effective.blocks = effective.studio.hidden.includes("blocks")
    ? []
    : effective.blocks.filter((b) => !b.hidden);
  if (effective.studio.hidden.includes("gamerCards")) effective.gamerCards = [];
  if (effective.studio.hidden.includes("links")) effective.links = [];
  if (effective.studio.hidden.includes("identity")) {
    effective.bio = "";
    effective.avatarKey = null;
  }
  return { profile: effective, pro };
});
export { appOrigin } from "@/lib/site-origin";
