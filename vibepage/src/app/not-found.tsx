import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <p className="kicker">404 · FORA DO MAPA</p>
      <h1>Essa vibe ainda não existe.</h1>
      <p>Este perfil não existe, foi removido ou ainda está em rascunho.</p>
      <Link href="/" className="button mt-6">
        Voltar ao início
      </Link>
    </main>
  );
}
