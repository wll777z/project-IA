# Checklist de lançamento — VibePage Ultimate

Atualização: 27/10/2026. Esta revisão prepara o código; **não autoriza lançamento público** nem afirma que a infraestrutura já existe. Sem merge, deploy, contratação ou cobrança.

## Código e dados

- [x] Preservar correções de `fix/vibepage-launch-readiness` (PR #1).
- [x] Corrigir validação de títulos com controles incompatíveis com PostgreSQL.
- [x] Persistir cartões, efeitos e fontes com validação no servidor.
- [x] Aplicar limites Free/Pro, propriedade dos IDs, transação e revisão otimista.
- [x] Manter dados excedentes ao expirar Pro; limitar somente a exibição pública. No editor, a remoção dos excedentes exige ação explícita antes de salvar.
- [x] Normalizar avatares dos cartões, limitar armazenamento e proteger imagens privadas e cartões ocultos por plano.
- [x] Incluir cartões na exportação e na exclusão em cascata.
- [x] Migration aditiva testada em PGlite com perfil e links legados, sem alterar as quatro migrations anteriores.
- [x] Testar autenticação, recuperação por callback em memória, CSRF, autorização, uploads, URLs, XSS escapado, publicação e expiração de plano.
- [x] Executar lint, typecheck, testes, build, smoke HTTP e auditoria de dependências. Evidências em `VALIDATION.md`.
- [x] Incluir controles acessíveis por teclado, rótulos, reordenação por botões, pausa dos efeitos e `prefers-reduced-motion`.
- [ ] Revisar em navegador real em 360, 390, 768 e 1440 px, teclado e leitor de tela. A infraestrutura de prévia disponível falhou antes de abrir o Next; não se trata de um teste aprovado.
- [ ] Validar desempenho de animações em celular de entrada e impacto com 12 cartões/100 links.
- [ ] Validar navegação Voltar do navegador com alterações pendentes. Há proteção para recarregar/fechar e confirmação ao clicar em links; não há interceptação universal do histórico do navegador.

## Antes de aplicar em um banco de produção

1. Usar PostgreSQL nativo compatível e um ambiente de homologação independente. Criar uma cópia de segurança, testar restauração em outro banco e confirmar que o operador consegue recuperar o serviço.
2. Instalar com `npm ci`, gerar o client (`npm run db:generate`), executar `npm run db:migrate` e `npm run db:seed`. A quinta migration adiciona `GamerCard`, campos de aparência e slots de avatares; não remove perfis ou links.
3. Testar cadastro, confirmação, login, recuperação, upload, edição, publicação, expiração Pro, exportação e exclusão em homologação com PostgreSQL nativo.
4. Testar concorrência entre processos, carga e os limites compartilhados de autenticação. PGlite não substitui essa validação.
5. Em rollback do aplicativo, conservar as novas tabelas/colunas. Não apagar dados nem executar migrations destrutivas para voltar ao código anterior.

- [ ] Banco persistente, conexão segura, usuário de banco com privilégios mínimos necessários e credenciais fora do Git.
- [ ] Backups automatizados, criptografados e com acesso restrito; política de retenção, RPO/RTO e teste periódico de restauração.
- [ ] Exemplo de ferramenta: `pg_dump --format=custom --file=vibepage.backup "$DATABASE_URL"`. Executar somente no ambiente administrado; este comando não foi executado aqui. Restaurar primeiro em banco de teste com `pg_restore --no-owner --no-privileges --dbname=DATABASE_DE_TESTE vibepage.backup`.

## Origem, sessão, proxy e e-mail

- [ ] `DATABASE_URL` real; `BETTER_AUTH_URL` com origem HTTPS exata; `BETTER_AUTH_SECRET` exclusivo e aleatório; `REQUIRE_EMAIL_VERIFICATION=true`; SMTP completo. Use `.env.example`, sem reutilizar chaves de teste.
- [ ] Iniciar via `npm start` ou Dockerfile (`launch.mjs`); nunca contornar a validação iniciando `server.js` diretamente.
- [ ] Proxy termina HTTPS, limita corpos/timeouts/conexões e sobrescreve `AUTH_IP_HEADER`; impedir acesso direto à origem. Deixar vazio enquanto não houver proxy confiável.
- [ ] Testar cookies Secure/HttpOnly/SameSite, origem externa recusada, logout e tokens expirados no domínio real.
- [ ] Confirmar SPF/DKIM/DMARC, endereço remetente, entrega em provedores reais, confirmação de conta e recuperação de senha. Os testes locais não enviam mensagens.
- [ ] Agendar `npm run db:cleanup` diariamente. A revisão não criou agendamento externo.
- [ ] Monitorar disponibilidade, erros 5xx/429, latência, banco, disco, e-mail e crescimento dos uploads. Não registrar senhas, cookies, tokens ou conteúdo privado em logs.

## Operação e requisitos do produto

- [ ] Identificar controlador, contatos de privacidade/suporte e operadores; concluir textos legais e política de retenção de backups.
- [ ] Definir público etário, tratamento de menores de idade e fluxo adequado à operação e às regras aplicáveis. Não inferir idade pela aparência ou nome do perfil.
- [ ] Definir denúncias, resposta a abuso, phishing, uso indevido de marca e remoção de conteúdo; validar capacidade operacional antes de abrir cadastros amplos.
- [ ] Revisar segurança e compatibilidade das dependências regularmente. `npm audit` sem achados não garante ausência de falhas; ESLint 9 ainda exige atualização coordenada com o Next.
- [x] Não usar status Discord, estatísticas de jogos ou verificações de identidade fictícias. Dados dos cartões são autodeclarados.
- [x] Sem pagamentos ou checkout. Pro continua concedido somente pelo administrador; R$ 9,90/mês é sugestão, sem assinatura à venda.

## Teste de aceitação após provisionamento

Criar uma conta nova, confirmar e-mail, publicar com 3 cartões e links, verificar de sessão anônima, despublicar e confirmar 404 e privacidade dos avatares. Conceder Pro pelo script administrativo, salvar 12 cartões e efeitos, expirar a permissão e confirmar o fallback. Restaurar o acesso apenas se autorizado, exportar os dados, excluir a conta e verificar cascatas. Fazer o mesmo em mobile. Registrar evidências sem expor credenciais.
