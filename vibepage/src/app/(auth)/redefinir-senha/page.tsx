import Link from "next/link";
import { ResetForm } from "@/components/reset-form";
export const metadata = {
  title: "Nova senha",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  return (
    <>
      <h1>Uma nova senha.</h1>
      {token && !error ? (
        <ResetForm token={token} />
      ) : (
        <p>Link inválido ou expirado. Solicite um novo link de recuperação.</p>
      )}
      <div className="auth-links">
        <Link href="/login">Voltar para entrar</Link>
        <Link href="/recuperar-senha">Solicitar outro link</Link>
      </div>
    </>
  );
}
