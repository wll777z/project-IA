# Validação — VibePage Ultimate Release

Executada em 27/10/2026 na branch `feature/vibepage-ultimate-release`, a partir da main `080141fc0e49a92ab815a8c22f59a2a90ed65da1`. Foram preservadas as implementações dos PRs #1 e #2 e acrescentadas correções e Aurora Blue. Node.js 24.22.1, npm 11.9.0. Mudanças somente dentro de `vibepage/`; sem merge ou deploy nesta rodada.

## Resultados reais

| Comando                | Resultado                                                    |
| ---------------------- | ------------------------------------------------------------ |
| `npm run lint`         | Aprovado, sem erros ou avisos do linter                      |
| `npm run typecheck`    | Aprovado, Prisma Client gerado                               |
| `npm test`             | **139 testes aprovados em 16 arquivos**                      |
| `npm run build`        | Build de produção aprovado; standalone preparado             |
| `npm run test:http`    | **47 verificações aprovadas** na aplicação standalone        |
| `npm run format:check` | Aprovado                                                     |
| `npm audit --json`     | **0 vulnerabilidades conhecidas**, incluindo desenvolvimento |

Nenhuma dependência foi adicionada ou atualizada. Avisos de credenciais/tokens inválidos durante testes Better Auth são esperados. O aviso do ambiente npm sobre `http-proxy` e o fim de suporte do ESLint 9 não são erros do linter; a atualização coordenada do ESLint permanece no checklist.

## Regressões e permissões

Os três testes do novo arquivo `background-permissions.integration.test.ts` foram executados antes da correção e **falharam como esperado**: upload de fundo Free era aceito e a imagem continuava no DTO após expiração. Depois da correção, passaram. Agora a permissão é aplicada antes de processar o upload, novamente dentro da transação, no salvamento, DTO público, preview, renderer e mídia. O arquivo permanece acessível ao dono; o anônimo recebe 404 após a expiração.

O teste cobre fallback de tema premium, cor de fundo, botões, animação, efeitos, fonte e marca. A cor de destaque permanece liberada no Free, conforme o produto. A suíte continua cobrindo URLs, XSS escapado, propriedade, revisão otimista, colisão de IDs, uploads reais Sharp, MIME/SVG/tamanho, limites atômicos, exportação e cascatas.

Foram testados ainda: duas gravações assíncronas com a mesma revisão e um único vencedor; as 13 receitas de tema preservando identidade/links/IDs; palette-only mantendo efeitos; geração UUID v4 quando `randomUUID` não existe; restauração da demo sem sobrescrever estilo já salvo por causa da query de tema; migração de dados locais legados/corrompidos.

## Banco, migrations e autenticação

As **seis migrations** são aplicadas em banco novo nas fixtures. Um teste aplica as quatro originais, cria usuário/perfil/link legado, aplica quinta e sexta na ordem e verifica que dados e defaults foram preservados e Aurora Blue foi registrada como Pro. As migrations antigas não foram editadas.

O banco é PGlite, acessado por Prisma/pg. O teste de saves simultâneos usa duas promessas com a mesma revisão e a conexão da fixture; não equivale a concorrência entre processos em PostgreSQL nativo.

Better Auth e senhas/sessões reais são usados nos testes de cadastro, login, logout, expiração, confirmação e recuperação. Mensagens são capturadas em memória; não foram enviadas para SMTP externo. Segredos das fixtures não são configurações de produção.

## HTTP de produção — 47 verificações

O smoke inicia o launcher standalone em porta dinâmica com banco isolado. Verifica landing/CSS/headers, `/demo`, redirect de anônimo, cadastro/login, cookie, CSRF, exportação, persistência, rascunho 404, publicação, cartões e bio escapados, URLs e limites Free, Open Graph/no-store/404, visitas e cliques reais, Pro concedido/revogado no banco, Aurora Blue, fundo Pro publicado e posterior omissão/404 ao expirar, logout, exclusão com senha e remoção dos dados.

## Navegador e responsividade

A prévia direta do Next continua incompatível com as flags enviadas pela infraestrutura (`--host`/`--strictPort`). Para QA, foi usada a **exportação estática local** em diretório ignorado de `.next/`, sem registro ou publicação de site e sem alterar o script de desenvolvimento.

No Chrome da ferramenta, foram conferidos:

- Nome editado, atualizado imediatamente na prévia, salvo e mantido após recarga; o exemplo foi restaurado depois.
- Criação de cartão em HTTP, preenchimento, reordenação por botões, salvamento e ordem mantida após recarga. O cartão temporário de QA foi removido.
- O browser reproduziu `crypto.randomUUID is not a function` antes da alternativa Web Crypto; a criação passou após a correção.
- Separação de Temas/Aparência, Aurora Blue e preview; pausa de efeitos passou de “Pausar” para “Ativar” e aplicou `animations-paused`.
- Landing exportada com troca de preset refletida no jogo/cartão da demonstração.
- Editor em iframe de 390 px (375 px de área útil com a barra de rolagem do Chrome). Após estabilização, `scrollWidth` e `clientWidth` eram ambos 375: sem transbordamento horizontal persistente nesse cenário. Seções e controles permaneceram acessíveis na árvore de acessibilidade.

Essas verificações não testam contas reais no browser, SMTP, todos os breakpoints, dispositivo físico, emulação completa de celular, contraste em todos os temas, leitor de tela ou desempenho em hardware fraco. As regras CSS de movimento reduzido foram revisadas; não foi alterada a preferência do navegador/sistema para alegar teste de mídia reduzida.

## Pendências para homologação e lançamento

Não há PostgreSQL nativo/Docker, host de produção ou SMTP real configurados neste ambiente. Upgrade em banco real, carga/concorrência nativa, proxy, limites na borda, persistência do host, backups/restauração, monitoramento e entregabilidade precisam de validação do operador.

Produção pública exige `DATABASE_URL`, origem HTTPS em `BETTER_AUTH_URL`, segredo exclusivo, `REQUIRE_EMAIL_VERIFICATION=true` e SMTP completo. Use `npm start` ou o Dockerfile com `launch.mjs`. Textos legais, controlador/contato, retenção, público menor de idade, moderação e denúncias continuam pendentes. Há proteção ao recarregar/fechar e clicar em links com mudanças não salvas; navegação Voltar não tem interceptação universal.

A prévia hospedada anteriormente não foi atualizada nesta tarefa. Consulte [docs/RELEASE_AUDIT.md](docs/RELEASE_AUDIT.md) e [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md). Os resultados anteriores de 61/94/114 testes são históricos, não o resultado desta rodada. Nenhuma auditoria ou teste garante ausência de todas as falhas.
