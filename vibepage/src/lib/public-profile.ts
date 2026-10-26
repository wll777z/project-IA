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
      links: { orderBy: { position: "asc" } },
      user: { select: { entitlement: true } },
    },
  });
  if (!profile?.published) return null;
  const pro = isPro(profile.user.entitlement);
  const theme = findTheme(profile.themeId);
  const effectiveTheme =
    theme.premium && !pro ? findTheme("midnight-purple") : theme;
  // Explicit public DTO: never send email, userId, billing or session data.
  const data: ProfileInput = {
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
    backgroundKey: profile.backgroundKey,
    revision: profile.revision,
    links: profile.links.flatMap((l) => {
      const parsed = safeLinkSchema.safeParse(l.url);
      return parsed.success
        ? [{ id: l.id, title: l.title, url: parsed.data }]
        : [];
    }),
  };
  return { profile: data, pro };
});
export function appOrigin() {
  return new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").origin;
}
