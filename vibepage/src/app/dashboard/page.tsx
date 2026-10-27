import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOwnedProfile, emptyProfile } from "@/lib/profiles";
import { isPro } from "@/lib/entitlements";
import { ProfileView } from "@/components/profile-view";
import { ShareLink } from "@/components/share-link";
import { ArrowUpRight, Palette, Eye, Link2, Sparkles } from "lucide-react";
export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const [profile, entitlement, views] = await Promise.all([
    getOwnedProfile(session.user.id),
    db.entitlement.findUnique({ where: { userId: session.user.id } }),
    db.pageView.aggregate({
      where: { profile: { userId: session.user.id } },
      _sum: { count: true },
    }),
  ]);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="kicker">BEM-VINDO AO SEU ESPAÇO</p>
          <h1>
            E aí, {session.user.name} <span className="heading-spark">✦</span>
          </h1>
          <p>Uma visão do seu universo, em tempo real.</p>
        </div>
        <Link className="button" href="/dashboard/editor">
          <Palette size={16} />
          Editar meu perfil
        </Link>
      </div>
      <div className="stats-grid">
        <article>
          <Eye size={19} />
          <span>VISUALIZAÇÕES</span>
          <strong>{views._sum.count ?? 0}</strong>
          <small>Visitas totais, não visitantes únicos</small>
        </article>
        <article>
          <Link2 size={19} />
          <span>LINKS NO PERFIL</span>
          <strong>{profile?.links.length ?? 0}</strong>
          <small>Conexões com o seu universo</small>
        </article>
        <article>
          <Sparkles size={19} />
          <span>SEU PLANO</span>
          <strong>{isPro(entitlement) ? "Pro" : "Free"}</strong>
          <small>Sem cobrança nesta versão</small>
        </article>
      </div>
      <div className="dashboard-loadout">
        <span>SEU LOADOUT</span>
        <strong>{profile?.gamerCards.length ?? 0} cartões gamer</strong>
        <Link href="/dashboard/editor">Personalizar cartões e efeitos ↗</Link>
      </div>
      <div className="dashboard-grid">
        <section>
          <div className="workspace-card">
            <div className="card-title">
              <h2>
                {profile
                  ? "Seu perfil está ganhando vida."
                  : "Seu universo começa com um link."}
              </h2>
              <span className="outline-pill">
                {profile?.published ? "PUBLICADO" : "RASCUNHO"}
              </span>
            </div>
            <p>
              {profile?.published
                ? "Compartilhe sua página com suas comunidades."
                : "Adicione seus links, escolha uma atmosfera e publique quando estiver pronto."}
            </p>
            {profile ? (
              <ShareLink username={profile.username} />
            ) : (
              <Link
                className="button button-secondary"
                href="/dashboard/editor"
              >
                Criar meu perfil <ArrowUpRight size={17} />
              </Link>
            )}
            {profile?.published && (
              <Link
                className="text-button mt-5"
                href={`/${profile.username}`}
                target="_blank"
              >
                Ver minha página ↗
              </Link>
            )}
          </div>
          <div className="workspace-card">
            <h2>Seus destinos</h2>
            {profile?.links.length ? (
              <ul className="dashboard-links">
                {profile.links.slice(0, 6).map((l) => (
                  <li key={l.id}>
                    <Link2 size={16} />
                    <span>{l.title}</span>
                    <ArrowUpRight size={14} />
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                Seus links vão aparecer aqui. Comece pelo seu canal ou sua
                comunidade favorita.
              </p>
            )}
            <Link href="/dashboard/editor" className="text-button mt-5">
              Gerenciar meus links →
            </Link>
          </div>
        </section>
        <aside className="dashboard-preview">
          <div className="preview-heading">
            <span>SUA VIBEPAGE</span>
            <span className="online" />
          </div>
          <ProfileView
            profile={profile ?? emptyProfile(session.user.name)}
            preview
            pro={isPro(entitlement)}
          />
        </aside>
      </div>
    </>
  );
}
