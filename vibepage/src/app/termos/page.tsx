import { Brand } from "@/components/brand";
export const metadata = { title: "Termos de uso" };
export default function Terms() {
  return (
    <main id="main" className="legal-page">
      <Brand />
      <h1>Seu espaço, com respeito.</h1>
      <p>Versão de desenvolvimento · 26 de outubro de 2026</p>
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
      <h2>Planos</h2>
      <p>
        O plano Free é gratuito. O Pro custa R$ 9,90 por um mês de acesso, pago
        por Pix manual, sem débito ou renovação automática. A ativação ocorre
        após conferência do recebimento por Wendell Pereira. Envie o comprovante
        e o e-mail da conta para wendellpereira087@gmail.com. Para dúvidas,
        cancelamentos ou reembolsos, utilize esse mesmo contato; os direitos
        previstos em lei são preservados.
      </p>
      <h2>Conta e dados</h2>
      <p>
        Você pode excluir sua conta na área autenticada. Consulte a Política de
        Privacidade para entender como seus dados são utilizados. As condições
        legais e os canais de suporte deverão ser finalizados antes do
        lançamento público.
      </p>
    </main>
  );
}
