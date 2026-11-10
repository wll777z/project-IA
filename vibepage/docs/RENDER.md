# Publicar o VibePage na Render

A configuração está em [`render.yaml`](../../render.yaml), na raiz do repositório. Ela publica a aplicação completa, incluindo autenticação, perfis e PostgreSQL.

1. Entre na sua conta e abra [criar Blueprint na Render](https://dashboard.render.com/blueprint/new?repo=https%3A%2F%2Fgithub.com%2Fwll777z%2Fproject-IA).
2. Autorize o acesso ao repositório `wll777z/project-IA`, selecione a branch `main` e o arquivo `render.yaml` da raiz.
3. Confira os recursos: serviço web `vibepage` e PostgreSQL `vibepage-db`. A configuração solicita o plano `free` para ambos. Confira a disponibilidade, os limites e a expiração do banco gratuito no painel; não confirme recursos pagos sem decidir por isso. O serviço gratuito pode hibernar quando ocioso.
4. Confirme a criação e acompanhe os logs até o serviço ficar **Live**. Abra o endereço HTTPS apresentado no serviço web. O nome disponível na sua conta determina a URL final; não presuma que será `vibepage.onrender.com`.
5. Nesse endereço, crie uma conta, entre, salve um perfil público e abra a URL desse perfil em outra janela para verificar a persistência.

O build instala as dependências e gera o Prisma/Next.js. A inicialização aplica migrations, cadastra os cinco temas de forma idempotente e inicia o servidor. Se migrations ou seed falharem, a inicialização para; não é usado um banco de demonstração.

`DATABASE_URL` vem da conexão interna do banco. `BETTER_AUTH_SECRET` é gerado pela Render; preserve-o entre publicações. A origem de autenticação usa `RENDER_EXTERNAL_URL`, disponibilizada pela Render. Não copie a configuração local de `localhost`. Ao configurar domínio próprio, defina `BETTER_AUTH_URL` com a origem HTTPS exata e reinicie o serviço.

O banco aceita conexões internas dos serviços na Render; o acesso externo está desabilitado. Imagens e dados ficam no PostgreSQL. Antes de expirar ou trocar o banco gratuito, exporte e migre os dados. SMTP não é configurado por este Blueprint; recuperação de senha exige a configuração descrita no README.

Este arquivo prepara a publicação, mas não comprova que recursos foram criados ou que o site está online. A URL pública só pode ser confirmada depois que a Render concluir o deploy.
