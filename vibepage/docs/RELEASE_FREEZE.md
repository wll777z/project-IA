# VibePage 3.0 — revisão de freeze

27/10/2026. Repositório `wll777z/project-IA`, somente `vibepage/`. Base consultada no GitHub: `fix/vibepage-final-polish` em `22ab34d753694a4568f6ae38f2933878eaa313d0`. Branch desta revisão: `release/vibepage-3.0-freeze`. Nenhum merge ou deploy.

## Decisões

| Destino                                   | Recomendação | Limite / condição                                                                                                                             |
| ----------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo local / revisão com dados sintéticos | **GO**       | Código validado e demonstração sem contas reais; não significa que a demo hospedada foi atualizada                                            |
| Beta fechado com usuários reais           | **NO-GO**    | PostgreSQL nativo, host persistente/HTTPS, SMTP real, backup/restore, proxy, operação, políticas, dispositivos e aprovação expressa pendentes |
| Lançamento público                        | **NO-GO**    | Todos os gates do beta, mais aceitação de escala/moderação/monitoramento e autorização pública                                                |
| Comercialização Pro                       | **NO-GO**    | Sem checkout, cobrança ou fluxo comercial autorizado; PR #8 excluído                                                                          |

O freeze é uma candidata consolidada para revisão, não uma declaração de serviço pronto. Publicação da demo ou do backend exigiria ação posterior autorizada, com origem de build correta.

## Histórico preservado

A API confirmou os heads de dez branches e nove PRs abertos, sem merge. `git merge-base --is-ancestor` confirma oito heads como ancestrais de `22ab34d`: main → launch-readiness → Ultimate → Ultimate Release → Next Level → auditoria → RC1 → polimento. Os recursos anteriores e os commits correspondentes estão na base desta branch.

Exceções explícitas: PR #4 não é ancestral, mas seu único diff contra main é o CTA `/demo`, já incorporado; não contém outro recurso faltante. PR #8 é uma experiência Pix separada e foi excluído deliberadamente. Não foi aplicado cherry-pick, squash, rebase ou merge de código histórico. Oito migrations SQL, schema, catálogo de temas, customização, Studio e editor de cartões permanecem byte a byte iguais à referência neste freeze. Evidência verificável em [release-freeze-history.json](evidence/release-freeze-history.json). Isso comprova ancestralidade/preservação, não substitui aceite de cada recurso em produção.

Proposta para revisão humana: PR #3 (inclui #1/#2) → #5 → #6 → #7 → #9 → PR do freeze. Nenhum PR foi fechado ou incorporado automaticamente. Main continua no head original consultado.

## Defeitos realmente tratados

| ID      | Evidência / impacto                                                                                                                                                                                                     | Correção e cobertura                                                                                                                                                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 / P1 | Reprodução no artefato anterior: iniciar com `BETTER_AUTH_URL=https://freeze-origin.example.test` retornou HTTP 200 com canonical `http://localhost:3000`. Build/runtime podiam divergir, apesar da instrução no README | Empacotamento lê canonical, OG, sitemap e robots realmente gerados e grava manifesto de origem; launcher recusa origem pública diferente antes de importar o servidor. Configuração incompleta não é liberada silenciosamente. Testes unitários e processo standalone real verificam aceitação/rejeição |
| F2 / P1 | `ShareLink` usava `window.location.origin`, enquanto QR, VibeCard e central usavam a origem canônica do servidor. Um acesso por alias podia copiar URL diferente                                                        | Dashboard e editor recebem explicitamente a URL canônica; clipboard usa esse valor, sem reconstruir a origem do navegador. Verificações HTTP conferem o valor fornecido pelo servidor; não houve ensaio de clipboard em dispositivo físico                                                              |

Não foram reproduzidos novos defeitos nas jornadas de cadastro/login/editor/publicação/exclusão durante este freeze. Foram acrescentadas verificações de despublicação/republicação, preservação de IDs e negação de autopromoção Pro. Não se reimplementou uma jornada que já funcionava.

O comando opcional `npm run test:origin` exige um build prévio com `BETTER_AUTH_URL=https://freeze-origin.example.test` e valida esse artefato por HTTP loopback/PGlite. Não abre TLS nem envia SMTP externo. Não executá-lo em serviço ativo nem publicar o build sintético. Depois, reconstruir explicitamente para a origem local ou a origem real aprovada.

