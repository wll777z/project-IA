export default function Loading() {
  return (
    <section
      className="workspace-card"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="kicker">VIBEPAGE</p>
      <h2>Carregando seu espaço…</h2>
      <div className="dashboard-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
