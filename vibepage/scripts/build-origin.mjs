// Bind static SEO assets to the same public origin used by authentication/sharing.
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
function origin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "Origem de build inválida; execute npm run build novamente.",
    );
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (!localHosts.has(url.hostname) && url.protocol !== "https:")
  ) {
    throw new Error(
      "Origem de build inválida; use somente uma origem HTTPS pública ou HTTP local.",
    );
  }
  return url;
}
export function readBuildOrigin({ landing, sitemap, robots }) {
  const canonical = landing.match(/<link rel="canonical" href="([^\"]+)"/);
  const og = landing.match(/<meta property="og:url" content="([^\"]+)"/);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  const robotsURL = robots.match(/^Sitemap:\s*(\S+)\s*$/m);
  if (!canonical || !og || locations.length !== 1 || !robotsURL)
    throw new Error(
      "Metadados de origem incompletos; execute npm run build novamente.",
    );
  const target = origin(canonical[1]);
  if (
    origin(og[1]).origin !== target.origin ||
    origin(locations[0]).origin !== target.origin ||
    new URL(robotsURL[1]).href !== target.origin + "/sitemap.xml"
  )
    throw new Error(
      "Metadados estáticos usam origens diferentes; corrija BETTER_AUTH_URL e reconstrua.",
    );
  return { version: 1, origin: target.origin };
}
export function validateBuildOrigin(runtimeOrigin, manifest) {
  if (manifest?.version !== 1)
    throw new Error(
      "Manifesto de origem ausente/inválido; execute npm run build novamente.",
    );
  const built = origin(manifest.origin),
    runtime = origin(runtimeOrigin);
  if (built.origin === runtime.origin) return;
  // Isolated local tests allocate a random loopback port. Never applies to a public hostname.
  if (localHosts.has(built.hostname) && localHosts.has(runtime.hostname))
    return;
  throw new Error(
    "A origem pública do build difere de BETTER_AUTH_URL. Reconstrua com a origem correta antes de iniciar.",
  );
}