Um ensaio inicial tentou automatizar a troca/restauração de builds: as nove verificações de origem passaram, mas a restauração encontrou `ENOTEMPTY` nos chunks do Next. Essa orquestração automática foi retirada da entrega. Os comandos finais são explícitos; as nove verificações passaram e um novo build local seguido de 108 verificações HTTP também passou. Não se apresentou o primeiro comando com falha como aprovação integral.

## PR #8 e vendas desabilitadas

PR #8 consultado no head `3331953e7b86c7a371d5b5aea21862c071765d4d`, ainda draft aberto sobre RC1. Os três diffs não contêm chave real literal; contêm placeholder de ambiente, página informativa e botão de cópia. Porém a condição é apenas “chave configurada”: se preenchida, seria mostrada mesmo com a comunicação de vendas fechadas. Não existe gate de autorização comercial nesse código. **PR #8 não está aprovado para incorporação.** Antes de eventual revisão futura, a exibição/cópia deve permanecer bloqueada enquanto vendas estiverem fechadas; nenhum aviso substitui esse bloqueio.

A candidata desta branch **não contém** `/pro/pix`, componente de cópia Pix, checkout, webhooks ou integração de pagamento. Configurar uma chave sintética no ambiente dos testes não a mostra nem permite comprar. A rota retorna 404; payload de perfil com `plan: PRO` é rejeitado sem criar entitlement. Nenhuma chave pessoal, cobrança ou promoção real foi criada. Concessão administrativa por terminal continua existindo para operação autorizada, sem simular pagamento.

## Origem e embalagem

Definir `BETTER_AUTH_URL` com a origem HTTPS final antes do build e manter o mesmo valor no runtime. No Docker, passar `--build-arg BETTER_AUTH_URL=https://DOMINIO_REAL`; Compose já encaminha essa configuração. Trocar domínio exige reconstruir a imagem. O manifesto não tem segredo e não deve ser editado manualmente. O launcher falha se faltar, estiver inválido ou divergir de um hostname público. Exceção somente entre origens loopback locais para portas efêmeras de teste.

Usar `npm start` ou o Dockerfile, que executam `launch.mjs`. Executar `server.js` diretamente contorna o contrato e não é um procedimento de liberação suportado. O sitemap permanece curado somente da landing, sem enumeração de usuários nem consultas ao banco. Perfis elegíveis mantêm seus metadados próprios; indisponíveis continuam 404/noindex. Não há garantia de remoção instantânea de índices ou cópias externas.

## Evidências e limites

Resultados completos em [VALIDATION](../VALIDATION.md). O ensaio de origem usa um domínio reservado `.example.test`: não comprova controle de domínio, certificado, DNS, conectividade PostgreSQL de produção, TLS ou entregabilidade SMTP. As jornadas de autenticação e dados usam banco isolado PGlite e fixtures, não contas reais. Confirmação/recuperação continuam cobertas por captura de e-mails em memória, não envio externo. Os testes mobile anteriores foram em Chrome desktop; não foram repetidos testes físicos nesta entrega, que não altera layout.

CI da referência `22ab34d` foi consultada e estava aprovada nos runs 40547161444 e 40547092218. Isso não é uma afirmação sobre o CI do novo head. O Pull Request desta revisão permite nova execução/revisão independente.

## Riscos e dependências ainda presentes

- P0 operacional: nenhum host backend/banco nativo/HTTPS real foi homologado. Docker, psql, pg_dump e pg_restore não estavam disponíveis neste ambiente. PGlite não aprova as oito migrations em PostgreSQL de produção.
- P0 operacional: entrega SMTP, DNS/remetente, backups/restauração, RPO/RTO e recuperação não foram comprovados.
- P1 operacional: proxy confiável, origem privada, limpeza agendada, monitoramento/alertas e capacidade entre instâncias precisam de aceite real.
- P1 operacional: responsável legal, contato público autorizado, retenção/backups, público etário, atendimento/moderação e acesso ao beta permanecem a cargo do operador.
- P1 de aceitação: iOS/Safari, Android/Chrome físicos, leitor de tela, movimento reduzido do sistema, rede móvel, clipboard, download e Web Share ainda precisam de ensaio.
- Limites conhecidos: CSP inline e avisos de depreciação do driver de fixtures/lint continuam documentados nas auditorias anteriores. Não foram classificados como vulnerabilidades novas confirmadas nesta revisão.

Checklist objetivo de aceite: [RELEASE_FREEZE_CHECKLIST](RELEASE_FREEZE_CHECKLIST.md). Não preencher campos operacionais por inferência e não mudar as decisões NO-GO apenas porque os testes locais passaram.
