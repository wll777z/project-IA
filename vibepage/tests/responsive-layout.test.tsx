import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import Home from "../src/app/page";
import { readFileSync } from "node:fs";

it("landing keeps section navigation reachable on mobile and desktop", () => {
  const html = renderToStaticMarkup(<Home />);
  expect(html).toContain('<nav class="desktop-nav" aria-label="Principal">');
  expect(html).toContain(
    '<nav class="mobile-nav" aria-label="Navegação da página">',
  );
  for (const target of ["como-funciona", "cartoes", "temas", "planos"]) {
    expect(html).toContain(`href="#${target}"`);
  }
  expect(html).toContain('href="/login"');
  expect(html).toContain('href="/cadastro"');
});

it("responsive styles stack the hero, keep touch targets usable, and preserve reduced motion", () => {
  const css = readFileSync(
    new URL("../src/app/globals.css", import.meta.url),
    "utf8",
  );
  expect(css).toContain(".mobile-nav");
  expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*?\.mobile-nav/);
  expect(css).toMatch(
    /@media \(max-width: 760px\)[\s\S]*?grid-template-columns: 1fr/,
  );
  expect(css).toMatch(/prefers-reduced-motion: reduce/);
  expect(css).toMatch(/min-height: 48px/);
});
