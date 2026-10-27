import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { it, expect } from "vitest";
import { GamerCard } from "../src/components/gamer-card";
import { StatsChart } from "../src/components/stats-chart";
import { demoProfile } from "../src/lib/demo-profile";
import { editableAppearance } from "../src/lib/appearance";
import { themes } from "../src/lib/themes";
it("escapa conteúdo de cartões e remove links perigosos no renderer", () => {
  const html = renderToStaticMarkup(
    <GamerCard
      card={{
        ...demoProfile.gamerCards[0],
        displayName: '<img onerror="alert(1)">',
        url: "javascript:alert(1)",
      }}
    />,
  );
  expect(html).toContain("&lt;img");
  expect(html).not.toContain('href="javascript');
  expect(html).not.toContain("<img onerror");
});
it("links externos seguros têm isolamento e destino visível", () => {
  const html = renderToStaticMarkup(
    <GamerCard card={demoProfile.gamerCards[0]} />,
  );
  expect(html).toContain('rel="noopener noreferrer nofollow ugc"');
  expect(html).toContain("www.roblox.com");
  expect(html).not.toContain("online");
});
it("temas têm IDs únicos e preservam os cinco originais", () => {
  expect(new Set(themes.map((t) => t.id)).size).toBe(12);
  expect(themes.slice(0, 5).map((t) => t.id)).toEqual([
    "midnight-purple",
    "cyber-neon",
    "minimal-black",
    "pink-dream",
    "ice-blue",
  ]);
});
it("o editor mantém cartões excedentes após expirar Pro para não apagá-los silenciosamente", () => {
  const source = {
    ...demoProfile,
    gamerCards: Array.from({ length: 5 }, (_, i) => ({
      ...demoProfile.gamerCards[0],
      id: String(i),
    })),
  };
  expect(editableAppearance(source, false, true).gamerCards).toHaveLength(5);
  expect(editableAppearance(source, false).gamerCards).toHaveLength(3);
});
it.each([7, 30])("o gráfico descreve o período real de %i dias", (length) => {
  const html = renderToStaticMarkup(
    <StatsChart
      days={Array.from({ length }, (_, i) => ({
        day: `2026-10-${String(i + 1).padStart(2, "0")}`,
        views: i,
        clicks: 0,
      }))}
    />,
  );
  expect(html).toContain(`últimos ${length} dias`);
  expect(html).not.toContain("NaN");
});
