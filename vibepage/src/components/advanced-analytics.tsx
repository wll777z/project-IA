"use client";
import { useState } from "react";
import type { advancedStats } from "@/lib/analytics-advanced";
import { StatsChart } from "@/components/stats-chart";
export function AdvancedAnalytics({
  initial,
}: {
  initial: Awaited<ReturnType<typeof advancedStats>>;
}) {
  const [data, setData] = useState(initial),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <>
      <div
        className="period-switch"
        role="group"
        aria-label="Comparar períodos"
      >
        {([7, 30] as const).map((period) => (
          <button
            key={period}
            disabled={busy}
            aria-pressed={data.period === period}
            onClick={async () => {
              setBusy(true);
              try {
                const response = await fetch(
                  `/api/stats/advanced?period=${period}`,
                );
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                setData(result);
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Falha na consulta.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {period} dias vs. anteriores
          </button>
        ))}
      </div>
      <div className="stats-grid">
        {Object.entries(data.comparison).map(([key, value]) => (
          <article key={key}>
            <span>
              {key === "views"
                ? "VISUALIZAÇÕES"
                : key === "clicks"
                  ? "CLIQUES EM LINKS"
                  : "CLIQUES EM CARTÕES"}
            </span>
            <strong>{value.current}</strong>
            <small>
              {value.delta >= 0 ? "+" : ""}
              {value.delta} vs. {value.previous} anteriores ·{" "}
              {value.percent === null
                ? "sem base percentual"
                : `${value.percent}%`}
            </small>
          </article>
        ))}
      </div>
      <section className="workspace-card">
        <h2>Resumo semanal</h2>
        <p>
          {data.weekly.views} visualizações, {data.weekly.clicks} cliques em
          links e {data.weekly.cardClicks} em cartões, nos últimos sete dias
          UTC.
        </p>
        <h2>Histórico agregado · 90 dias</h2>
        <StatsChart days={data.days} />
        <details className="stats-data">
          <summary>Dados em tabela</summary>
          <table>
            <thead>
              <tr>
                <th>Dia UTC</th>
                <th>Visitas</th>
                <th>Links</th>
                <th>Cartões</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((d) => (
                <tr key={d.day}>
                  <td>{d.day}</td>
                  <td>{d.views}</td>
                  <td>{d.clicks}</td>
                  <td>{d.cardClicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <a
          className="button button-secondary"
          href={`/api/stats/export?period=${data.period}`}
          download
        >
          Exportar CSV
        </a>
      </section>
      <div className="share-center-grid">
        <section className="workspace-card">
          <h2>Ranking de links · {data.period} dias</h2>
          {data.topLinks.map((l) => (
            <p key={l.id}>
              {l.title}: {l.clicks}
            </p>
          ))}
          {!data.topLinks.length && <p>Nenhum link para comparar ainda.</p>}
        </section>
        <section className="workspace-card">
          <h2>Cartões rastreáveis · {data.period} dias</h2>
          {data.topCards.map((c) => (
            <p key={c.id}>
              {c.title}: {c.clicks}
            </p>
          ))}
          {!data.topCards.length && <p>Adicione um cartão com link público.</p>}
          <small>
            Contagem disponível a partir desta versão, apenas para cliques que
            passam pelo redirecionamento público. A prévia não gera analytics.
          </small>
        </section>
      </div>
      {message && <p role="status">{message}</p>}
    </>
  );
}
