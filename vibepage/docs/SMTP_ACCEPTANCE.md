# SMTP e contas — aceite externo a executar

Sem envio externo nesta entrega. Os testes em memória aprovam a integração com Better Auth, não entrega, DNS, reputação ou spam. Não informar segredos em issue, PR, chat ou Git. Usar remetente/domínio autorizado e somente caixas de teste cujo uso foi autorizado.

## Preparar

1. No arquivo privado `.env.staging` do host: `SMTP_HOST`, `SMTP_PORT` (465 TLS implícito; 587 STARTTLS), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. Manter `REQUIRE_EMAIL_VERIFICATION=true`, `BETTER_AUTH_URL` HTTPS real e chave exclusiva. Nunca configurar `rejectUnauthorized=false`.
2. Publicar SPF/DKIM conforme os valores exatos fornecidos pelo provedor. SPF deve autorizar os emissores reais; não criar vários registros SPF no mesmo nome. Habilitar assinatura DKIM e confirmar alinhamento com From. DMARC exige responsável, relatórios e política aprovados; não inventar destino ou começar rejeitando tráfego legítimo sem inventário.
3. Executar `npm run staging:check -- /caminho/privado/staging.env`. Esse preflight só verifica estrutura. Subir homologação protegida conforme STAGING_RUNBOOK, sob autorização do operador.
4. Registrar data, commit, provedor, versão/configuração sem segredos, caixa autorizada, responsável e prazo objetivo de entrega. Guardar evidência sanitizada; excluir tokens, cookies e URLs de verificação/reset de capturas e logs.

## Jornada real e critérios

| Ensaio                       | Procedimento                                                                            | Aceite                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmação                  | Cadastrar uma conta sintética pela UI, aguardar mensagem externa                        | Mensagem recebida na caixa; registrar inbox/spam e latência; cabeçalhos Authentication-Results mostram SPF/DKIM/DMARC/alinhamento esperado                  |
| Login bloqueado              | Antes de confirmar, tentar entrar com senha correta                                     | Conta não abre dashboard; reenvio não enumera endereço e obedece limites                                                                                    |
| Confirmação válida           | Abrir o link recebido no domínio real                                                   | Confirma conta; não cria sessão automaticamente; login posterior abre dashboard                                                                             |
| Token inválido/expirado      | Usar token adulterado e outro realmente expirado                                        | Não confirma conta pendente nem cria sessão; informar indisponibilidade compreensível                                                                       |
| Link de confirmação repetido | Reabrir link válido após confirmar                                                      | Não cria nova sessão, não troca identidade nem altera outras contas; observar se resposta é idempotente ou recusada, sem exigir falsamente uso único de JWT |
| Recuperação                  | Solicitar reset para conta conhecida e endereço inexistente                             | Respostas equivalentes sem enumeração; somente a caixa autorizada recebe mensagem real; verificar inbox/spam e domínio do link                              |
| Reset válido                 | Manter sessão em outra aba e trocar senha pelo link recebido                            | Nova senha funciona; antiga não funciona; sessão anterior revogada                                                                                          |
| Reset reutilizado/expirado   | Reabrir token já consumido ou expirado                                                  | Não altera senha novamente; nenhuma sessão indevida criada                                                                                                  |
| Falha de provedor            | Em ambiente isolado autorizado, usar configuração inválida e restaurá-la depois         | Erro genérico ao cliente; evento `SMTP_DELIVERY_FAILED` sanitizado; timeouts limitados; alerta recebido pelo operador                                       |
| Abuso                        | Somente com fixtures locais/autorizadas, exceder limite de login/cadastro/reenvio/reset | 429 e recuperação após janela; nenhum envio massivo externo                                                                                                 |

Verificação Better Auth da versão instalada usa JWT com expiração padrão de 3600 segundos, sem auto-login. Repetir verificação já concluída pode ser idempotente; não é equivalente a reutilizar reset de senha. Não reduzir expiração em produção para testar nem registrar tokens em evidências. Confirmar comportamento da versão exata instalada no host. A política de senha/reset e a revogação permanecem as já implementadas.

## Registro pendente

- [ ] Entrega em inbox e spam analisada, SPF/DKIM/DMARC verificados pelo operador.
- [ ] Confirmação/reenvio/login/reset/expiração/reutilização/revogação aceitos em HTTPS real.
- [ ] Falha e recuperação, rate limit e alerta comprovados sem dados reais ou abuso externo.
- [ ] Responsável de operação e procedimento de troca privada de credenciais definidos.

Até esses itens terem evidência real: gate SMTP **pendente**, beta real **NO-GO**.
