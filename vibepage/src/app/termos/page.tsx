import { LegalDetails } from "@/components/legal-details";
import { supportConfig } from "@/lib/support-config";
export const dynamic = "force-dynamic";
import { Brand } from "@/components/brand";
export const metadata = { title: "Termos de uso" };
export default function Terms() {
  return (
    <main id="main" className="legal-page">
      <Brand />
      <h1>Seu espaço, com respeito.</h1>
      <p>
        {supportConfig()
          ? "Informações operacionais configuradas pelo responsável"
          : "Versão de desenvolvimento · informações legais pendentes"}
      </p>
      <h2>Disponibilidade</h2>
      <p>
        O VibePage oferece criação de conta, editor, páginas públicas e
        estatísticas agregadas quando conectado ao banco. Os perfis da landing e
        o editor em /demo são demonstrações. A demonstração salva dados apenas
        no seu navegador, sem publicar uma página.
      </p>
      <h2>Uso responsável</h2>
      <p>
        Não utilize o serviço para fraude, assédio, conteúdo ilegal, violação de
        direitos, distribuição de malware ou tentativa de acesso a contas de
        outras pessoas. Proteja sua senha e forneça apenas informações que você
        tem direito de utilizar.
      </p>
      <h2>Identidades de jogos e comunidades</h2>
      <p>
        Cartões são autodeclarados. Não representam verificação, vínculo oficial
        com jogos ou plataformas, status online ou estatísticas de jogo. Use
        imagens e informações que você tem direito de publicar e evite dados
        privados de outras pessoas.
      </p>
      <h2>Planos</h2>
      <p>
        Não existe cobrança nesta etapa. R$ 9,90/mês é uma sugestão inicial para
        o futuro plano Pro, não uma oferta de assinatura ativa. Recursos e
        condições comerciais serão informados antes de qualquer contratação.
      </p>
      <h2>Conta e dados</h2>
      <p>
        Você pode excluir sua conta na área autenticada. Consulte a Política de
        Privacidade para entender como seus dados são utilizados. As condições
        legais e os canais de suporte deverão ser finalizados antes do
        lançamento público.
      </p>
      <LegalDetails />
    </main>
  );
}
