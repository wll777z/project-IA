# Homologação da candidata de produção

Checklist atual e assinaturas pendentes: [docs/PRODUCTION_GO_LIVE.md](docs/PRODUCTION_GO_LIVE.md).

- [x] Partir do freeze `3e166f2`, preservar histórico, schema e oito migrations.
- [x] Limites de banco/SMTP, falhas sanitizadas e readiness testados localmente.
- [x] 214 testes, 111 HTTP, build, typecheck, lint e audit (0 achados) executados.
- [x] 60 snapshots em cinco larguras, demo hidratada e probe de desempenho local registrados.
- [x] Preparar SQL somente leitura, guard de restore vazio, backup criptografado e modelos systemd sem executá-los.
- [ ] Homologar PostgreSQL nativo, Docker/HTTPS/SMTP, persistência, proxy, backup/restauração e alertas.
- [ ] Definir administrador/operador, políticas, contatos públicos autorizados, suporte e manutenção reais.
- [ ] Aceitar dispositivos físicos, acessibilidade e jornada com entrega externa de e-mail.
- [ ] Aprovar separadamente demo pública, beta, público e futuro Pro comercial; sem merge/deploy automáticos.

Nome da branch não é aprovação de produção. **GO demo local; demonstração pública condicionada; NO-GO beta/público/Pro comercial.** Histórico abaixo preservado.

---

# Release freeze — gates atuais

- [x] Conferir GitHub e preservar referência `22ab34d`; cadeia histórica comprovada.
- [x] PR #8 draft separado: não há rota Pix, chave real, checkout ou ativação por pagamento na candidata.
- [x] Corrigir divergência reproduzida de origem pública entre build/runtime; manifesto e launcher recusam inconsistência.
- [x] Dashboard/editor copiam URL canônica fornecida pelo servidor.
- [x] 208 testes, build e 108 verificações HTTP locais aprovados; 9 verificações adicionais com origem HTTPS sintética.
- [x] Após o ensaio sintético, reconstruir explicitamente para localhost e repetir o smoke: 108 aprovadas.
- [ ] Aprovar PostgreSQL nativo, HTTPS/DNS/SMTP, backup/restore e persistência remotos.
- [ ] Aprovar proxy, monitoramento, cleanup/alertas, políticas e operação de suporte.
- [ ] Aprovar dispositivos físicos/leitor de tela e jornadas no domínio final.
- [ ] Revisão e autorização expressa antes de qualquer merge/deploy/beta real.

**GO apenas demo local/sintética; NO-GO beta, público e Pro comercial.** [Checklist completo](docs/RELEASE_FREEZE_CHECKLIST.md) · [Relatório do freeze](docs/RELEASE_FREEZE.md). Nenhum merge ou deploy.

---

# Polimento final da RC1

- [x] Conferir RC1 `2c1735e` e PR #8 no GitHub; PR de Pix permanece draft separado.
- [x] Preservar oito rotas do dashboard, acesso administrativo e recursos existentes.
- [x] Menu mobile nativo, contexto ativo, teclado e alvos de toque conferidos.
- [x] Guia inicial e estados de publicação/indisponibilidade sem notas privadas.
- [x] Sitemap curado sem banco/usernames; noindex e canonical/OG conferidos por HTTP.
- [x] Lint, typecheck, 203 testes, build e 96 verificações HTTP executados.
- [x] 36 snapshots em 360/390/768/1440 px sem overflow em Chrome desktop.
- [ ] Aprovar celulares físicos e leitor de tela; snapshots não validam jornada autenticada no browser.
- [ ] Configurar origem real no build/runtime e validar SEO no domínio final.
- [ ] Cumprir gates de PostgreSQL/SMTP/HTTPS/backups/operação antes de beta real.

Sem deploy, merge ou habilitação de vendas. [Relatório do polimento](docs/FINAL_POLISH_REVIEW.md). Os gates anteriores continuam abaixo.

---

# Gates da candidata 3.0.0-rc.1

27/10/2026. Escopo restrito a lançamento, sem novas funcionalidades visuais.

