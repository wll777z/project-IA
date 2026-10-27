import { it, expect } from "vitest";
import { demoProfile } from "../src/lib/demo-profile";
import { profileSchema } from "../src/lib/validation";
import {
  profileTemplates,
  applyProfileTemplate,
} from "../src/lib/profile-templates";
import {
  captureAppearance,
  applyAppearance,
} from "../src/lib/appearance-config";
it.each(profileTemplates)(
  "modelo $name preserva conteúdo e gera perfil válido",
  (template) => {
    const next = applyProfileTemplate(demoProfile, template.id);
    expect(profileSchema.safeParse(next).success).toBe(true);
    expect(next.links).toEqual(demoProfile.links);
    expect(next.blocks).toEqual(demoProfile.blocks);
    expect(next.bio).toBe(demoProfile.bio);
    expect(
      next.gamerCards.map(({ id, displayName, handle, url }) => ({
        id,
        displayName,
        handle,
        url,
      })),
    ).toEqual(
      demoProfile.gamerCards.map(({ id, displayName, handle, url }) => ({
        id,
        displayName,
        handle,
        url,
      })),
    );
  },
);
it("restaurar aparência não desfaz edições de conteúdo feitas após aplicar modelo", () => {
  const before = captureAppearance(demoProfile);
  const themed = applyProfileTemplate(demoProfile, "creator");
  const edited = {
    ...themed,
    bio: "Minha bio nova",
    gamerCards: themed.gamerCards.map((c) => ({
      ...c,
      displayName: "Nome editado",
      url: "https://example.com/new",
    })),
  };
  const restored = applyAppearance(edited, before);
  expect(restored.bio).toBe("Minha bio nova");
  expect(restored.gamerCards[0].displayName).toBe("Nome editado");
  expect(restored.gamerCards[0].url).toBe("https://example.com/new");
  expect(restored.studio).toEqual(demoProfile.studio);
  expect(restored.themeId).toBe(demoProfile.themeId);
});
