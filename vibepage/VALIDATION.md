# Validação — VibePage Ultimate

Rodada de 27/10/2026, branch `feature/vibepage-ultimate`, preservando o PR #1 (`17b9d4492889091db24a3ec5090919222c674469`). Node.js 24.22.1, npm 11.9.0. Alterações somente em `vibepage/`. Não houve merge, deploy, serviços contratados ou cobrança.

## Resultados reais

| Verificação            | Resultado                                                                    |
| ---------------------- | ---------------------------------------------------------------------------- |
| Dependências           | Mantidas as versões e o lockfile existentes; nenhuma biblioteca adicionada   |
| `npm run lint`         | Aprovado, sem erros ou avisos do linter                                      |
| `npm run typecheck`    | Aprovado, Prisma Client gerado                                               |
| `npm test`             | **114 testes aprovados em 12 arquivos**                                      |
| `npm run build`        | Build de produção aprovado; standalone preparado                             |
| `npm run test:http`    | **39 verificações aprovadas** por HTTP na aplicação standalone               |
| `npm run format:check` | Prettier aprovado                                                            |
| `npm audit --json`     | **0 vulnerabilidades conhecidas**, incluindo dependências de desenvolvimento |

Os avisos esperados de credenciais inválidas/token inválido dos testes Better Auth não indicam falha da suíte. O ambiente npm avisa sobre sua configuração `http-proxy`; não é um erro do aplicativo. ESLint 9 permanece fora de suporte e requer atualização coordenada com os plugins do Next. Nenhuma versão RC foi adotada.

## Auditoria e regressões

A revisão anterior preservada corrigiu URL parcial que lançava `TypeError`, canonicalização HTTPS, condição de corrida entre donos de links, cache de Open Graph e exigência de confirmação de e-mail em produção. O relatório histórico permanece em `docs/LAUNCH_AUDIT.md`.

Nesta rodada, a inspeção confirmou que títulos de links podiam conter caracteres de controle, incluindo NUL, incompatíveis com o campo texto do PostgreSQL. A validação agora os recusa antes da persistência, com teste de regressão. A suíte passou com 95 testes antes da ampliação funcional e com 114 após as implementações.

O editor bloqueia edição durante save/upload para evitar que um reset de resposta sobrescreva novas edições. Há aviso ao recarregar/fechar com alterações e confirmação ao clicar em links internos; a navegação Voltar do navegador não tem interceptação universal e precisa de aceitação manual. O botão da landing “Experimentar o editor” agora abre `/demo`.

## Cartões, temas, efeitos e dados

- Criação, leitura, ordenação e persistência de cartões por Prisma e PGlite reais; IDs alheios recusados e transação sem perfil parcial.
- Limites Free/Pro, layouts, estilos, efeitos e fonte validados no servidor; tentativas de ativação pelo cliente são rejeitadas.
- As 12 opções de tema são gravadas por uma conta com entitlement Pro. Os cinco temas originais e a unicidade dos IDs têm teste.
- URLs ativas/locais, controles em nomes, enumerações, cores inválidas e campos arbitrários recusados. Renderer SSR escapa texto malicioso e só cria âncora externa para URL segura, com isolamento e destino visível.
- Avatar de cartão enviado pela rota real, normalizado para WebP, privado no rascunho, público após publicação e protegido se a posição ficar fora do limite Free após expiração Pro. Imagens estrangeiras recusadas.
- Exportação inclui cartões; remoção de cartões libera avatares sem uso; exclusão da conta faz cascata. Pro expirado preserva os cartões no banco, limita a exibição e os mantém no editor para remoção explícita.
- Gráfico usa dados reais para 7/30 dias, com rótulos correspondentes e tabela acessível. Cliques de cartões não são instrumentados; totais existentes contam links personalizados.

O CSS contém os efeitos configuráveis e regras de movimento reduzido. A implementação limita partículas a 16 elementos, pausa animações quando o componente sai da tela/aba é ocultada e oferece pausa manual. Esses comportamentos de navegador foram revisados no código, **não medidos em aparelho real**. Testes SSR não verificam layout, animações, foco ou contraste renderizado.

## Banco e migration

A quinta migration (`202610270001_ultimate`) adiciona `GamerCard`, campos de efeitos/fontes e slots limitados de avatar. As quatro migrations anteriores não foram alteradas. A suíte aplica as cinco em banco novo; um teste adicional aplica as quatro antigas, grava usuário/perfil/link legado, executa a quinta e confirma a preservação dos dados e os defaults novos.

O banco é PostgreSQL embarcado PGlite, acessado por Prisma/pg. Não há PostgreSQL nativo nem Docker disponíveis neste ambiente. Não foram testados backup/restauração reais, migration em base de produção, conexões nativas concorrentes, carga entre processos ou persistência de um host remoto.

## HTTP de produção — 39 checks

O smoke inicia `launch.mjs` em porta dinâmica e banco isolado. Confirma landing/CSS, headers, proteção de dashboard/exportação, cadastro/login, sessão, CSRF, salvamento, rascunho 404, publicação e HTML escapado. Também confirma cartões persistidos no HTML, validação de URL de cartão, limites Free, permissão Pro real no banco, tema/efeitos públicos e revogação após expiração. Testa Open Graph/no-store/404, views, redirect para URL armazenada, estatísticas com agregados reais, logout, exclusão com senha e remoção da página/imagem.

## Autenticação, uploads e segurança preservados

A suíte anterior continua verificando Better Auth com senha/sessão reais, enumeração genérica, confirmação de e-mail, reset, token reutilizado/expirado e revogação. Entrega de mensagens é capturada em memória; não há SMTP externo. Permanecem os testes de CSRF, limites atômicos, uploads Sharp/MIME/SVG/tamanho, estágios de imagens, unicidade e revisão otimista.

## Prévia, responsividade e acessibilidade: limite real

Foi tentado `sites-preview start` no checkout. A infraestrutura inicia o script Next com `--host 0.0.0.0 --port 4173 --strictPort`, opções de outro servidor que o Next recusa (`unknown option '--host'`). O processo terminou antes de uma página navegável. Não alteramos o aplicativo para contornar a infraestrutura.

Consequentemente **não foi executado teste de navegador, screenshot, breakpoint, leitor de tela ou aparelho físico**. Há CSS responsivo, estados de foco, rótulos, ordenação por botões, semântica de grupos e regras de movimento reduzido; a aceitação visual/mobile permanece pendente em ambiente que execute o Next normalmente. O seletor desktop amplia a prévia dentro do espaço disponível, sem emular um aparelho ou viewport de 1440 px.

## Produção e pendências

O aplicativo com contas precisa de host Node.js, PostgreSQL persistente, origem HTTPS, segredo exclusivo, confirmação de e-mail e SMTP completo. A demonstração hospedada anterior não contém automaticamente estas alterações. Não há banco remoto ou entrega real de e-mail configurados.

Proxy confiável, limites de borda, manutenção diária, backups e retenção, monitoramento, canais legais/suporte, regras aplicáveis a menores de idade e moderação/denúncias precisam ser definidos e verificados pelo operador antes de receber usuários. Termos e privacidade continuam rascunhos de desenvolvimento; não é uma declaração de conformidade jurídica.

Consulte [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md). Não há promessa de ausência de todas as falhas nem de prontidão operacional sem essas validações.