- [x] Candidata criada sobre auditoria mais recente, preservando ancestrais; sem merge de PRs.
- [x] Suporte/denúncias e fila administrativa reais no código, com autorização, revisão e retirada/restauração.
- [x] Dados legais configuráveis sem inventar responsável/contato/políticas; intake fechado por padrão.
- [x] Bootstrap administrador sem senha em argumentos/Git, mínimo 12 e confirmação de e-mail obrigatória.
- [x] Migration 8 aditiva testada em PGlite; sete SQL anteriores preservados.
- [x] Preparar Compose de homologação com PostgreSQL persistente, Node, Caddy HTTPS e SMTP obrigatório.
- [x] Testes locais 198/80 HTTP, lint, typecheck e build executados.
- [ ] Conectar hospedagem autorizada e fornecer domínio/SMTP/segredos no ambiente privado.
- [ ] Validar Compose, HTTPS real, IP do proxy e bloqueio da origem; configuração preparada não significa aprovado.
- [ ] Validar migrations em PostgreSQL nativo, concorrência, backup e restauração com dados sintéticos.
- [ ] Confirmar entrega SMTP e jornada completa no domínio real, incluindo reset, downgrade e exclusão.
- [ ] Criar administrador com nova senha de pelo menos 12 caracteres e confirmar e-mail; telefone é contato privado, não SMS.
- [ ] Definir responsável legal, contato público, idade, retenção/backups, rotina de suporte/denúncias, escala e prazos.
- [ ] Executar limpeza diariamente, monitoramento/alertas e recuperação/rollback.
- [ ] Aceitar celular físico, teclado, leitores de tela, downloads e compartilhamento.
- [ ] Aprovação expressa dos gates e lista de convidados antes de abrir beta fechado.

**NO-GO beta/público/Pro comercial.** Não publicar nem incorporar PRs automaticamente. [Runbook](docs/STAGING_RUNBOOK.md).

---

## Histórico da auditoria anterior

# Checklist de lançamento — VibePage 3.0 Next Level

Atualização: 27/10/2026. Esta revisão prepara o código; **não autoriza lançamento público** nem afirma que a infraestrutura já existe. Sem merge, deploy, contratação ou cobrança.

## Gate da auditoria final — 27/10/2026

Decisão atual: **NO-GO beta fechado com usuários reais / NO-GO lançamento público / NO-GO comercialização Pro**. GO somente para homologação local sintética. Evidências e critérios de mudança em `docs/FINAL_RELEASE_REVIEW.md`.

- [x] Base GitHub atual conferida: Next Level `07d1e8c`; PRs #1/#2 contidos no #3; #5 incremental. PR #4 repete CTA já presente. Nenhum merge automático.
- [x] Reproduzir e corrigir perda de aparência privada após save Free, e bloqueio de save com cartões legados excedentes.
- [x] Limitar Open Graph PNG e testar 429 no standalone.
- [x] Confirmar cookies HTTPS, bloqueio de sessão legada não verificada, XSS de blocos e revogação de QR/VibeCard/galeria ao despublicar em testes isolados.
- [x] Medir perfil de 12 cartões/100 links e APIs/PNGs locais; registrar ambiente PGlite e limitações.
- [ ] Aprovar PostgreSQL nativo vazio/upgrade/concorrência, backup e restauração em homologação autorizada.
- [ ] Aprovar confirmação/recuperação com SMTP externo e domínio HTTPS reais. Callbacks em memória não aprovam entrega.
- [ ] Concluir controle de acesso do beta, contatos/responsáveis, retenção e processo de denúncias/revisão/retirada.
- [ ] Validar Safari/iOS, Chrome/Android, leitores de tela, movimento reduzido do sistema e rede móvel lenta.
- [ ] Validar proxy/limites por cliente, persistência, alertas, recuperação e rollback com responsáveis.
- [ ] Para vender Pro: integração de cobrança autorizada, condições comerciais e operação de suporte/cancelamento; não há checkout ativo.

## Novidades Next Level

- [x] Comparar branches e partir da Ultimate Release, mantendo 13 temas/cartões/efeitos.
- [x] Studio, blocos, modelos, coleções, agenda, VibeCard/QR e analytics com regras no servidor.
- [x] Preservar Studio/blocos/galeria/coleções privados no downgrade; impedir aplicação premium pública.
- [x] Testar QR por decodificação independente, PNGs, autorização, revisão, agregação e migration aditiva.
- [x] Incluir novos dados na exportação/exclusão; atualizar a explicação de privacidade.
- [ ] Ensaiar migration `202610270003_next_level` no PostgreSQL nativo de homologação com backup/restauração.
- [ ] Validar agenda na origem real (fuso IANA, UTC, limites, cancelamento e início/fim), QR canônico e PNGs em dispositivos alvo.
- [ ] Validar Web Share, clipboard e downloads no Safari/iOS e Chrome/Android. Há fallback por download/cópia; APIs dependem do navegador.
- [ ] Medir CPU/memória da geração PNG, limites compartilhados, galeria e tempo de renderização com o volume máximo permitido.
- [ ] Revisar DST/horários ambíguos com o operador; a UI mostra UTC para conferência antes de salvar.

