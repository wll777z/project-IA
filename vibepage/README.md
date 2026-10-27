# VibePage

## VibePage 3.0 — Next Level

A branch `feature/vibepage-next-level` parte de `feature/vibepage-ultimate-release` (`e8cb1f6`), a versão mais completa conferida. Preserva os 13 temas, cartões gamer, efeitos, autenticação e correções existentes. O inventário e a comparação de branches estão em [docs/NEXT_LEVEL_INVENTORY.md](docs/NEXT_LEVEL_INVENTORY.md). Mudanças somente dentro de `vibepage/`; sem merge ou deploy nesta entrega.

Novidades funcionais:

- **Profile Studio 3.0:** quatro layouts, seções ordenáveis por teclado, largura, colunas, grade de cartões, espaçamento e visibilidade. Usa o renderer público existente e salva com revisão otimista.
- **Sete tipos de bloco:** favoritos, conquistas autodeclaradas, projetos, galeria, redes sociais, sobre mim e destaque vinculado a cartão existente. Até 16 blocos Pro; galeria com até seis imagens por bloco e 18 por conta.
- **Sete modelos originais:** categorias Gamer, Streamer, Criador, Minimalista, Futurista, Anime Inspired e Retro. Filtro, prévia completa e restauração de aparência preservando o conteúdo atual. Quiet Focus é Free.
- **Coleções:** salvar, duplicar, renomear, excluir com confirmação, pré-visualizar, aplicar e desfazer a última troca. Até dez coleções Pro; não duplicam links, cartões ou conteúdo dos blocos.
- **Temporadas:** até cinco intervalos futuros sem sobreposição, duração de até 90 dias, início em até um ano e até vinte registros totais. Datas são armazenadas como instantes UTC com fuso IANA. O servidor resolve a aparência ativa em cada leitura; não depende de cron ou aba aberta. Ao terminar, reaparece a aparência padrão atual.
- **Central de compartilhamento:** URL canônica, QR PNG local, cinco estilos de VibeCard PNG 1280×720 (Minimal Free; Neon, Holographic, Galaxy e Retro Pro), estilo persistido, download e Web Share quando disponível. Somente perfis publicados geram imagens.
- **Analytics Pro:** comparação de 7/30 dias com período anterior, histórico de 90 dias, resumo semanal, ranking e CSV protegido contra fórmulas. Cliques de cartões passam por redirect seguro e são contados separadamente a partir desta versão.
- **Dashboard:** acessos ao Studio, aparências, compartilhamento, analytics e comparação real Free/Pro em `/demo/pro`. A demo testa recursos visuais sem promover a conta real.

Coleções guardam tema, cores, fontes, layout, botões, efeitos, configurações visuais do avatar, apresentação dos cartões e organização dos blocos. Avatar, imagens, conteúdo e links continuam vinculados ao perfil atual; não são copiados para snapshots. Trocar aparência não restaura conteúdo que você apagou. Uma temporada também usa o conteúdo atual.

Ao expirar Pro, Studio/blocos/galeria/estilos premium deixam de ser públicos, mas suas configurações e arquivos permanecem privados. Um save Free não apaga os novos dados privados. Agendamentos ficam suspensos e o dono pode cancelá-los. Aplicar coleções, criar temporadas e personalizar Studio exigem Pro no servidor.

Consulte a decisão atual em [docs/FINAL_RELEASE_REVIEW.md](docs/FINAL_RELEASE_REVIEW.md). Consulte [VALIDATION.md](VALIDATION.md), [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) e [docs/RELEASE_AUDIT.md](docs/RELEASE_AUDIT.md). Há pendências de infraestrutura e operação que impedem afirmar lançamento público concluído.

MVP de páginas de perfil para gamers, comunidades e criadores, com identidade visual própria. Next.js App Router, TypeScript, Tailwind, PostgreSQL, Prisma, Better Auth, Zod, React Hook Form, Motion e Lucide.

