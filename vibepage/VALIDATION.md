# Polimento final — 27/10/2026

Base `release/vibepage-3.0-rc1` em `2c1735e`, branch `fix/vibepage-final-polish`. Resultados desta revisão, sem merge/deploy:

| Verificação         | Resultado real                           |
| ------------------- | ---------------------------------------- |
| `npm run lint`      | Aprovado                                 |
| `npm run typecheck` | Aprovado; Prisma gerado                  |
| `npm test`          | 203 testes, 26 arquivos aprovados        |
| `npm run build`     | Aprovado; inclui `/sitemap.xml` estático |
| `npm run test:http` | 96 verificações aprovadas                |

`npm run format:check` aprovado. Parse estrutural do Compose conferiu o encaminhamento da origem de build; Docker não foi executado.

Cinco testes de polimento cobrem destinos/rota ativa, administração, orientações iniciais, bloqueios de compartilhamento por estado e sitemap/robots. HTTP verifica noindex de auth/demo, X-Robots-Tag das APIs, sitemap/canonical, OG do perfil, primeiro acesso, rascunho/publicado/indisponível, expiração Pro e manutenção do bloqueio de compras (`/pro/pix` 404, PR #8 separado). O primeiro ensaio apontou expectativas excessivamente estritas sobre ordem de atributos e barra final de URL; os testes foram ajustados para comparar os elementos/URLs equivalentes, sem afrouxar as condições de elegibilidade ou autorização.

QA visual: nove estados em cada largura 360/390/768/1440, em frames de Chrome desktop com snapshots HTTP sintéticos. Sem overflow horizontal nos 36 cenários. Menu mobile com abertura por Enter, navegação por Tab, indicador de página ativa e foco visível; links medidos em 48–58 px. Evidências em `docs/evidence/polish-layouts.json` e `docs/evidence/polish-mobile.jpg`. O guia do editor foi reduzido após conferência para preservar espaço útil.

Snapshots têm somente scripts do transporte de HTML streamed do React, sem hidratação do aplicativo, sessões, saves ou chamadas autenticadas no navegador. Não foram validados iOS/Safari, Android físico, leitor de tela real, SMTP, PostgreSQL nativo ou Docker/Caddy. QA visual/árvore de acessibilidade não certifica WCAG. Avisos de depreciação de pg nas fixtures continuam. Nenhuma alteração de schema, migration ou dependência.

Decisões e origem de build: [FINAL_POLISH_REVIEW](docs/FINAL_POLISH_REVIEW.md). **NO-GO beta/público/Pro comercial continua**, pelas pendências operacionais já registradas. As seções seguintes são evidência histórica das respectivas branches.

---

# Candidata 3.0.0-rc.1 — validação de 27/10/2026

Resultados reais desta candidata, sobre a auditoria `7d9758f`:

| Verificação                                   | Resultado                         |
| --------------------------------------------- | --------------------------------- |
| `npm run lint`                                | Aprovado                          |
| `npm run typecheck`                           | Aprovado; Prisma gerado           |
| `npm test`                                    | 198 testes, 25 arquivos aprovados |
| `npm run build`                               | Aprovado; Next standalone         |
| `npm run test:http`                           | 80 verificações aprovadas         |
| Exportação estática para diretório temporário | Aprovada; sem publicação          |

`npm run format` e `npm run format:check` executados com estilo aprovado. `npm audit` reportou **0 vulnerabilidades**. Parse YAML estrutural aprovado (sete serviços; somente proxy publica portas); não é execução Docker/Caddy.

Os testes usam PGlite isolado. Cobrem manutenção dos dados legados na oitava migration, papéis administrativos, confirmação obrigatória, CSRF, acesso à fila, XSS escapado, revisões concorrentes, suspensão/restauração, negação de mídia/QR/VibeCard, impossibilidade de o dono contornar suspensão, retenção/limpeza e exclusão de contatos. O ciclo HTTP inclui cadastro/login/perfil/publicação/compartilhamento, downgrade e exclusão com fixtures. E-mails são interceptados nos testes; nenhuma entrega SMTP real foi validada.

Não executados: Docker/Caddy real, PostgreSQL nativo vazio/upgrade, backup/restore, DNS/HTTPS externo, SMTP externo, dispositivos iOS/Android ou beta com pessoas reais. Não há host conectado. Os avisos de depreciação do driver pg em fixtures continuam; não foram tratados como falha nem como validação de produção.

A evidência histórica abaixo continua válida para seu commit; não representa novo ensaio mobile/performance desta candidata. Decisão atual: **NO-GO beta, público e comercialização Pro**. Veja [RELEASE_CANDIDATE](docs/RELEASE_CANDIDATE.md).

---

# Validação — auditoria final de lançamento

27/10/2026. Base GitHub `feature/vibepage-next-level` em `07d1e8cec4be202033136f32cd32919ffa527a6a`; branch `audit/vibepage-final-release`. Apenas `vibepage/`; sem merge/deploy ou alteração de dados/credenciais reais. Relatório e decisão atuais: [docs/FINAL_RELEASE_REVIEW.md](docs/FINAL_RELEASE_REVIEW.md).

## Resultados executados

| Comando                                          | Resultado real                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `npm run lint`                                   | Aprovado, sem erros/avisos de linter                           |
| `npm run typecheck`                              | Aprovado, client Prisma gerado                                 |
| `npm test` antes do build                        | 183 testes/22 arquivos aprovados                               |
| `npm run build`                                  | Standalone de produção aprovado                                |
| `npm test` depois do build                       | 183 testes/22 arquivos aprovados novamente                     |
| `npm run test:http`                              | 68 verificações aprovadas; repetido após ajustes CSS           |
| `npm run format`                                 | Executado em todo o aplicativo                                 |
| `npm run format:check`                           | Conferido após a formatação                                    |
| `npm audit`                                      | 0 vulnerabilidades conhecidas                                  |
| `node --import tsx tests/release-performance.ts` | Probe local com 12 cartões/100 links; JSON em `docs/evidence/` |

Node 24.22.1, npm 11.9.0. Os avisos Better Auth de testes negativos, depreciação pg nas fixtures e configuração npm `http-proxy` permanecem visíveis; não são erros do linter. Audit sem achados não garante ausência de falhas.

## Regressões e segurança

`final-downgrade.integration.test.ts` foi executado antes da correção: dois testes falharam, comprovando perda da referência de fundo após save Free e rejeição de save com 12 cartões legados. Após correção, preservação/reativação e paleta gratuita passam. Free continua sujeito às regras do servidor: somente três cartões públicos; IDs novos acima do limite recusados.

`final-boundaries.integration.test.tsx` valida cookies HTTPS, sessão legada não verificada bloqueada na exportação, confirmação, export sem credenciais/sessões, CSRF de coleções, textos de blocos escapados, e revogação de QR/VibeCard/galeria ao despublicar. Entrega de e-mail é capturada em memória, não SMTP externo. Smoke verifica 429 de Open Graph no standalone. As coberturas anteriores de upload, URL, IDOR, revisões, coleções/agenda, PNG/QR, CSV, expiração, logout, exclusão e cascatas foram executadas novamente.

As sete migrations permanecem intactas; checksums em `docs/evidence/migrations.sha256`. As fixtures aplicam as sete em banco vazio e o teste legado aplica quatro, cria usuário/perfil/link e aplica as outras três verificando preservação. Banco usado: PGlite via Prisma/pg. Não houve teste de PostgreSQL nativo vazio/upgrade/carga/concorrência ou backup/restauração nativos.

## Browser e medição local

Chrome desktop com frames 360, 390, 768 e 1440 px: demo/Studio, landing, login estático e renderer público sintético de 12 cartões/100 links. Medidas e pintura/layout shifts locais em `docs/evidence/browser-layout-before.json` e `browser-layout-after.json`; capture `editor-360.jpg`. Corrigidos os overflows reproduzíveis de uploads (360/390) e órbitas (768). A instrumentação está restrita ao HTML de QA ignorado, preparado por `scripts/prepare-release-qa.mjs`.

O probe Node registra dez amostras por endpoint, primeira fria e nove aquecidas, e materializa os cinco PNGs. JS gzip é estimativa offline, não medição de transferência móvel. CPU/RSS referem-se ao processo do probe, que inclui PGlite/Prisma; não dimensionam o servidor de produção. JSON bruto em `docs/evidence/release-performance.json`. Não foi medida CPU de animações nem uma distribuição real de INP/p75; ausência de eventos qualificáveis não significa INP zero.

Não foram validados Safari/iOS, Chrome/Android físicos, leitor de tela, preferência de movimento reduzido do sistema, rede lenta, SMTP real ou jornada completa no domínio final. A árvore de acessibilidade, CSS de movimento reduzido e controles por teclado não constituem certificação de acessibilidade. Upload/download real e dados autenticados foram exercitados em APIs/HTTP, não nos dispositivos ausentes.

## Gates atuais

**NO-GO beta fechado com usuários reais; NO-GO lançamento público; NO-GO comercialização Pro.** GO apenas para homologação local com dados sintéticos. Falta comprovar backend HTTPS/banco persistente, PostgreSQL nativo, SMTP externo, backups/restore, proxy, limpeza/alertas, responsáveis/contatos/políticas e operação de denúncias, além da aceitação em dispositivos. Os testes antigos de 139/47 e 176/67 são históricos. Veja [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) e [docs/OPERATIONS_ACCEPTANCE.md](docs/OPERATIONS_ACCEPTANCE.md).
