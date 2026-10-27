import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStats } from "@/lib/analytics";
import { StatsPeriod } from "@/components/stats-period";
import { Eye, MousePointer2, Link2, LockKeyhole } from "lucide-react";
export const metadata = { title: "Estatísticas" };
export default async function Stats() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const stats = await getStats(session.user.id);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="kicker">A SUA VIBE EM NÚMEROS</p>
          <h1>Conexões que acontecem.</h1>
          <p>Estatísticas agregadas. Sem rastrear quem visita você.</p>
        </div>
        <span className="outline-pill">{stats.pro ? "PRO" : "FREE"}</span>
      </div>
      <div className="stats-grid">
        <article>
          <Eye size={19} />
          <span>VISUALIZAÇÕES TOTAIS</span>
          <strong>{stats.views}</strong>
          <small>Não representam visitantes únicos</small>
        </article>
        <article>
          <Link2 size={19} />
          <span>LINKS ATIVOS</span>
          <strong>{stats.links}</strong>
          <small>Destinos no seu perfil</small>
        </article>
        <article>
          <MousePointer2 size={19} />
          <span>CLIQUES TOTAIS</span>
          <strong>{"totalClicks" in stats ? stats.totalClicks : "Pro"}</strong>
          <small>
            {stats.pro
              ? "Cliques nos links personalizados"
              : "Disponível no plano Pro"}
          </small>
        </article>
      </div>
      {"days" in stats && stats.days ? (
        <>
          <section className="workspace-card">
            <h2>O ritmo do seu universo</h2>
            <StatsPeriod days={stats.days} />
            <details className="stats-data">
              <summary>
                Ver dados em tabela <span>+</span>
              </summary>
              <table>
                <caption>Visitas e cliques por dia, em UTC</caption>
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th>Visitas</th>
                    <th>Cliques</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.days.map((d) => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td>{d.views}</td>
                      <td>{d.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>
          <section className="workspace-card">
            <h2>Para onde a sua vibe leva</h2>
            <p>Cliques nos links atuais, nos últimos 30 dias.</p>
            <table>
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Cliques</th>
                </tr>
              </thead>
              <tbody>
                {stats.topLinks?.map((l) => (
                  <tr key={l.id}>
                    <td>{l.title}</td>
                    <td>{l.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!stats.topLinks?.length && (
              <p>Seu primeiro clique começa com um link.</p>
            )}
          </section>
        </>
      ) : (
        <section className="workspace-card pro-stats">
          <LockKeyhole size={25} />
          <h2>Um olhar mais detalhado.</h2>
          <p>
            O plano Pro inclui evolução diária, cliques e desempenho de cada
            link. A cobrança ainda não foi integrada; não há assinatura
            disponível para compra nesta versão.
          </p>
          <Link href="/dashboard/editor" className="button button-secondary">
            Continuar criando meu perfil
          </Link>
        </section>
      )}
      <p className="analytics-note">
        Cartões gamer abrem links diretamente e não entram nas contagens de
        cliques. Os números são aproximados. Bloqueadores, bots e limites contra
        abuso podem afetar as contagens. Totais diários são armazenados sem IP,
        localização ou identificação dos visitantes.
      </p>
    </>
  );
}
