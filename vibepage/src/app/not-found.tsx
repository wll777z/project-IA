import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <p className="kicker">404 · FORA DO MAPA</p>
      <h1>Esta página não está disponível.</h1>
      <p>
        Confira o endereço. O perfil pode não existir ou não estar disponível ao
        público.
      </p>
      <Link href="/" className="button mt-6">
        Voltar ao início
      </Link>
    </main>
  );
}
