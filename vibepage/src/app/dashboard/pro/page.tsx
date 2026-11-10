import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPro } from "@/lib/entitlements";
import { PixPayment } from "@/components/pix-payment";
export const metadata = { title: "Pro com Pix" };
export default async function Pro() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const entitlement = await db.entitlement.findUnique({
    where: { userId: session.user.id },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="kicker">SUA VIBE, OUTRO NÍVEL</p>
          <h1>Pro com Pix.</h1>
        </div>
      </div>
      {isPro(entitlement) ? (
        <section className="workspace-card">
          <h2>Seu Pro está ativo</h2>
          <p>
            Você já tem acesso aos recursos Pro.
            {entitlement?.expiresAt
              ? ` Válido até ${entitlement.expiresAt.toLocaleDateString("pt-BR", { timeZone: "UTC" })}.`
              : ""}
          </p>
          <p>
            Para renovar ou consultar seu acesso, fale com
            wendellpereira087@gmail.com antes de fazer outro pagamento.
          </p>
        </section>
      ) : (
        <PixPayment email={session.user.email} />
      )}
    </>
  );
}