**O aplicativo completo roda com PostgreSQL. O endereço publicado no ChatGPT Sites é uma demonstração interativa, sem backend de contas.** Não foram contratados serviços, comprados domínios, integrados pagamentos ou alterados arquivos do `nexa-ai`.

## Começar no Windows

Instale Node.js LTS 24 e Docker Desktop. Abra o Docker Desktop. Extraia o ZIP, abra um terminal na pasta `vibepage` e execute:

```powershell
npm ci
npm run setup
npm run dev
```

Abra **http://localhost:3000**. O setup cria `.env`, gera uma chave de autenticação aleatória, inicia o PostgreSQL local e aplica migrations e seed. Não cria conta padrão. Cadastre-se, faça login, abra **Editar perfil**, escolha o username, adicione links, marque **Perfil público** e salve. A página ficará em `http://localhost:3000/seu_username`.

O setup também funciona no Linux/macOS com Docker Compose disponível. Sem Docker, configure `DATABASE_URL` para um PostgreSQL existente e use os comandos manuais abaixo.

## Configuração manual

```bash
npm ci
# Copie .env.example para .env e preencha BETTER_AUTH_SECRET com uma chave aleatória:
node -e "console.log(require('crypto').randomBytes(40).toString('base64url'))"
docker compose up -d --wait
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

No PowerShell a cópia é `Copy-Item .env.example .env`; no Linux/macOS, `cp .env.example .env`. Nunca compartilhe `.env`. O banco do Compose fica em `127.0.0.1:5432`; a senha padrão é somente para desenvolvimento. Se alterar `POSTGRES_PASSWORD`, atualize `DATABASE_URL`. Para parar preservando os dados, use `docker compose stop`.

## O que está implementado

- Landing com demonstração interativa do renderer público e do editor, galeria de 13 temas e presets ilustrativos claramente identificados.
- Cadastro, login, logout, sessões persistentes, proteção no servidor, exclusão com senha e recuperação de senha quando SMTP estiver configurado.
- Dashboard com totais, status de publicação, links, compartilhamento e prévia.
- Editor com username único, nome público, bio, avatar, fundo, cores, temas, até 100 links, ordenação, prévia ao vivo e salvamento transacional.
- Cartões Roblox, Discord, Minecraft (Java/Bedrock), Fortnite, Valorant, Free Fire, League of Legends, Pokémon e personalizados. Nome, handle, detalhe, link HTTPS opcional, avatar normalizado, cor, ícone e reordenação. Sem integração oficial ou status online.
- Seis visuais de cartão, layouts compacto/banner, bordas luminosas e animação; oito efeitos de fundo, cinco de avatar, seis de botões e quatro entradas. Efeitos opcionais, pausa manual, movimento reduzido e pausa quando fora da tela/aba oculta.
- Editor em nove seções, prévia mobile/desktop com o mesmo renderer, alterações pendentes, bloqueio dos campos durante save/upload e redefinição de aparência com confirmação.
- Controle de revisão para impedir que uma aba antiga sobrescreva alterações novas. Dados da conta e perfis de outros usuários não podem ser editados pelo cliente.
- Uploads com verificação real do formato, limite de 4 MB e 16 milhões de pixels, normalização WebP, remoção de metadados e limite de armazenamento. A imagem publicada permanece até salvar a substituta.
- Páginas `/username`, metadados Open Graph/Twitter, imagem de compartilhamento gerada e links externos seguros.
- Visitas e cliques agregados por dia, sem IP, localização ou identificadores de visitante na base de estatísticas.
- Free/Pro controlado no servidor, expiração de permissão, temas premium, animações, botões, cor de fundo avançada, remoção da marca e detalhamento de estatísticas.
- Exportação dos dados da conta em JSON, exclusão em cascata, páginas de privacidade e termos para desenvolvimento.
- Dockerfile de produção, Compose para banco local, script de preparação e workflow de verificações.

## Free e Pro

Free: um perfil, até 100 links, 3 cartões (Neon Gamer/Minimal Dark compactos), username disponível, cores de destaque, uploads, temas Midnight Purple/Minimal Black/Ice Blue, marca e total de visitas.

Pro: Studio, blocos, galeria, coleções, agenda sazonal, quatro estilos adicionais de VibeCard, analytics de 90 dias/CSV, até 12 cartões, seis estilos e banner, oito temas adicionais além de Cyber Neon/Pink Dream, efeitos e fontes locais, animações, formato de botões, fundo personalizado, remoção da marca, cliques e detalhamento diário de 30 dias e seleção de gráfico dos últimos 7/30 dias. R$ 9,90/mês continua sendo apenas uma sugestão de preço: **não há checkout nem cobrança**.

Não existe endpoint para o usuário promover a própria conta. O administrador pode conceder ou revogar uma permissão pelo terminal, sem registrar pagamento:

```bash
npm run admin:plan -- pessoa@exemplo.com PRO 2026-12-31
npm run admin:plan -- pessoa@exemplo.com FREE
```

A expiração é validada em cada leitura pública, gravação e consulta de estatísticas. Um perfil que perde Pro volta a exibir tema gratuito e marca; o editor normaliza as opções visuais. Cartões excedentes permanecem no banco e no editor, com aviso; só os três primeiros ficam públicos no Free. Cartões legados excedentes podem ser mantidos ao salvar; só os três primeiros ficam públicos. Enquanto houver mais de três, o servidor não permite incluir IDs novos. Personalizações Pro não alteradas permanecem privadas para uma reativação autorizada. As imagens desses cartões ocultos também exigem sessão do dono.

## Validação e execução de produção

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:http
npm run format:check
npm audit
npm start
```

