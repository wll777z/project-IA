# Preparação Render + Neon — 29/10/2026

Criado `render.yaml` de homologação free, sem deploy automático, para a branch `fix/vibepage-final-launch-blockers`; guia em `docs/RENDER_NEON_STAGING.md`. `python3`/PyYAML analisou o YAML e encontrou um serviço; `npx prettier --check README.md render.yaml docs/RENDER_NEON_STAGING.md` aprovado; `git diff --check` aprovado. Não havia Render CLI e não foi chamada a validação Blueprint da API. O CI do commit `cb6af642cee8e09db6c556e5e0942fa60d1b6494` concluiu os jobs `validate` e `native-postgres` com sucesso: `npm ci`, lint, typecheck, `npm test`, build, `test:http` e `test:native` ([execução 40795031149](https://github.com/wll777z/project-IA/actions/runs/40795031149)). Nenhuma conta/projeto, variável secreta, banco Neon, SMTP, deploy ou teste externo foi configurado/executado. O host requer valores privados de Neon e SMTP antes de iniciar; Render Free bloqueia as portas SMTP padrão e não foi considerado produção.

# Atualização da prévia — 28/10/2026

Ao atualizar a demonstração pública, o QA hidratado em frame Chrome de390px reproduziu fonte13px em alguns inputs: o seletor antigo do editor tinha especificidade maior que a nova regra mobile. Ajustado somente o seletor CSS, sem !important ou redesign. Após novo build: fonte16px, botão salvar48px e sem overflow. Troca de seção, alteração do nome refletida na prévia, restauração do nome e salvamento local foram conferidos. Isso valida a demonstração estática, não cadastro/login ou jornada autenticada. Build com origem pública e lint aprovados nesta alteração; não se repetiu a suíte de backend por uma mudança exclusiva de CSS. Evidência em `docs/evidence/preview-mobile.json`.

# Execução final de bloqueadores — 28/10/2026

Branch `fix/vibepage-final-launch-blockers`, base completa `7a7c721`, PR #12. Node 24.22.1/npm11.9.0/Ubuntu24.04 local; CI nativo em runner GitHub com Docker. Sem merge/deploy, SMTP externo ou alteração de dados reais.

| Comando                                       | Resultado real                                                             | Duração da rodada final    |
| --------------------------------------------- | -------------------------------------------------------------------------- | -------------------------- |
| `npm ci`                                      | Aprovado, 617 pacotes instalados neste ambiente                            | npm reportou 32 s          |
| `npm run lint`                                | Aprovado, sem avisos ESLint                                                | 4,74s                      |
| `npm run typecheck`                           | Aprovado                                                                   | 3,29s                      |
| `npm test`                                    | **221 testes/32 arquivos aprovados**                                       | 57,68s                     |
| `npm run build`                               | Aprovado, standalone e manifesto local                                     | 12,67s                     |
| `npm run test:http`                           | **111 verificações aprovadas**, PGlite local                               | 6,69s                      |
| `npm run format:check`                        | Aprovado                                                                   | 2,75s                      |
| `npm audit`                                   | **0 vulnerabilidades reportadas**                                          | 6,63s                      |
| Build HTTPS sintético + `npm run test:origin` | **9 checks aprovados**, loopback HTTP                                      | 11,99s +4,32 s             |
| `npm run test:native` local                   | Bloqueado, saída 1: Docker ausente                                         | Não é aprovação nativa     |
| `npm run test:native` no CI                   | **12 etapas aprovadas**, incluindo 111 checks HTTP em PostgreSQL 17 nativo | 81,17s no job 122655486508 |

CI do código `2c5006899a805db41f60d1a8387de50f4f31e36b` aprovado nos runs [40639939948](https://github.com/wll777z/project-IA/actions/runs/40639939948) e [40639945352](https://github.com/wll777z/project-IA/actions/runs/40639945352). O CI do commit final de documentação deve ser conferido separadamente. Dados brutos/durações/limitações em [final-launch-results.json](docs/evidence/final-launch-results.json) e [final-launch-native.json](docs/evidence/final-launch-native.json).

O ensaio nativo criou container/bancos novos e descartáveis: oito migrations em banco vazio, catálogo/FK/índices, jornada real standalone por HTTP, perfil/links/cartões/blocos/coleção/temporada, corrida de revisão, downgrade sem perda privada, upgrade da fixture com quatro migrations, reinício do banco e novo processo da aplicação, dump/checksum/restore separado com hashes de todas as linhas, cleanup de expirados preservando vivos e cascatas. A imagem Docker foi construída e executada sem root até o HEALTHCHECK ficar saudável com PostgreSQL nativo. Caddy validou o arquivo real sem publicar portas/HTTPS. **Não é homologação do servidor final nem execução integral do Compose com domínio/SMTP.**

Sete testes adicionados: dois de guarda da URL nativa, três de expiração/idempotência de confirmação/reset e dois de sanitização/parser das métricas internas. Os testes de e-mail usam entrega capturada em memória: não houve SMTP externo. Navegação/regressões existentes adaptadas aos atalhos mobile. Segurança/Free/Pro/suporte/privacidade continuam nas suítes anteriores. Schema e oito migrations comparados byte a byte à base: intactos. Nenhuma dependência alterada.

O proxy agora oferece agregados de status/latência somente pela API interna Caddy 2019 (loopback do container, não publicada). O probe operacional foi testado na falha de infraestrutura, retornando erro sanitizado; parser testado com séries sintéticas. Não houve coleta real no host final ou entrega de alerta. Séries cumulativas por handler não são taxas por período nem devem ser somadas entre handlers.

Browser: dashboard/editor SSR observados em frame de 390 px com os três atalhos visíveis. **Não foi comprovada jornada com hidratação/salvar/publicar**; navegador bloqueou continuação por política do ambiente. Harness temporário removido, nenhum bypass/rota auxiliar entregue. Não se repetiram os 60 snapshots antigos nem o benchmark sem necessidade. Safari/iOS, Android físicos, leitor de tela, teclado virtual, rede móvel e métricas de campo pendentes.

Tentativas corrigidas: geração Prisma concorrente com typecheck (erro de orquestração; rodada final sequencial), tipo do env da fixture no primeiro CI, tema ausente na fixture legada e porta Docker realocada após restart. Um build inicial usou hostname sintético diferente do fixado no teste de origem; reconstruído com `freeze-origin.example.test`, passou 9 checks e foi reconstruído explicitamente para localhost. Nenhuma dessas falhas foi classificada falsamente como vulnerabilidade de produção. Avisos de depreciação pg@9 futura/ESLint instalado continuam documentados; audit 0 não garante ausência de falhas.

Decisão: demo visual pública anterior apta como demo; nova candidata não publicada. **NO-GO beta real, lançamento público e venda Pro** até os gates externos em [PRODUCTION_GO_LIVE](docs/PRODUCTION_GO_LIVE.md). Relatório/pendências em [FINAL_LAUNCH_BLOCKERS](docs/FINAL_LAUNCH_BLOCKERS.md). Evidências abaixo são históricas.

---

# Candidata de produção — 27/10/2026

Base freeze `3e166f2`, branch `release/vibepage-3.0-production-ready`; Node 24/Next standalone e Prisma/PGlite isolado.

| Verificação                                   | Resultado real                                            |
| --------------------------------------------- | --------------------------------------------------------- |
| `npm run lint`                                | Aprovado                                                  |
| `npm run typecheck`                           | Aprovado, Prisma gerado                                   |
| `npm test`                                    | 214 testes, 30 arquivos aprovados                         |
| `npm run build`                               | Aprovado com healthcheck empacotado e manifesto de origem |
| `npm run test:http`                           | 111 verificações aprovadas                                |
| Build HTTPS sintético + `npm run test:origin` | 9 verificações locais aprovadas                           |
| Novo build explícito localhost + smoke        | 111 verificações aprovadas novamente                      |
| `npm audit`                                   | 0 vulnerabilidades reportadas                             |

`npm run format:check` aprovado após formatar o JSON das medições. Resumo e hashes de preservação em [production-results.json](docs/evidence/production-results.json).

Seis testes novos: conexão pg sem handshake recusada por timeout; readiness 200 e 503 sem dados privados; SMTP STARTTLS/465 e falha sanitizada. Os testes SMTP mockam o provedor; não houve envio externo. O probe real empacotado foi executado por HTTP e retornou sucesso. Docker/Caddy, PostgreSQL nativo, SQL de aceite/restore, backups e timers não foram executados. YAML foi inspecionado estruturalmente, não como container em operação.

QA Chrome local: 60 snapshots em 360/390/768/1024/1440, sem overflow/labels ausentes na triagem. Demo hidratada: prévia e save local conferidos; nenhuma página publicada. Métricas de demo, latência/JS/PNGs, CPU/RSS do probe e limites em `docs/evidence/production-*`. LCP/CLS observados localmente não são Web Vitals de campo; INP não foi mensurado (sem eventos qualificáveis), não é zero. Não foram testados Safari/iOS, Android físicos, leitor de tela, rede lenta ou CPU móvel.

Os oito arquivos de migration permanecem iguais ao freeze (`production-migrations.sha256`). CI do freeze consultada e aprovada nos runs 40599503448/40599423775; isso não equivale ao CI do novo head. Sem merge/deploy, credenciais/dados reais ou pagamentos alterados.

[Relatório](docs/PRODUCTION_RELEASE_REVIEW.md) · [Checklist objetivo](docs/PRODUCTION_GO_LIVE.md). **NO-GO beta real, público e comercialização Pro.** Resultados abaixo são históricos das respectivas branches.

---

# Release freeze — 27/10/2026

Base GitHub `fix/vibepage-final-polish` em `22ab34d`; branch `release/vibepage-3.0-freeze`. Apenas mudanças necessárias à origem pública, compartilhamento e evidências. Sem merge/deploy.

| Comando / verificação                                                                  | Resultado real                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run lint`                                                                         | Aprovado                                                    |
| `npm run typecheck`                                                                    | Aprovado; Prisma gerado                                     |
| `npm test`                                                                             | 208 testes, 27 arquivos aprovados                           |
| `npm run build`                                                                        | Aprovado com manifesto gerado de origem                     |
| `npm run test:http`                                                                    | 108 verificações aprovadas                                  |
| Build com `BETTER_AUTH_URL=https://freeze-origin.example.test` + `npm run test:origin` | 9 verificações locais aprovadas                             |
| Build explícito com `BETTER_AUTH_URL=http://localhost:3000` + novo smoke HTTP          | Aprovado; 108 verificações, após o ensaio de origem pública |

`npm run format:check` aprovado. Resumo verificável em [release-freeze-results.json](docs/evidence/release-freeze-results.json).

Cinco testes novos cobrem metadados gerados, origem de build/runtime, manifesto inválido e rejeição de URL insegura. O smoke ampliado exercita despublicação/republicação, preservação de IDs, negação de Pro por payload, chave Pix sintética sem exibição, além dos atalhos de compartilhamento com URL do servidor. Cadastro/login/editor/publicação/QR/VibeCard/logout/exclusão e downgrade permanecem cobertos no standalone com Prisma/PGlite isolado. SMTP é interceptado em memória; não houve envio externo.

Reprodução anterior à correção: origem runtime HTTPS sintética recebeu HTTP 200 com canonical `http://localhost:3000`. Após a correção, o launcher recusa origem pública divergente; o build com origem sintética correta produz canonical, OG, sitemap, robots e QRs sem URLs de loopback. **O tráfego do ensaio continua sendo HTTP loopback; isso não aprova certificado, DNS ou SMTP reais.**

Um primeiro harness de build/restauração passou nove verificações, mas terminou com erro de chunks `ENOTEMPTY`. A automatização de restauração foi retirada da entrega; o comando atual apenas testa o build explicitamente preparado. A execução final de `test:origin`, a reconstrução local explícita e o smoke posterior passaram. Não se contabiliza a tentativa inicial como comando integral aprovado.

Oito migrations e cinco arquivos centrais de schema/temas/cartões/Studio foram comparados à referência: intactos. Dez branches e seus ancestrais conferidos, com exclusão deliberada de PR #8 e CTA já presente do PR #4. Evidência em [release-freeze-history.json](docs/evidence/release-freeze-history.json). A CI da referência estava aprovada; a validação do novo PR é independente.

Não executados: PostgreSQL nativo, Docker/Caddy, HTTPS/DNS/SMTP externos, backup/restauração reais, proxy/monitoramento remoto ou dispositivos físicos. Não houve novo ensaio visual: nenhuma alteração de layout nesta revisão. Os 36 cenários Chrome do polimento anterior permanecem evidência histórica, não teste físico ou certificado de acessibilidade.

Decisão: **GO demo local/sintética; NO-GO beta real e lançamento público; Pro comercial desabilitado.** [Relatório](docs/RELEASE_FREEZE.md) · [Gates de homologação](docs/RELEASE_FREEZE_CHECKLIST.md).

---

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
