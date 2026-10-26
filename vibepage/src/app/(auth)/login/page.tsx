import { AuthForm } from "@/components/auth-form";
export const metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <p className="kicker">BEM-VINDO AO VIBEPAGE</p>
      <h1>Sua vibe te espera.</h1>
      <p>Entre na sua conta para continuar.</p>
      <AuthForm mode="login" />
    </>
  );
}
