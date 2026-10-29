# Homologação do VibePage em Render + Neon

Este Blueprint prepara **uma homologação pública e descartável**, não autoriza lançamento, não cria administrador e não configura pagamentos. A aplicação exige confirmação de e-mail e SMTP real. Não use a senha compartilhada no chat como senha de SMTP, banco ou conta administrativa.

## O que já está preparado

- `render.yaml` usa o runtime Node 24, a pasta `vibepage/` do monorepo, a branch `fix/vibepage-final-launch-blockers` e o serviço free `vibepage-staging`.
- O deploy automático de commits posteriores fica desligado. A primeira criação continua sendo uma ação manual no painel.
- A origem pública vem do `RENDER_EXTERNAL_URL` do próprio serviço e é usada durante o build e em runtime, preservando a validação do manifesto de origem.
- Na inicialização, o serviço executa migrations e seed idempotente antes de iniciar o app. A seed contém somente os temas do produto.
- `DATABASE_URL` e as credenciais SMTP ficam como campos privados do Render (`sync: false`); `BETTER_AUTH_SECRET` é gerada pelo Render.
- O healthcheck usa `/`, pois `/api/health` foi documentado para probes privados do proxy existente.

## Limites desta configuração

Render Free é adequado somente para uma avaliação técnica: a aplicação pode dormir e ter início lento, não tem disco persistente/SSH/jobs de pré-deploy, e o Render bloqueia saída SMTP nas portas 25, 465 e 587. O serviço free não deve ser tratado como produção. Caso o provedor SMTP disponibilize STARTTLS numa porta de saída permitida (por exemplo, 2525), a conectividade e a entrega ainda precisam ser testadas no serviço. Sem SMTP funcional, o launcher recusa iniciar com confirmação de e-mail habilitada. Não desative a confirmação para contornar isso.

O Neon é externo ao Blueprint. Não há provisionamento automático nem banco embutido. Escolha uma região Neon compatível com a região Oregon do serviço Render antes de criar o banco; a região do serviço Render não pode ser alterada depois da criação. Em `DATABASE_URL`, use a connection string **direct**, TLS (`sslmode=require`) e credenciais desse banco de homologação. O projeto usa essa mesma variável para runtime e Prisma Migrate. Não usar URL de pooler nesse campo: `prisma.config.ts` usa `DATABASE_URL` para migrations.

Dados de homologação podem ser perdidos. Render Free pode reiniciar o serviço, e um banco gratuito da Neon não substitui backup independente nem restore testado. Não inserir dados pessoais reais.

## Passos no painel

1. Conecte o GitHub ao Render e selecione `wll777z/project-IA`, branch `fix/vibepage-final-launch-blockers`.
2. Crie um Blueprint usando o caminho personalizado `vibepage/render.yaml`. Revise o único serviço listado; não crie Postgres no Render. Confirme que o plano selecionado é `free` e a região é `Oregon` antes de provisionar.
3. No Neon, crie um projeto/base **de homologação** na região compatível e copie a connection string direct com TLS. Guarde-a apenas no campo privado `DATABASE_URL` do Render.
4. Configure um remetente e credenciais SMTP próprias do provedor de e-mail. Preencha `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM` nos campos privados do Render. Render Free não acessa as portas 25, 465 e 587; confirme com o provedor a porta e STARTTLS suportados. Não use a senha da sua conta Render, Neon ou VibePage.
5. Verifique se `BETTER_AUTH_URL` foi resolvida para o `RENDER_EXTERNAL_URL` mostrado pelo Render. Para domínio próprio no futuro, altere conscientemente a origem para o domínio validado e faça rebuild, mantendo-a idêntica no build e runtime.
6. Só então, no painel, acione a primeira criação/deploy. A aplicação executará `npm ci`, build, migrations, seed e start pelo Blueprint. Acompanhe cada etapa e valide `/`, `/api/health`, cadastro sintético, recebimento de confirmação, login, reset e encerramento de sessões. `/api/health` será público nesta configuração Render; retorna apenas status genérico e nunca substitui monitoramento privado.
7. Registre região, commit implantado, resultado de entrega SMTP, teste das migrations, restore de backup em outro banco, políticas/contato de suporte e resultados móveis. Mantenha o intake de suporte desativado até preencher dados legais e a operação de moderação.

## Para usar a candidata no painel

O Render aceita Blueprints fora da raiz do repositório se o operador escolher o caminho personalizado durante a criação. Não é necessário mover o arquivo para a raiz do monorepo. A branch do Blueprint é a branch de revisão atual; nenhuma sincronização ou deploy é executado por esta preparação.

Para validar o arquivo localmente, instale uma ferramenta YAML confiável já disponível ou use o Render CLI v2.7.0+ com `render blueprints validate vibepage/render.yaml`. A validação local de sintaxe não comprova que o GitHub, Neon, SMTP ou o Blueprint real estejam conectados.

## Gates para além da homologação

Antes de um beta com usuários: escolher compute compatível com SMTP, conectar e testar entrega real, aprovar domínio HTTPS, estabelecer backup externo e restauração, monitoramento/alertas, dados legais/privacidade/suporte e teste em aparelhos físicos. Antes de lançamento público, cumprir também os gates de `PRODUCTION_GO_LIVE.md`. Pro e cobranças continuam desabilitados.
