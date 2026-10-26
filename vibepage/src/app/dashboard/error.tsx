"use client";
export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <section className="workspace-card" role="alert">
      <p className="kicker">PAUSA NO UNIVERSO</p>
      <h2>Não foi possível carregar sua conta.</h2>
      <p>
        Confira a conexão e tente novamente. Se o problema continuar, o serviço
        pode estar temporariamente indisponível.
      </p>
      <button type="button" className="button" onClick={reset}>
        Tentar novamente
      </button>
    </section>
  );
}
