import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DashboardNavigation } from "../src/components/dashboard-nav";
import {
  FirstSteps,
  UnavailableProfile,
} from "../src/components/profile-availability";
import { ShareCenter } from "../src/components/share-center";
import { demoProfile } from "../src/lib/demo-profile";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";
it("navegação preserva oito destinos distintos e marca somente a página correta em cada menu", () => {
  const html = renderToStaticMarkup(
    <DashboardNavigation pathname="/dashboard/analytics" />,
  );
  const menus = [...html.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/g)];
  expect(menus).toHaveLength(2);
  for (const [, menu] of menus) {
    expect([...menu.matchAll(/<a /g)].length).toBe(8);
    const current = [...menu.matchAll(/<a\b[^>]*>/g)]
      .map(([tag]) => tag)
      .filter((tag) => tag.includes('aria-current="page"'));
    expect(current).toHaveLength(1);
    expect(current[0]).toContain('href="/dashboard/analytics"');
    expect(menu).toContain('href="/dashboard/estatisticas"');
    expect(menu).toContain('href="/dashboard/conta"');
    expect(menu).not.toContain("/dashboard/moderacao");
  }
  expect(html).toContain('<details class="dashboard-nav-mobile"><summary>');
  expect(html).toContain("Analytics Pro</strong>");
});
it("admin mantém acesso à fila; rota filha usa destino ativo correto", () => {
  const html = renderToStaticMarkup(
    <DashboardNavigation pathname="/dashboard/moderacao" administrator />,
  );
  expect(
    [...html.matchAll(/<a\b[^>]*>/g)].filter(
      ([tag]) =>
        tag.includes('href="/dashboard/moderacao"') &&
        tag.includes('aria-current="page"'),
    ),
  ).toHaveLength(2);
  const child = renderToStaticMarkup(
    <DashboardNavigation pathname="/dashboard/editor/preview" />,
  );
  expect(
    [...child.matchAll(/<a\b[^>]*>/g)].filter(
      ([tag]) =>
        tag.includes('href="/dashboard/editor"') &&
        tag.includes('aria-current="page"'),
    ),
  ).toHaveLength(2);
});
it("primeiro acesso explica username, link, salvar, publicar e compartilhar sem popup", () => {
  const html = renderToStaticMarkup(
    <FirstSteps hasUsername={false} hasLinks={false} />,
  );
  for (const text of [
    "username",
    "HTTPS",
    "rascunho",
    "Perfil público",
    "Compartilhar",
  ])
    expect(html).toContain(text);
  expect(html).not.toContain('role="dialog"');
});
it("suspensão e rascunho não oferecem URL, download ou QR no compartilhamento", () => {
  const suspended = renderToStaticMarkup(
    <ShareCenter
      profile={{ ...demoProfile, published: true }}
      pro
      url="https://example.test/player"
      unavailable
    />,
  );
  expect(suspended).toContain("indisponível ao público");
  expect(suspended).toContain('<h1 class="availability-title">');
  expect(suspended).toContain("/suporte");
  expect(suspended).not.toContain("/api/qr/");
  expect(suspended).not.toContain("/api/vibecard/");
  expect(suspended).not.toContain("https://example.test/player");
  const draft = renderToStaticMarkup(
    <ShareCenter
      profile={{ ...demoProfile, published: false }}
      pro={false}
      url=""
    />,
  );
  expect(draft).toContain("Publique antes de compartilhar.");
  expect(draft).not.toContain("/api/qr/");
  const notice = renderToStaticMarkup(<UnavailableProfile />);
  expect(notice).not.toContain("internalNote");
});
it("sitemap é curado sem enumerar dados de usuários; robots lista rotas reservadas e URL correspondente", () => {
  const urls = sitemap().map(({ url }) => url);
  expect(urls).toEqual([
    new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").origin +
      "/",
  ]);
  const config = robots();
  expect(config.sitemap).toBe(new URL(urls[0]).origin + "/sitemap.xml");
  const rules = config.rules as { disallow: string[] };
  for (const path of [
    "/dashboard",
    "/api/",
    "/login",
    "/cadastro",
    "/recuperar-senha",
    "/redefinir-senha",
    "/pro/",
  ])
    expect(rules.disallow).toContain(path);
});
