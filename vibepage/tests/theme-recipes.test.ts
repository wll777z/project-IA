import { it, expect } from "vitest";
import { themes, themeRecipes } from "../src/lib/themes";
import { applyTheme, editableAppearance } from "../src/lib/appearance";
import { profileSchema } from "../src/lib/validation";
import { demoProfile } from "../src/lib/demo-profile";
it.each(themes)(
  "tema $name aplica um preset válido sem perder identidade, links e cartões",
  (theme) => {
    const selected = applyTheme(demoProfile, theme.id);
    expect(profileSchema.safeParse(selected).success).toBe(true);
    expect(selected.displayName).toBe(demoProfile.displayName);
    expect(selected.links).toEqual(demoProfile.links);
    expect(selected.gamerCards[0].id).toBe(demoProfile.gamerCards[0].id);
    expect(selected.gamerCards[0].url).toBe(demoProfile.gamerCards[0].url);
    expect(selected.fontFamily).toBe(themeRecipes[theme.id].fontFamily);
    if (!theme.premium)
      expect(editableAppearance(selected, false)).toEqual({
        ...selected,
        gamerCards: selected.gamerCards.map((c) => ({
          ...c,
          glow: false,
          animated: false,
        })),
      });
  },
);
it("troca só de paleta mantém efeitos e estilos customizados", () => {
  const source = {
    ...demoProfile,
    avatarEffect: "ring" as const,
    backgroundEffect: "waves" as const,
  };
  const selected = applyTheme(source, "aurora-blue", false);
  expect(selected.themeId).toBe("aurora-blue");
  expect(selected.avatarEffect).toBe("ring");
  expect(selected.backgroundEffect).toBe("waves");
  expect(selected.gamerCards).toEqual(source.gamerCards);
});
it("Pro expirado usa a mesma aparência na prévia e no renderer Free", () => {
  const pro = applyTheme(
    {
      ...demoProfile,
      backgroundKey: "a0a5e84f-985a-4a02-b63a-0b2b2fa31761",
      hideBranding: true,
    },
    "aurora-blue",
  );
  const free = editableAppearance(pro, false);
  expect(free.backgroundKey).toBeNull();
  expect(free.themeId).toBe("midnight-purple");
  expect(free.hideBranding).toBe(false);
  expect(free.backgroundEffect).toBe("none");
});
