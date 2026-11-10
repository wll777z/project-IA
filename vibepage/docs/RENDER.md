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

## Recuperação de senha

A recuperação só fica disponível quando um serviço de envio está configurado.
Informar um endereço Gmail, por si só, não autoriza o aplicativo a enviar e-mails.
No serviço web da Render, em **Environment**, configure uma das opções e faça redeploy:

- **Resend por HTTPS:** `RESEND_API_KEY` com a credencial do serviço e `MAIL_FROM`
  com um remetente de domínio verificado no Resend. Um Gmail pessoal não é um
  domínio que você possa verificar. O endereço `wendellpereira087@gmail.com` pode
  continuar como contato para comprovantes, independentemente do remetente.
- **SMTP existente:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e
  `SMTP_FROM`. No Gmail, use senha de app, nunca a senha normal. Esta opção
  depende da liberação de conexões SMTP pela hospedagem; prefira HTTPS se as
  portas SMTP estiverem bloqueadas.

Cadastre as credenciais somente nas configurações seguras da Render, nunca no
Git. Se ambas as opções estiverem preenchidas, o aplicativo usa Resend.
Confirme que `BETTER_AUTH_URL` é a origem HTTPS exata do site. Depois de reiniciar,
solicite a recuperação com uma conta de teste, confira a entrega e abra o link
para definir uma senha de pelo menos 12 caracteres. O link não pode ser reutilizado
após a troca, e as sessões anteriores são revogadas.

## Pro com Pix manual

O botão do Pro leva à área autenticada `/dashboard/pro`, com a chave de telefone
`+5511949345361`, recebedor Wendell Pereira, Nubank, e valor de R$ 9,90 por mês.
Os comprovantes devem ser enviados para `wendellpereira087@gmail.com`, informando
o e-mail da conta VibePage. Não há integração bancária nem aprovação automática.
Confira o crédito diretamente no banco antes de liberar acesso; o comprovante
sozinho não comprova recebimento. Após conferir, no terminal do serviço:

```bash
npm run admin:plan -- email-da-conta@example.com PRO AAAA-MM-DD
```

Substitua a data pela expiração de um mês de acesso e use sempre uma expiração
para pagamentos mensais. Para revogar, use `npm run admin:plan -- email FREE`.
Nenhuma credencial bancária é necessária. O site não envia e-mail de comprovante
por conta própria: o botão abre o aplicativo de e-mail do cliente.
