export const dynamic = "force-dynamic";
import Link from "next/link";
import { mailConfigured } from "@/lib/mail";
import { ResetForm } from "@/components/reset-form";
export const metadata = {
  title: "Recuperar senha",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <p className="kicker">VOLTE PARA A SUA VIBE</p>
      <h1>Esqueceu sua senha?</h1>
      {mailConfigured ? (
        <>
          <p>Enviaremos um link para você escolher uma nova senha.</p>
          <ResetForm />
        </>
      ) : (
        <p className="status-message">
          A recuperação de senha ainda não está disponível neste ambiente. O
          envio de e-mail precisa ser configurado pelo administrador.
        </p>
      )}
      <div className="auth-links">
        <Link href="/login">← Voltar para entrar</Link>
      </div>
    </>
  );
}
