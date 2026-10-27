import Link from "next/link";
import { Brand } from "@/components/brand";
import { SupportForm } from "@/components/support-form";
import { LegalDetails } from "@/components/legal-details";
import { supportConfig } from "@/lib/support-config";
import { usernameSchema } from "@/lib/validation";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Suporte e denúncias",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string }>;
}) {
  const config = supportConfig();
  const ready =
    config &&
    (await db.administrator.count({
      where: { user: { emailVerified: true } },
    }));
  const value = usernameSchema.safeParse((await searchParams).perfil ?? "");
  return (
    <main id="main" className="legal-page">
      <Brand />
      <h1>Suporte e denúncias.</h1>
      <p>
        Use este canal para problemas de conta, privacidade ou denúncias de
        perfis. As mensagens são privadas e acessíveis somente à equipe
        autorizada.
      </p>
      {ready ? (
        <>
          <LegalDetails />
          <SupportForm
            username={value.success ? value.data : ""}
            version={config.version}
          />
        </>
      ) : (
        <section className="workspace-card">
          <h2>Canal ainda indisponível.</h2>
          <p>
            O responsável precisa configurar as informações legais e uma conta
            administrativa confirmada antes de receber solicitações. Nenhuma
            mensagem será recebida enquanto esta etapa estiver pendente.
          </p>
        </section>
      )}
      <p>
        <Link href="/privacidade">Privacidade</Link> ·{" "}
        <Link href="/termos">Termos</Link>
      </p>
    </main>
  );
}
