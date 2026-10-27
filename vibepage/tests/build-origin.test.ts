import { expect, it } from "vitest";
import {
  readBuildOrigin,
  validateBuildOrigin,
} from "../scripts/build-origin.mjs";
const publicOrigin = "https://freeze-origin.example.test";
const metadata = (url = publicOrigin) => ({
  landing: `<link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/>`,
  sitemap: `<urlset><url><loc>${url}/</loc></url></urlset>`,
  robots: `User-Agent: *\nSitemap: ${url}/sitemap.xml\n`,
});
it("lê a origem realmente renderizada e aceita execução com a mesma origem", () => {
  const manifest = readBuildOrigin(metadata());
  expect(manifest).toEqual({ version: 1, origin: publicOrigin });
  expect(() => validateBuildOrigin(publicOrigin, manifest)).not.toThrow();
});
it("recusa build localhost para runtime público e origens públicas divergentes", () => {
  expect(() =>
    validateBuildOrigin(
      publicOrigin,
      readBuildOrigin(metadata("http://localhost:3000")),
    ),
  ).toThrow("Reconstrua");
  expect(() =>
    validateBuildOrigin(
      "https://outro.example.test",
      readBuildOrigin(metadata()),
    ),
  ).toThrow("Reconstrua");
});
it("permite portas efêmeras somente entre origens loopback locais", () => {
  expect(() =>
    validateBuildOrigin(
      "http://127.0.0.1:49152",
      readBuildOrigin(metadata("http://localhost:3000")),
    ),
  ).not.toThrow();
  expect(() =>
    validateBuildOrigin("http://127.0.0.1:49152", readBuildOrigin(metadata())),
  ).toThrow("Reconstrua");
});
it("recusa manifesto ausente, incompleto ou metadados inconsistentes", () => {
  expect(() => validateBuildOrigin(publicOrigin, {})).toThrow("Manifesto");
  expect(() => readBuildOrigin({ ...metadata(), landing: "" })).toThrow(
    "incompletos",
  );
  expect(() =>
    readBuildOrigin({
      ...metadata(),
      sitemap: "<loc>https://outro.example.test/</loc>",
    }),
  ).toThrow("diferentes");
  expect(() =>
    readBuildOrigin({
      ...metadata(),
      robots: "Sitemap: https://outro.example.test/sitemap.xml",
    }),
  ).toThrow("diferentes");
});
it("recusa origens inseguras ou valores com credenciais sem imprimi-los", () => {
  for (const value of [
    "http://public.example.test",
    "https://fixture:secret@example.test",
    "https://example.test/path",
    "javascript:alert(1)",
  ]) {
    expect(() => readBuildOrigin(metadata(value))).toThrow("Origem");
  }
});
