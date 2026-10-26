import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DeleteAccount } from "@/components/account-actions";
export const metadata = { title: "Minha conta" };
export default async function Account() {
  const session = await auth.api.getSession({ headers: await headers() });
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
      <DeleteAccount />
    </>
  );
}
