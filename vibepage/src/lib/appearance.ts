import { defaultEffects, FREE_CARD_LIMIT } from "@/lib/customization";
import type { ProfileInput } from "@/lib/validation";
import { findTheme } from "@/lib/themes";
export function editableAppearance(
  profile: ProfileInput,
  pro: boolean,
  preserveCards = false,
): ProfileInput {
  if (pro) return profile;
  const theme = findTheme(profile.themeId);
  const allowed = theme.premium ? findTheme("midnight-purple") : theme;
  return {
    ...profile,
    ...defaultEffects,
    entranceEffect: profile.entranceEffect === "none" ? "none" : "fade",
    gamerCards: profile.gamerCards
      .slice(0, preserveCards ? profile.gamerCards.length : FREE_CARD_LIMIT)
      .map((c) => ({
        ...c,
        style: c.style === "neon" ? "neon" : "minimal",
        layout: "compact",
        glow: false,
        animated: false,
      })),
    themeId: allowed.id,
    backgroundColor: allowed.background,
    buttonStyle: "soft",
    animation: "none",
    hideBranding: false,
  };
}
