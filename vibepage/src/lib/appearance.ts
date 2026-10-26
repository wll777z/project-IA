import type { ProfileInput } from "@/lib/validation";
import { findTheme } from "@/lib/themes";
export function editableAppearance(
  profile: ProfileInput,
  pro: boolean,
): ProfileInput {
  if (pro) return profile;
  const theme = findTheme(profile.themeId);
  const allowed = theme.premium ? findTheme("midnight-purple") : theme;
  return {
    ...profile,
    themeId: allowed.id,
    backgroundColor: allowed.background,
    buttonStyle: "soft",
    animation: "none",
    hideBranding: false,
  };
}
