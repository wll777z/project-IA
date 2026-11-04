import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DeleteAccount } from "@/components/account-actions";
import { BillingButton } from "@/components/billing-actions";
import { db } from "@/lib/db";
import { isPro } from "@/lib/entitlements";
import { billingConfigured, billingEnabled } from "@/lib/billing";
export const metadata = { title: "Minha conta" };
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ pagamento?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { pagamento } = await searchParams;
  const ent = session
    ? await db.entitlement.findUnique({ where: { userId: session.user.id } })
    : null;
  const pro = isPro(ent);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="kicker">VOCÊ NO CONTROLE</p>
          <h1>Minha conta.</h1>
          <p>Informações essenciais, sem complicação.</p>
        </div>
      </div>
      <section className="workspace-card">
        <h2>Dados da conta</h2>
        <p>Nome: {session?.user.name}</p>
        <p>E-mail: {session?.user.email}</p>
        <Link href="/recuperar-senha" className="text-button">
          Redefinir minha senha →
        </Link>
        <p>
          <a
            download="vibepage-meus-dados.json"
            href="/api/account/export"
            className="text-button"
          >
            Baixar meus dados em JSON ↓
          </a>
        </p>
      </section>
      <section className="workspace-card">
        <h2>Plano e pagamento</h2>
        {pagamento === "sucesso" && (
          <p role="status" className="status-message">
            Checkout concluído. O Pro só será ativado depois que o Stripe
            confirmar a assinatura; atualize esta página em alguns instantes.
          </p>
        )}
        {pagamento === "cancelado" && (
          <p role="status" className="status-message">
            Pagamento cancelado. Nada foi cobrado.
          </p>
        )}
        <p>
          Plano atual: <strong>{pro ? "Pro" : "Free"}</strong>
          {pro && ent?.expiresAt
            ? ` · renova até ${new Date(ent.expiresAt).toLocaleDateString("pt-BR")}`
            : ""}
        </p>
        {!billingEnabled ? (
          <p>
            As compras Pro estão desativadas neste ambiente; nenhuma cobrança
            será feita.
          </p>
        ) : !billingConfigured ? (
          <p>O pagamento ainda não foi configurado pelo administrador.</p>
        ) : ent?.stripeSubscriptionId ? (
          <BillingButton
            action="portal"
            label="Gerenciar assinatura e cartão"
            className="button button-secondary"
          />
        ) : (
          <BillingButton action="checkout" label="Assinar Pro · R$ 9,90/mês" />
        )}
      </section>
      <DeleteAccount />
    </>
  );
}
