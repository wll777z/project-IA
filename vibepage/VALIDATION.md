# Validação — VibePage 3.0 Next Level

Executada em 27/10/2026 na branch `feature/vibepage-next-level`, sobre `feature/vibepage-ultimate-release` (`e8cb1f688224f349b7165488829d4af20e386f21`). A comparação das branches está em [docs/NEXT_LEVEL_INVENTORY.md](docs/NEXT_LEVEL_INVENTORY.md). Node.js 24.22.1, npm 11.9.0. Mudanças somente em `vibepage/`; sem merge ou deploy. Os resultados da release anterior (139 testes/47 verificações HTTP) são históricos.

## Resultados reais

| Comando                | Resultado                                                |
| ---------------------- | -------------------------------------------------------- |
| `npm run lint`         | Aprovado, sem erros ou avisos do linter                  |
| `npm run typecheck`    | Aprovado, client Prisma gerado                           |
| `npm test`             | 176 testes aprovados em 20 arquivos                      |
| `npm run build`        | Build de produção aprovado; standalone preparado         |
| `npm run test:http`    | 67 verificações aprovadas na aplicação standalone        |
| `npm run format:check` | Aprovado                                                 |
| `npm audit --json`     | 0 vulnerabilidades conhecidas, incluindo desenvolvimento |

Avisos Better Auth sobre tokens/senhas inválidos são esperados nos testes negativos. Há um aviso de depreciação de `pg@8` sobre consultas concorrentes na mesma conexão nas fixtures Prisma/PGlite; não é falha de teste e não foi validado em PostgreSQL nativo. O ambiente npm avisa sobre `http-proxy`; ESLint 9 continua com atualização coordenada pendente. Auditoria sem achados não garante ausência de vulnerabilidades.

## O que foi exercitado

- Regressões existentes de autenticação, confirmação, recuperação, logout, sessão, CSRF, revisão, propriedade, XSS escapado, URLs, upload Sharp, publicação, Pro e cascatas foram executadas novamente.
- Os quatro layouts persistem no banco/DTO; Free não cria Studio/blocos. Ordem e configurações privadas sobrevivem ao downgrade e ao save Free. Cliente antigo que omite campos novos não os apaga.
- Blocos próprios persistem; IDs alheios, imagens não pertencentes ao dono e URLs ativas são recusados. Blocos ocultos não aparecem no DTO público. Galeria usa upload real PNG normalizado, verifica Pro e fica inacessível anonimamente ao ocultar ou expirar.
- Os sete modelos geram perfil válido preservando identidade, links e conteúdo dos cartões/blocos. Restaurar aparência preserva alterações de conteúdo feitas depois da aplicação.
- Coleções: criação, cópia independente, aplicação, desfazer, revisão antiga e propriedade. A troca usa configurações visuais e preserva o conteúdo atual.
- Agenda: início inclusivo/fim exclusivo por instantes UTC com offset explícito, fuso IANA inválido, coleção alheia, sobreposição e cancelamento após downgrade. A aparência padrão permanece no banco e volta após o intervalo sem cron.
- QR independente decodificado por jsQR para a URL canônica exata. Todos os cinco modelos de VibeCard geram PNG 1280×720; o QR recortado de cada PNG foi decodificado. Rascunhos não geram imagens; Free recebe somente Minimal.
- Analytics: comparação com período anterior, ausência de base percentual, soma real de cliques de cartões, ranking, CSV com neutralização de fórmulas e autorização. Redirect só usa URL armazenada de cartão visível e publicado.
- Exportação JSON inclui blocos/coleções/agendas; cascatas dos novos registros e preservação de dados legados foram verificadas.

## Migrations e limites do banco testado

As sete migrations são aplicadas nas fixtures isoladas. `ultimate-migration.test.ts` aplica quatro migrations antigas, cria usuário/perfil/link legado e aplica as três seguintes em ordem; confirma identidade/links/defaults, Aurora Blue e novas tabelas vazias. Confirma ainda que username `pro`, anteriormente válido, continua permitido. Nenhuma migration anterior foi alterada.

O banco testado é PostgreSQL embarcado **PGlite**, via Prisma e pg. Locks/revisões e testes com promessas simultâneas não equivalem a concorrência entre processos, carga ou upgrade de um PostgreSQL nativo. Não há Docker/PostgreSQL nativo disponível nesta execução. A migration nova é aditiva; mudanças de checks de upload devem ser ensaiadas em homologação com backup/restauração antes de produção.

## HTTP de produção

