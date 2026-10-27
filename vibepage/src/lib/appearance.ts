import { defaultStudio, studioSchema } from "@/lib/studio-schema";
import { defaultEffects, FREE_CARD_LIMIT } from "@/lib/customization";
import type { ProfileInput } from "@/lib/validation";
import { findTheme, themeRecipes, type ThemeId } from "@/lib/themes";
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
    studio: preserveCards ? profile.studio : studioSchema.parse(defaultStudio),
    blocks: preserveCards ? profile.blocks : [],
    vibeCardStyle: "minimal",
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
    backgroundKey: null,
    buttonStyle: "soft",
    animation: "none",
    hideBranding: false,
  };
}

export function applyTheme(
  profile: ProfileInput,
  id: ThemeId,
  complete = true,
): ProfileInput {
  const theme = findTheme(id);
  const palette = {
    ...profile,
    themeId: theme.id,
    accentColor: theme.accent,
    backgroundColor: theme.background,
  };
  if (!complete) return palette;
  const { cardStyle, ...appearance } = themeRecipes[id];
  return {
    ...palette,
    ...appearance,
    gamerCards: profile.gamerCards.map((card) => ({
      ...card,
      style: cardStyle,
    })),
  };
}

// Called only after validating Free inputs and ownership on the server. Keep
// dormant Pro presentation in existing columns; the public DTO still downgrades it.
export function retainPrivateProAppearance(
  current: ProfileInput,
  input: ProfileInput,
): ProfileInput {
  const basic = editableAppearance(current, false, true);
  return {
    ...input,
    themeId: input.themeId === basic.themeId ? current.themeId : input.themeId,
    backgroundKey: current.backgroundKey,
    backgroundColor:
      current.backgroundColor === basic.backgroundColor
        ? input.backgroundColor
        : current.backgroundColor,
    buttonStyle: current.buttonStyle,
    animation: current.animation,
    hideBranding: current.hideBranding,
    backgroundEffect: current.backgroundEffect,
    avatarEffect: current.avatarEffect,
    buttonEffect: current.buttonEffect,
    fontFamily: current.fontFamily,
    entranceEffect:
      input.entranceEffect === basic.entranceEffect
        ? current.entranceEffect
        : input.entranceEffect,
    gamerCards: input.gamerCards.map((card) => {
      const old = current.gamerCards.find((c) => c.id === card.id);
      const oldBasic = basic.gamerCards.find((c) => c.id === card.id);
      return old && oldBasic
        ? {
            ...card,
            style: card.style === oldBasic.style ? old.style : card.style,
            layout: old.layout,
            glow: old.glow,
            animated: old.animated,
          }
        : card;
    }),
  };
}
