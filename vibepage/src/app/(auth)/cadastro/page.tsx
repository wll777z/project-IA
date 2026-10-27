import { AuthForm } from "@/components/auth-form";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Criar conta",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <p className="kicker">BEM-VINDO AO VIBEPAGE</p>
      <h1>Seu universo começa aqui.</h1>
      <p>Crie sua conta grátis. Sem cartão, sem complicação.</p>
      <AuthForm
        mode="register"
        emailVerificationRequired={
          process.env.REQUIRE_EMAIL_VERIFICATION === "true"
        }
      />
    </>
  );
}