O smoke inicia uma instância standalone real em porta dinâmica, banco isolado e autenticação real. Além da cobertura anterior, exercita Studio/bloco autodeclarado público, QR e VibeCard PNG, coleção salva/aplicada, agenda com fuso, clique de cartão, analytics/CSV e as três novas áreas autenticadas. Expiração revoga recursos públicos e CSV, preservando coleções privadas. Encerramento inclui logout, exclusão com senha e 404 de perfil/imagem removidos.

## Navegador e responsividade

A revisão usa exportação estática **local**, ignorada dentro de `.next/`, para QA com o skill Sites. Não registrou/publicou outro site. O backend não roda nessa exportação; testes HTTP acima cobrem o aplicativo com banco.

Conferido no Chrome: seleção de Gamer Dashboard/duas colunas, criação de conquista, título/descrição refletidos imediatamente na prévia, aviso autodeclarado, salvar/recarga mantendo bloco e layout. Reordenação de seções foi acionada com Enter. Filtro Criador exibiu somente Creative Signal; sua prévia completa e aplicação preservaram links/cartão/conquista no preview.

Nesta rodada, o Studio foi aberto em iframe de 390 px (375 px úteis com scrollbar): `scrollWidth` e `clientWidth` medidos eram ambos 375, sem overflow horizontal nesse cenário. A captura mostrou navegação, título e controles do Studio acessíveis. Isso não equivale a teste em aparelho físico, leitor de tela, todos os temas/breakpoints, performance mobile ou preferência de movimento reduzido do sistema. As áreas autenticadas novas foram renderizadas pelo smoke HTTP; não passaram por teste visual com uma conta de produção no navegador.

## Pendências e configuração de produção

PostgreSQL nativo, SMTP real, domínio/host, proxy, carga, backups/restauração, monitoramento e entregabilidade continuam dependentes do operador. Recuperação/confirmacão em testes captura mensagens em memória, sem enviar e-mails externos. Não há checkout ou cobrança; Pro é concedido pelo administrador.

Produção pública exige `DATABASE_URL`, origem HTTPS exata em `BETTER_AUTH_URL`, segredo exclusivo, `REQUIRE_EMAIL_VERIFICATION=true` e SMTP completo; iniciar via `npm start`/Dockerfile com `launch.mjs`. Nenhuma variável obrigatória nova foi adicionada. QR usa a origem configurada, nunca o header Host fornecido pelo cliente.

Histórico é agregado em UTC; cliques de cartões começam nesta versão, não são visitantes únicos, e a prévia não conta. CSV exporta os 90 dias e rankings do período selecionado. Excluir um elemento remove suas métricas individuais em cascata. Downloads já compartilhados não podem ser revogados. Temporadas voltam ao padrão atual; uma mudança manual do padrão durante o intervalo permanece após seu fim. O horário local usa o fuso do dispositivo e exibe o instante UTC; horários inexistentes por horário de verão são recusados no formulário. Em horários ambíguos, revise o instante UTC exibido antes de agendar.

Termos, controlador, contato, retenção, moderação/denúncias e tratamento de menores precisam ser definidos antes de abrir cadastros amplos. A confirmação de saída cobre fechar/recarregar e cliques em links; Voltar do navegador não tem interceptação universal. Consulte [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md). O site hospedado anteriormente não foi atualizado nesta tarefa.

## Ajuste de acesso aos botões — 27/10/2026

Escopo restrito aos controles do editor e CSS do menu da conta. Barra de salvar/feedback permanece ao alcance ao rolar; atalhos alternam prévia/edição com foco e respeitam movimento reduzido. No celular, um seletor reúne as nove seções; as abas continuam no desktop. Ordenar/remover receberam alvos mínimos de 44×44 px e tooltips; o menu da conta usa duas colunas no mobile. Não houve alteração de schema, autenticação, permissões ou conteúdo dos perfis.

Executados novamente e aprovados: lint, typecheck, 176 testes/20 arquivos, build e 67 verificações HTTP. Formatação conferida após a documentação. No Chrome, em iframe de 390 px (375 úteis), o seletor trocou seções, Enter reordenou links e o botão salvou a demo a partir da prévia. A barra permaneceu em `top: 6 px` após rolar até a prévia; seis botões de links medidos tinham 44×44 px. `scrollWidth` e `clientWidth` eram ambos 375. Ao salvar na seção Studio com username inválido, o editor abriu Perfil, mostrou o erro e focou o campo. O desktop manteve as nove abas e recuperou os dados da demo ao abrir novamente. Valores temporários de QA foram restaurados.

Teste visual no navegador foi da exportação local; o menu autenticado da conta foi ajustado por CSS e renderizado no smoke, sem teste visual autenticado em dispositivo físico. Permanecem os limites de infraestrutura e acessibilidade descritos acima.
