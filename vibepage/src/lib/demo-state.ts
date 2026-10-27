import { defaultStudio, studioSchema } from "@/lib/studio-schema";
import { profileSchema, type ProfileInput } from "@/lib/validation";
import { defaultEffects } from "@/lib/customization";
import { themes } from "@/lib/themes";
import { applyTheme } from "@/lib/appearance";
export function loadDemo(
  initial: ProfileInput,
  stored: string | null,
  themeId: string | null,
): ProfileInput {
  let base = initial;
  let restored = false;
  try {
    const value: unknown = stored ? JSON.parse(stored) : null;
    const parsed = profileSchema.safeParse(
      value && typeof value === "object" && !Array.isArray(value)
        ? {
            ...defaultEffects,
            gamerCards: [],
            studio: studioSchema.parse(defaultStudio),
            blocks: [],
            vibeCardStyle: "minimal",
            ...value,
          }
        : value,
    );
    if (parsed.success) {
      base = parsed.data;
      restored = true;
    }
  } catch {
    /* Invalid local storage must not prevent opening the editor. */
  }
  const requested = themes.find((theme) => theme.id === themeId);
  // A theme link chooses an initial preset. Reloading that same link must not
  // silently replace custom colors, card styles or effects already saved.
  return requested && (!restored || base.themeId !== requested.id)
    ? applyTheme(base, requested.id)
    : base;
}
