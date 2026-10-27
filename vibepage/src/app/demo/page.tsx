import { demoProfile } from "@/lib/demo-profile";
import { Brand } from "@/components/brand";
import { ProfileEditor } from "@/components/profile-editor";
export const metadata = {
  title: "Experimente sua vibe",
  robots: { index: false, follow: false },
};
export default function Demo() {
  return (
    <>
      <header className="app-header">
        <Brand />
        <span className="outline-pill">DEMONSTRAÇÃO INTERATIVA</span>
      </header>
      <main id="main" className="demo-workspace">
        <div className="demo-notice">
          <strong>Experimente o editor.</strong> Altere seu nome, organize os
          links, crie cartões gamer e teste temas e efeitos. As alterações ficam
          somente neste navegador. Esta demonstração não cria conta, perfil
          público ou assinatura Pro.
        </div>
        <div className="page-heading">
          <div>
            <p className="kicker">UMA VIBE PARA CHAMAR DE SUA</p>
            <h1>Crie seu próximo universo.</h1>
            <p>Mexa nos detalhes. Veja tudo acontecer.</p>
          </div>
        </div>
        <ProfileEditor initial={demoProfile} pro demo />
      </main>
    </>
  );
}
