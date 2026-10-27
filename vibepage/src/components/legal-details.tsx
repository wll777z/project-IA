import { supportConfig } from "@/lib/support-config";
export function LegalDetails() {
  const config = supportConfig();
  if (!config)
    return (
      <p>
        As informações do responsável, de retenção e do público etário ainda
        precisam ser aprovadas antes de abrir o serviço a usuários reais.
      </p>
    );
  return (
    <section>
      <h2>Informações do responsável</h2>
      <p>
        {config.controller} · versão {config.version}
      </p>
      <p>
        Contato de privacidade:{" "}
        <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>
      </p>
      <h2>Público etário</h2>
      <p>{config.ageNotice}</p>
      <h2>Retenção</h2>
      <p>{config.retentionNotice}</p>
      <p>
        Solicitações deste canal expiram em {config.retentionDays} dias e são
        removidas pela próxima execução da limpeza, prevista diariamente, com
        acesso restrito à equipe enquanto armazenadas. O responsável deve
        definir também a retenção dos backups.
      </p>
    </section>
  );
}