## Código e dados

- [x] Preservar correções de `fix/vibepage-launch-readiness` (PR #1).
- [x] Corrigir validação de títulos com controles incompatíveis com PostgreSQL.
- [x] Restringir imagem de fundo a Pro no upload, write, DTO, renderer e mídia; expiração preserva arquivo privado do dono.
- [x] Catálogo com 13 temas e presets validados, incluindo Aurora Blue, sem remover os cinco originais.
- [x] Corrigir IDs de links/cartões em HTTP/LAN e preservar customizações da demo ao recarregar o mesmo tema.
- [x] Persistir cartões, efeitos e fontes com validação no servidor.
- [x] Aplicar limites Free/Pro, propriedade dos IDs, transação e revisão otimista.
- [x] Manter dados excedentes ao expirar Pro; limitar somente a exibição pública. O save Free mantém cartões legados excedentes e suas apresentações Pro privadas; incluir IDs novos acima de três é recusado.
- [x] Normalizar avatares dos cartões, limitar armazenamento e proteger imagens privadas e cartões ocultos por plano.
- [x] Incluir cartões na exportação e na exclusão em cascata.
- [x] Migration aditiva testada em PGlite com perfil e links legados, sem alterar as quatro migrations anteriores.
- [x] Testar autenticação, recuperação por callback em memória, CSRF, autorização, uploads, URLs, XSS escapado, publicação e expiração de plano.
- [x] Executar lint, typecheck, testes, build, smoke HTTP e auditoria de dependências. Evidências em `VALIDATION.md`.
- [x] Incluir controles acessíveis por teclado, rótulos, reordenação por botões, pausa dos efeitos e `prefers-reduced-motion`.
- [x] Conferir edição, criação/ordenação de cartão, save/recarga, pausa de efeitos e controles da landing na demo exportada.
- [ ] Completar revisão em 360, 390, 768 e 1440 px, teclado e leitor de tela. Houve conferência da demo exportada em desktop e frame de 390 px, sem overflow persistente nesse cenário. Isso não cobre todos os breakpoints nem aparelho físico ou leitor de tela.
- [ ] Validar desempenho de animações em celular de entrada e impacto com 12 cartões/100 links.
- [ ] Validar navegação Voltar do navegador com alterações pendentes. Há proteção para recarregar/fechar e confirmação ao clicar em links; não há interceptação universal do histórico do navegador.

## Antes de aplicar em um banco de produção

1. Usar PostgreSQL nativo compatível e um ambiente de homologação independente. Criar uma cópia de segurança, testar restauração em outro banco e confirmar que o operador consegue recuperar o serviço.
2. Instalar com `npm ci`, gerar o client (`npm run db:generate`), executar `npm run db:migrate` e `npm run db:seed`. A quinta migration adiciona `GamerCard`, campos de aparência e slots de avatares; a sexta registra Aurora Blue; a sétima adiciona Studio/blocos/coleções/agenda/contagens de cartões e slots de galeria, sem apagar perfis ou links.
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

## Aceitação adicional 3.0 após provisionamento

Publicar quatro layouts, testar seções/colunas e reordenação por teclado, criar conquista autodeclarada e galeria, verificar mídia oculta anonimamente. Salvar duas coleções, aplicar/desfazer com o editor aberto em outra aba e confirmar conflito de revisão. Agendar intervalo curto em fuso explícito e verificar transição sem aba aberta. Expirar Pro: confirmar fallback, CSV negado e dados privados preservados; cancelar agenda ainda como Free. Gerar cinco VibeCards e decodificar os QRs no domínio final. Conferir cliques de cartões somente no redirect público, comparação e CSV sem fórmulas executáveis. Exportar/excluir a conta e verificar cascatas. Esta aceitação em infraestrutura real ainda não foi executada.