`test:http` exige um build atual e inicia uma instância isolada do Next e PostgreSQL embarcado PGlite para testar a aplicação por HTTP. Não usa nem modifica seu banco de desenvolvimento. `npm test` testa regras, autenticação, APIs, uploads, permissões e agregados com Prisma e PGlite reais, sem mocks de senha ou sessão.

Veja [VALIDATION.md](VALIDATION.md) para os resultados reais e [docs/LAUNCH_AUDIT.md](docs/LAUNCH_AUDIT.md) para os achados e bloqueios de lançamento. O workflow está em `../.github/workflows/vibepage.yml`, na raiz do repositório. Ele executa as verificações dentro de `vibepage/`.

## E-mail e confirmação de conta

No desenvolvimento local, `REQUIRE_EMAIL_VERIFICATION=false` permite testar sem serviço de e-mail. Sem SMTP, a recuperação permanece indisponível.

Em uma origem pública, configure `REQUIRE_EMAIL_VERIFICATION=true`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM`. O cadastro envia um link, o login só libera a conta após a confirmação e uma nova tentativa de login com a senha correta pode reenviar a confirmação. Porta 465 usa TLS; outras portas exigem STARTTLS. Não há envio de marketing.

O launcher de produção recusa origens públicas sem HTTPS, chave exclusiva, confirmação habilitada e SMTP completo. Isso inclui contas existentes: usuários sem e-mail confirmado precisam confirmar antes de realizar operações autenticadas pela API. O serviço de e-mail, DNS e a entrega real devem ser configurados e testados pelo operador; os testes automatizados capturam as mensagens em memória, sem enviá-las.

## Publicação completa

Para disponibilizar contas e perfis reais na internet é necessário um ambiente Node.js e um PostgreSQL hospedado. **Não foi provisionado um banco remoto.** O ChatGPT Sites atual hospeda somente a landing e a demonstração; ele não executa este backend PostgreSQL via conexão TCP.

O código inclui `Dockerfile` com saída standalone do Next. Em um host de sua escolha:

1. Configure `DATABASE_URL`, `BETTER_AUTH_URL` com a origem HTTPS exata, uma chave aleatória exclusiva em `BETTER_AUTH_SECRET`, `REQUIRE_EMAIL_VERIFICATION=true` e SMTP completo. Consulte `.env.example`.
2. Aplique migrations com `npm run db:migrate` e seed com `npm run db:seed` em um ambiente com dependências de desenvolvimento instaladas.
3. Execute `npm run build` e `npm start`, ou construa e execute o Dockerfile passando as variáveis em tempo de execução. O build pode usar uma chave efêmera somente para compilação; o launcher recusa execução pública com configuração incompleta ou chaves de exemplo. Não inicie `server.js` diretamente: `npm start` e o Dockerfile usam `launch.mjs`, que valida a configuração antes de abrir o servidor. `npm start` também carrega o `.env` local quando existir.
4. Configure proxy confiável, backups, operação, e-mail e os dados legais antes de receber público real.

Nenhum plano pago é necessário para rodar localmente. A escolha e a disponibilidade de planos de hospedagem dependem do provedor e não foram presumidas.

## Segurança e limites

- Senhas scrypt e sessões no banco, cookies HttpOnly/SameSite e Secure com HTTPS. Recuperação revoga sessões anteriores. Cadastro duplicado não revela existência da conta; login usa erro genérico. Produção pública exige confirmação de e-mail.
- Validação no servidor e no formulário; payload de autenticação limitado a 16 KB e perfil a 64 KB. Não há HTML ou JavaScript arbitrário. React escapa os textos.
- URLs somente HTTPS público, sem credenciais, IPs literais/locais ou portas alternativas. O redirecionamento usa somente o destino armazenado, não uma URL recebida na query. Não fazemos fetch de URLs de usuários. A validação sintática não detecta phishing em domínios públicos; moderação e denúncias serão necessárias para lançamento amplo.
- Todos os writes autenticados verificam a origem exata. Rate limits ficam no banco e resistem a requisições concorrentes. Limites: login 5/min, cadastro e recuperação 3/min, gravação de perfil 30/min, upload 8/min, views 60/min, cliques compartilhados 90/min, coleções 20/min, agenda 15/min, QR 30/min, VibeCard 12/min e CSV 10/min.
- Sem `AUTH_IP_HEADER`, os limites públicos são compartilhados por endpoint para não confiar em cabeçalhos falsificados. Em produção configure somente um cabeçalho sobrescrito pelo proxy e impeça acesso direto à origem. O limitador da biblioteca pode manter IP temporariamente para segurança; os limites do aplicativo usam HMAC. Nada disso é usado como analytics individual.
- Imagens permitidas: PNG, JPEG e WebP estáticos. SVG/GIF e dados incompatíveis com o MIME são recusados. No máximo quatro imagens de perfil (ativa e rascunho por tipo) vinte avatares de cartões e dezoito imagens de galeria Pro normalizados de até 1 MB cada. Avatares de cartões sem uso são liberados ao salvar o perfil; a exclusão da conta remove todos. Imagens não publicadas exigem sessão do dono; exclusão de conta elimina os arquivos do banco.
- Os números são aproximações, não visitantes únicos. Cada aba tenta registrar uma visita diária por perfil usando sessionStorage. Limites, bloqueadores e bots alteram a contagem. Cliques contam apenas os links personalizados que passam por `/go/`; cartões gamer publicados usam `/go/card/:id` e possuem contagem separada a partir desta versão. Links dos blocos não são rastreados. Excluir um link/cartão remove suas contagens individuais em cascata; não há reconstrução histórica de elementos removidos. Cliques são totais; não são garantia de pessoa real ou conversão. Dados diários ficam em UTC.
- Execute `npm run db:cleanup` diariamente para remover sessões, tokens e limites expirados. Não criamos agendamento externo.
- Imagens de compartilhamento usam `no-store` e retornam 404 para rascunhos e contas removidas. Cópias já baixadas ou armazenadas por terceiros não podem ser revogadas pelo site. `Referrer-Policy: no-referrer` impede que URLs de confirmação/recuperação sejam enviadas como Referer.
- CSP restringe recursos ao próprio site e impede frames e objetos embutidos. Scripts/styles inline necessários ao Next permanecem permitidos; CSP com nonce é um endurecimento futuro.
- Termos e privacidade ainda precisam de identificação do controlador, contato, política de backups e definições para público menor de idade antes de lançamento real.
- O npm avisa que ESLint 9 está fora de suporte. Foi mantido por compatibilidade com os plugins do Next instalados. O lint passa; atualize o conjunto antes de lançamento amplo.

## Estrutura

| Caminho                                      | Conteúdo                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/app/page.tsx`, `src/app/demo/`          | Landing e demonstração do editor                                               |
| `src/app/(auth)/`, `src/lib/auth.ts`         | Autenticação, sessão e recuperação                                             |
| `src/app/dashboard/`                         | Dashboard, editor, estatísticas e conta                                        |
| `src/app/[username]/`, `src/app/go/`         | Perfis públicos, metadados, compartilhamento e redirects                       |
| `src/app/api/`                               | Perfil, uploads, mídia, views, stats e exportação                              |
| `src/components/`                            | Componentes do editor, perfil, formulários e gráfico acessível                 |
| `src/lib/`                                   | Validação, regras de acesso, permissões, limites, perfis, temas e estatísticas |
| `prisma/`                                    | Schema, sete migrations SQL, índices, checks e seed                            |
| `tests/`                                     | Suítes e smoke HTTP com banco isolado                                          |
| `scripts/`                                   | Setup, manutenção, permissões administrativas e exportação da demo             |
| `compose.yaml`, `Dockerfile`, `.env.example` | Execução local e preparação para hospedagem                                    |
| `docs/REFERENCE.md`                          | O que foi aproveitado do async-labs/saas                                       |

