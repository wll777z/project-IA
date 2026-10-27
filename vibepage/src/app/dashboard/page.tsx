import { canonicalProfileURL } from "@/lib/sharing";
import { getOwnedAvailability } from "@/lib/profile-availability";
import {
  availabilityLabels,
  UnavailableProfile,
  FirstSteps,
} from "@/components/profile-availability";
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
  const [profile, entitlement, views, availability] = await Promise.all([
    getOwnedProfile(session.user.id),
    db.entitlement.findUnique({ where: { userId: session.user.id } }),
    db.pageView.aggregate({
      where: { profile: { userId: session.user.id } },
      _sum: { count: true },
    }),
    getOwnedAvailability(session.user.id),
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
          <small>
            {entitlement?.plan === "PRO" && !isPro(entitlement)
              ? "Pro expirado; seus dados privados foram preservados."
              : "Pro ainda não disponível para compra"}
          </small>
        </article>
      </div>
      {availability === "unavailable" ? (
        <UnavailableProfile />
      ) : availability !== "published" || !profile?.links.length ? (
        <FirstSteps
          hasUsername={!!profile?.username}
          hasLinks={!!profile?.links.length}
        />
      ) : null}
      <div className="dashboard-loadout">
        <span>SEU LOADOUT</span>
        <strong>{profile?.gamerCards.length ?? 0} cartões gamer</strong>
        <Link href="/dashboard/editor">Personalizar cartões e efeitos ↗</Link>
      </div>
      <div className="next-quick-links">
        {[
          ["/dashboard/editor", "Profile Studio", "Layouts e blocos"],
          ["/dashboard/aparencias", "Coleções", "Aparências e temporadas"],
          ["/dashboard/compartilhar", "VibeCard", "QR e compartilhamento"],
          ["/dashboard/analytics", "Analytics Pro", "Comparação e CSV"],
        ].map(([href, title, copy]) => (
          <Link key={href} href={href}>
            <strong>{title}</strong>
            <span>{copy}</span>
            <ArrowUpRight size={16} />
          </Link>
        ))}
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
                {availabilityLabels[availability]}
              </span>
            </div>
            <p>
              {availability === "published"
                ? "Compartilhe sua página com suas comunidades."
                : availability === "unavailable"
                  ? "Sua prévia continua privada. Consulte a orientação de disponibilidade acima."
                  : "Salve seu rascunho no editor. A página só fica visível após marcar Perfil público e salvar."}
            </p>
            {profile && availability === "published" ? (
              <ShareLink
                username={profile.username}
                url={canonicalProfileURL(profile.username)}
              />
            ) : (
              <Link
                className="button button-secondary"
                href="/dashboard/editor"
              >
                {profile ? "Continuar editando" : "Criar meu perfil"}{" "}
                <ArrowUpRight size={17} />
              </Link>
            )}
            {profile && availability === "published" && (
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
