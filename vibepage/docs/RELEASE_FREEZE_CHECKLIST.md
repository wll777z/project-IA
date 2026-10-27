# Homologação e liberação — freeze 3.0

Data: 27/10/2026. Este checklist exige evidências do ambiente real; uma marcação local não autoriza beta. Responsável, domínio e infraestrutura ainda precisam ser definidos pelo operador. Procedimentos detalhados em [STAGING_RUNBOOK](STAGING_RUNBOOK.md).

| Gate               | Aceitação necessária                                                                                                                                              | Estado nesta entrega                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Consolidação       | Revisar cadeia #3 → #5 → #6 → #7 → #9 → PR do freeze, preservando commits; conferir exceções #4 e #8                                                              | Histórico local/API conferido; nenhum merge                                               |
| Node/build         | Node LTS compatível, imagem/commit identificável e origem HTTPS exata no build e runtime; launcher aprovado, sem executar server.js diretamente                   | Código e contrato locais testados; host real pendente                                     |
| PostgreSQL nativo  | Banco vazio e upgrade com oito migrations; perfis, links, mídia, FK, índices, concorrência, downgrade Pro e exclusão em cascata comprovados                       | **Pendente**; PGlite não aprova PostgreSQL nativo                                         |
| HTTPS/origem       | DNS e certificado válidos; canonical, sitemap, OG, links, QR e VibeCard do domínio final; sem URLs locais                                                         | Contrato HTTPS sintético testado por HTTP loopback; TLS/DNS reais **pendentes**           |
| SMTP               | Entrega efetiva de confirmação e recuperação; expiração/reuso de tokens, reenviar confirmação, revogação de sessões; SPF/DKIM/DMARC conforme provedor             | **Pendente**; testes interceptados não aprovam entrega                                    |
| Jornadas reais     | Cadastro, confirmação, login/logout, edição/salvamento, publicar/despublicar/republicar, compartilhar e excluir em contas sintéticas autorizadas no domínio final | HTTP local aprovado; homologação remota **pendente**                                      |
| Proxy/limites      | Cabeçalho de IP sobrescrito, origem inacessível diretamente, cookies Secure, origem/CSRF, limites por cliente e concorrência entre processos                      | **Pendente**; configuração preparada, não executada                                       |
| Persistência       | Reinício/atualização preserva perfis, sessões e arquivos; permissões e segredos fora do Git                                                                       | **Pendente**                                                                              |
| Backup/restauração | Backup nativo criptografado fora do host, retenção, acesso e responsável; restaurar em banco separado, medir RPO/RTO e conferir dados                             | **Pendente**; não executar restore sobre dados reais                                      |
| Monitoramento      | Alertas de indisponibilidade, erro, banco, espaço e falha de backup/cleanup; logs sem senhas, tokens ou conteúdo privado                                          | **Pendente**                                                                              |
| Limpeza/retenção   | Agendamento diário validado; casos/eventos expirados, sessões e limites removidos; políticas de backup compatíveis                                                | Cleanup local testado; rotina e alerta reais **pendentes**                                |
| Suporte/moderação  | Administrador confirmado, intake habilitado somente com responsável/dados legais completos; denúncia → revisão → retirada/restauração; escala e prazos definidos  | Código testado em fixtures; operador/atendimento real **pendentes**                       |
| Políticas          | Controlador, contato público autorizado, idade/menores, retenção/backups, termos/privacidade e revisão aplicável                                                  | **Pendentes**; nenhum dado jurídico inventado                                             |
| Dispositivos       | iOS/Safari e Android/Chrome físicos; 360/390/768/1440, teclado/leitor de tela, movimento reduzido, uploads, downloads, QR e Web Share                             | Evidência anterior Chrome desktop; aparelhos e leitor reais **pendentes**                 |
| Recuperação        | Imagem anterior identificada, manutenção/rollback ensaiado, responsável e comunicação de incidente                                                                | **Pendente**; versão anterior à suspensão não é rollback seguro sem manter acesso fechado |
| Pix/vendas         | PR #8 não incorporado; não expor chave nem aceitar pagamentos; nenhuma ativação Pro por payload de usuário                                                        | Candidata sem rota Pix/checkout; ensaio com chave sintética configurada                   |
| Beta               | Todos os gates anteriores aceitos, lista de convidados/acesso restrito e autorização expressa                                                                     | **NO-GO**                                                                                 |
| Público            | Gates do beta mais aceitação de escala/operação/moderação e autorização expressa                                                                                  | **NO-GO**                                                                                 |

## Registro de aceite a preencher

- Responsável pela homologação: pendente.
- Ambiente e domínio: pendentes.
- Commit/imagem efetivamente implantados: pendentes.
- Janela dos ensaios e links de evidências sanitizadas: pendentes.
- RPO/RTO, retenção e plano de recuperação aprovados: pendentes.
- Aprovação do beta / aprovação pública (separadas): pendentes.

Nenhum desses campos deve ser preenchido com contatos privados por inferência. Não houve contratação, implantação, envio SMTP externo, alteração de credenciais ou dados reais nesta entrega. Pro comercial continua desabilitado e fora do escopo.