## Referência e Git

O repositório [async-labs/saas](https://github.com/async-labs/saas), licença MIT, foi consultado pelo plugin GitHub. Aproveitamos padrões de separação entre interface, API e domínio; não copiamos código, cobranças, mensagens ou dependências. Detalhes em `docs/REFERENCE.md`.

O aplicativo está em `vibepage/` no repositório https://github.com/wll777z/project-IA. O PastaPronta foi preservado na raiz. Clone o repositório, rode `cd project-IA/vibepage` e siga os comandos acima. O histórico de desenvolvimento local possui commits por etapa; nenhum arquivo do `nexa-ai` foi alterado. A demonstração online usa seu repositório de hospedagem separado.

## Revisão de lançamento

A branch `fix/vibepage-launch-readiness` parte da `main` e mantém o visual existente. A auditoria corrige URLs parciais que quebravam o editor, canonicalização de URLs, condição de corrida entre donos de links, privacidade de imagens Open Graph e configuração de autenticação pública. Links antigos agora considerados inválidos permanecem editáveis pelo dono e são omitidos da página pública até correção. Não há mudança de schema nem migration nova nesta revisão. Não houve merge ou deploy.

## Atualizar uma instalação existente

Faça backup e valide restauração antes de atualizar um ambiente com dados. Em homologação, rode `npm ci`, `npm run db:migrate`, `npm run db:seed`, `npm run build` e `npm start`. As migrations `202610270001_ultimate`, `202610270002_aurora_blue` e `202610270003_next_level` são aditivas e conservam perfis, links e estatísticas; o teste automatizado confirma o upgrade de um perfil legado em PGlite. PostgreSQL nativo e concorrência entre instâncias ainda precisam de validação própria. Não remova as novas tabelas para voltar ao código anterior.

Os temas novos são Voltage City (amarelo elétrico, identidade original), Galaxy Purple, Sakura Dream, Ice Crystal, Crimson Shadow, Retro Arcade, Holographic e Aurora Blue. Os cinco originais foram preservados. `src/lib/themes.ts` contém as paletas e a classificação Free/Pro; `src/lib/customization.ts` contém opções e limites. Nenhum recurso faz fetch de links ou avatares externos.

A demo é identificada como local e não cria conta ou assinatura. Escolher um tema na landing abre `/demo?theme=…`; a demo migra as escolhas antigas locais adicionando os campos novos. O aplicativo com banco usa as APIs existentes. A prévia hospedada anterior continua sem as novidades Next Level até um deploy explicitamente autorizado.

O editor usa Web Crypto para IDs também nas prévias HTTP/LAN que não expõem `randomUUID`, sem recorrer a `Math.random`. Isso não substitui HTTPS em produção nem o controle de propriedade no servidor. Recarregar um link `/demo?theme=…` do mesmo tema preserva cores, efeitos e estilos já salvos. O exportador da demo preserva o JavaScript da landing; rotas de login/cadastro na exportação estática direcionam à demonstração identificada, sem simular contas.

## Arquivos e migration Next Level

| Área                | Principais arquivos                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Studio/blocos       | `src/lib/studio-schema.ts`, `src/lib/validation.ts`, `src/lib/profiles.ts`, `src/components/studio-editor.tsx`, `src/components/profile-blocks.tsx`, `src/components/profile-view.tsx` |
| Modelos             | `src/lib/profile-templates.ts`, `tests/studio-templates.test.ts`                                                                                                                       |
| Coleções/temporadas | `src/lib/appearance-config.ts`, `src/lib/appearance-store.ts`, `src/components/appearance-manager.tsx`, `src/app/api/appearances/`, `src/app/api/schedules/`                           |
| Compartilhamento    | `src/lib/sharing.tsx`, `src/components/share-center.tsx`, `src/app/api/qr/`, `src/app/api/vibecard/`, `src/app/api/profile/vibecard-style/`                                            |
| Analytics           | `src/lib/analytics-advanced.ts`, `src/components/advanced-analytics.tsx`, `src/app/go/card/`, `src/app/api/stats/advanced/`, `src/app/api/stats/export/`                               |
| Dashboard           | `src/app/dashboard/aparencias/`, `src/app/dashboard/compartilhar/`, `src/app/dashboard/analytics/`, `src/app/demo/pro/`                                                                |
| Regressões          | `tests/studio.integration.test.ts`, `tests/collections.integration.test.ts`, `tests/sharing-analytics.integration.test.ts`, `tests/ultimate-migration.test.ts`, `tests/http-smoke.ts`  |

A sétima migration adiciona `ProfileBlock`, `SavedAppearance`, `AppearanceSchedule`, `CardClick`, `Profile.studio`, `Profile.previousAppearance` e `Profile.vibeCardStyle`, com índices, checks e cascatas. Expande os tipos/slots válidos de upload para a galeria sem apagar arquivos. Não modifica migrations anteriores nem reserva novos usernames raiz. Novas páginas ficam sob `/dashboard` e `/demo`.

Dependências adicionadas com versões exatas: `qrcode@1.5.4`, `@types/qrcode@1.5.6` e `jsqr@1.4.0` (decodificação independente nos testes). Referências oficiais: [node-qrcode](https://github.com/soldair/node-qrcode), [jsQR](https://github.com/cozmo/jsQR). QR não depende de serviço externo.

No editor, **Salvar alterações** fica na barra superior durante a rolagem. **Ver prévia / Voltar a editar** evita procurar o outro painel. No celular, use **Editar seção** para escolher Perfil, Links, Cartões, Studio e as demais opções; no desktop as abas permanecem. Erros de validação abrem a seção correspondente.

A auditoria final não fez merge ou deploy. O resultado atual é **NO-GO para beta com usuários reais, lançamento público e venda do Pro** até concluir os bloqueadores operacionais registrados no relatório. A demo hospedada não substitui a homologação Node/PostgreSQL/SMTP.
