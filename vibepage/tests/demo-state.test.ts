import { it, expect } from "vitest";
import { loadDemo } from "../src/lib/demo-state";
import { applyTheme } from "../src/lib/appearance";
import { demoProfile } from "../src/lib/demo-profile";
import { defaultEffects } from "../src/lib/customization";
it("recarregar o mesmo link de tema não sobrescreve cores, estilos e efeitos salvos", () => {
  const source = {
    ...applyTheme(demoProfile, "aurora-blue"),
    accentColor: "#12ab34",
    backgroundEffect: "stars" as const,
    gamerCards: demoProfile.gamerCards.map((c) => ({
      ...c,
      style: "pixel" as const,
    })),
  };
  expect(loadDemo(demoProfile, JSON.stringify(source), "aurora-blue")).toEqual(
    source,
  );
});
it("um novo tema explícito aplica o preset preservando conteúdo e IDs", () => {
  const selected = loadDemo(
    demoProfile,
    JSON.stringify(demoProfile),
    "aurora-blue",
  );
  expect(selected.themeId).toBe("aurora-blue");
  expect(selected.backgroundEffect).toBe("aurora");
  expect(selected.gamerCards[0].id).toBe(demoProfile.gamerCards[0].id);
});
it("migra demo antiga sem perder nome ou links", () => {
  const legacy = Object.fromEntries(
    Object.entries(demoProfile).filter(
      ([key]) =>
        !Object.keys(defaultEffects).includes(key) && key !== "gamerCards",
    ),
  );
  const result = loadDemo(
    demoProfile,
    JSON.stringify({ ...legacy, displayName: "Legacy player" }),
    null,
  );
  expect(result.displayName).toBe("Legacy player");
  expect(result.links).toEqual(demoProfile.links);
  expect(result.gamerCards).toEqual([]);
});
it("dados corrompidos não impedem abrir ou selecionar tema", () => {
  expect(loadDemo(demoProfile, "not-json", null)).toEqual(demoProfile);
  expect(loadDemo(demoProfile, "[]", "aurora-blue").themeId).toBe(
    "aurora-blue",
  );
});
