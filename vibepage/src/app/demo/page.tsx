import { Brand } from "@/components/brand";
import { ProfileEditor } from "@/components/profile-editor";
import type { ProfileInput } from "@/lib/validation";
export const metadata = {
  title: "Experimente sua vibe",
  robots: { index: false, follow: false },
};
const initial: ProfileInput = {
  username: "wendell",
  displayName: "wendell",
  bio: "Entre um game e uma ideia nova.\nEsse é o meu universo. 🪐",
  themeId: "midnight-purple",
  accentColor: "#a78bfa",
  backgroundColor: "#100c1b",
  buttonStyle: "soft",
  animation: "none",
  hideBranding: false,
  published: false,
  avatarKey: null,
  backgroundKey: null,
  revision: 0,
  links: [
    {
      id: "8e6ca6f0-88f9-45d4-8f4c-812e98d14501",
      title: "Meu canal",
      url: "https://www.youtube.com/",
    },
    {
      id: "8e6ca6f0-88f9-45d4-8f4c-812e98d14502",
      title: "Minha comunidade",
      url: "https://discord.com/",
    },
  ],
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
          links e teste todos os temas. As alterações ficam somente neste
          navegador. Esta demonstração não cria conta, perfil público ou
          assinatura Pro.
        </div>
        <div className="page-heading">
          <div>
            <p className="kicker">UMA VIBE PARA CHAMAR DE SUA</p>
            <h1>Crie seu próximo universo.</h1>
            <p>Mexa nos detalhes. Veja tudo acontecer.</p>
          </div>
        </div>
        <ProfileEditor initial={initial} pro demo />
      </main>
    </>
  );
}
