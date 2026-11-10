import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PixPayment } from "../src/components/pix-payment";

it("mostra a chave de telefone e mantém a ativação manual", () => {
  const html = renderToStaticMarkup(
    createElement(PixPayment, { email: "player@example.com" }),
  );
  expect(html).toContain('value="+5511949345361"');
  expect(html).toContain("Wendell Pereira");
  expect(html).toContain("Nubank");
  expect(html).toContain("R$ 9,90");
  expect(html).toContain("não libera o Pro automaticamente");
});

it("endereça o comprovante ao administrador com a conta correta", () => {
  const email = "player+pro@example.com";
  const html = renderToStaticMarkup(createElement(PixPayment, { email }));
  const href = html.match(/href="(mailto:[^"]+)"/)![1].replaceAll("&amp;", "&");
  const url = new URL(href);
  expect(url.pathname).toBe("wendellpereira087@gmail.com");
  expect(url.searchParams.get("body")).toContain(
    `E-mail da minha conta: ${email}`,
  );
  expect(url.searchParams.get("body")).toContain("anexar o comprovante");
});
