import { Brand } from "@/components/brand";
export const metadata = { title: "Privacidade" };
export default function Privacy() {
  return (
    <main id="main" className="legal-page">
      <Brand />
      <h1>Privacidade, sem mistério.</h1>
      <p>Versão de desenvolvimento · 26 de outubro de 2026</p>
      <h2>O que guardamos</h2>
      <p>
        Seu nome, e-mail e credenciais protegidas são usados para criar e
        autenticar sua conta. Sessões e registros temporários de limitação de
        acesso são usados para segurança. Não vendemos seus dados nem usamos
        publicidade comportamental.
      </p>
      <h2>Estatísticas e arquivos</h2>
      <p>
        Perfis publicados tornam visíveis o nome público, username, bio, links,
        cartões gamer e imagens que você escolheu. Os dados de jogos e
        comunidades dos cartões são informados por você; não consultamos status
        online ou contas externas. Recebemos imagens PNG, JPEG ou WebP,
        normalizamos para WebP e removemos metadados. Visitas e cliques são
        armazenados em totais diários, sem identificação individual, localização
        ou IP na base de estatísticas. Contadores não representam visitantes
        únicos.
      </p>
      <h2>Demonstração</h2>
      <p>
        O editor em /demo salva as escolhas no armazenamento local do navegador.
        Esses dados não criam conta nem são enviados ao banco de perfis. Você
        pode apagá-los limpando os dados do site no navegador.
      </p>
      <h2>Cookies e e-mails</h2>
      <p>
        Usamos cookies essenciais de sessão. Se houver envio de e-mail
        configurado, o serviço receberá seu endereço para entregar mensagens de
        confirmação de conta e recuperação de senha. Não há envio de marketing
        nesta versão.
      </p>
      <h2>Controle e exclusão</h2>
      <p>
        Você pode excluir permanentemente sua conta na área autenticada,
        confirmando sua senha. A exclusão remove perfil, imagens, links, cartões
        gamer, estatísticas, credenciais, sessões e tokens associados no banco
        ativo. Na área da conta você também pode exportar seus dados em JSON.
        Limites de acesso guardam chaves temporárias que podem conter IP e
        endpoint quando há proxy configurado e devem ser removidos regularmente
        pela tarefa de manutenção. Eventuais backups exigirão uma política de
        retenção antes do lançamento.
      </p>
      <h2>Antes do lançamento público</h2>
      <p>
        Este é um ambiente de desenvolvimento. A identidade e o contato do
        controlador, os operadores, o canal para exercer direitos de acesso e
        correção, a política de retenção e os requisitos aplicáveis a menores de
        idade precisam ser definidos antes de receber público real.
      </p>
    </main>
  );
}
