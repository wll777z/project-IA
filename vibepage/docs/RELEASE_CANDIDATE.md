# Candidata oficial proposta — 3.0.0-rc.1

27/10/2026. Branch `release/vibepage-3.0-rc1`, base auditada `7d9758fb112206bcd4fe706c8bef6f9ba612953c`. Proposta para revisão, não publicação. Alterações somente em `vibepage/`.

## Consolidação

A candidata preserva a cadeia Ultimate Release (PR #3, que contém #1/#2) → Next Level (PR #5) → auditoria final (PR #6). O PR #4 repete o CTA já incorporado. `main` não foi alterada. Esta branch contém os commits ancestrais; não é necessário recriar funcionalidades ou reaplicar correções antigas. A integração definitiva depende de revisão humana dos PRs empilhados; nenhum foi mergeado ou encerrado automaticamente.

## Tratamentos de lançamento

| Prioridade | Evidência / comportamento                                                       | Tratamento / pendência                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0         | Não há host backend/PostgreSQL nativo/SMTP real conectado                       | Compose, preflight e runbook preparados; ambiente e aceitação continuam bloqueados                                                                                                            |
| P0         | Não existe ensaio de backup/restauração nativo                                  | Executar em homologação independente, registrar RPO/RTO e responsável; não substituído por PGlite                                                                                             |
| P1         | Auditoria anterior identificou ausência de canal funcional de suporte/denúncias | `/suporte`, API validada/rate limited e fila administrativa implementadas; intake exige dados legais completos e administrador confirmado                                                     |
| P1         | Precisava existir retirada administrativa sem bypass do dono                    | `Profile.suspendedAt`, revisão transacional e eventos; renderer público, imagens, QR/VibeCard e redirects usam resolução pública restrita; salvar perfil não reativa suspensão                |
| P1         | Administração não deve ser concedida por plano ou payload do usuário            | Papel próprio no banco, CLI de bootstrap, confirmação obrigatória e nenhuma API pública de concessão                                                                                          |
| P1         | Responsável/contato público/política etária/retencão não fornecidos             | Variáveis obrigatórias para abrir intake; nenhum dado jurídico inventado; aprovação operacional pendente                                                                                      |
| P1         | Novos registros privados precisam de retenção/exclusão                          | Expiração configurável 7–365 dias, cleanup remove casos/eventos; exclusão da conta remove papel/telefone e desvincula ator/alvo; contato de resposta coincidente com conta excluída é apagado |
| P1         | Aceitação mobile real e operação não aprovadas                                  | Evidência anterior de Chrome desktop preservada; Safari/iOS, Android, leitor de tela e rede móvel pendentes                                                                                   |
| P2         | Avisos de pg nos testes / evolução do lint                                      | Registrar e acompanhar sem alterar dependências ou alegar vulnerabilidade não demonstrada                                                                                                     |

## Dados e segurança

Oitava migration `202610270004_release_operations` é aditiva: papel administrativo, casos/eventos de suporte e suspensão de perfil. Não modifica os sete SQL anteriores. Teste migra sete versões, cria perfil/link legado e aplica a oitava; cobre preservação, índices e cascatas/SET NULL em PGlite. Não executada em banco real.

Casos não são públicos: só há criação anônima limitada e leitura/revisão administrativa autenticada. Não há anexos nem mensagens entre usuários. Respostas pelo contato informado são manuais, pelo operador. O recibo não oferece rastreamento público. Retenção técnica não é uma definição jurídica; políticas finais e rotina de revisão são do responsável. A fila exibe até vinte eventos recentes por caso. Suspensão impede novas respostas públicas, mas não revoga cópias já baixadas.

Telefone administrativo é contato privado sem validação SMS. Não aparece no perfil nem na fila; consta apenas da exportação do próprio titular. Bootstrap não troca senha existente e rejeita conta não confirmada no modo de concessão. Conta nova fica sem acesso administrativo até confirmação. A senha informada no chat não foi persistida nem utilizada; está abaixo do mínimo vigente.

## Evidência desta candidata

`npm run lint`, `npm run typecheck`, `npm test` (198/25 arquivos), `npm run build` e `npm run test:http` (80 verificações) aprovados localmente. Exportação estática temporária também executada, sem deploy. Autenticação e dados usam Prisma/PGlite reais com fixtures isoladas; SMTP é capturado em memória. Resultados adicionais de formatação/auditoria estão em `VALIDATION.md`.

## Decisão

- **GO** somente para revisão do código e testes locais sintéticos.
- **NO-GO beta fechado real** até PostgreSQL/HTTPS/SMTP/backups e jornada completa serem comprovados, responsável e atendimento definidos, testes móveis aceitos e liberação expressa.
- **NO-GO público** até gates anteriores e operação de moderação/monitoramento, escala e políticas aprovadas.
- **NO-GO comercialização Pro**: sem cobrança implementada/autorizada e sem aceitação operacional/comercial.

Não houve deploy, merge, criação de conta real, envio SMTP externo, alteração de credenciais existentes ou contratação. Próximo trabalho: executar o [runbook](STAGING_RUNBOOK.md) em infraestrutura conectada, mantendo estes gates fechados.
