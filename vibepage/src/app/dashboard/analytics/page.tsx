import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPro } from "@/lib/entitlements";
import { advancedStats } from "@/lib/analytics-advanced";
import { AdvancedAnalytics } from "@/components/advanced-analytics";
export const metadata = { title: "Analytics Pro 3.0" };
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const pro = isPro(
    await db.entitlement.findUnique({ where: { userId: session.user.id } }),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="kicker">ANALYTICS PRO 3.0</p>
          <h1>Entenda suas conexões.</h1>
          <p>
            Comparações e tendências com agregados reais, sem rastrear pessoas.
          </p>
        </div>
      </div>
      {pro ? (
        <AdvancedAnalytics initial={await advancedStats(session.user.id)} />
      ) : (
        <section className="workspace-card">
          <h2>Seu resumo Free continua disponível.</h2>
          <p>Comparação, histórico de 90 dias e CSV fazem parte do Pro.</p>
          <Link
            className="button button-secondary"
            href="/dashboard/estatisticas"
          >
            Abrir estatísticas básicas
          </Link>
          <Link className="text-button" href="/demo/pro">
            Conhecer o Pro →
          </Link>
        </section>
      )}
    </>
  );
}
