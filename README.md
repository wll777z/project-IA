# VibePage

Plataforma de páginas de perfil para gamers, comunidades e criadores, com editor, autenticação, temas, links públicos e estatísticas.

O aplicativo está na pasta [`vibepage/`](./vibepage). Usa Next.js, TypeScript, PostgreSQL e Prisma.

## Executar localmente

Instale Node.js 24 LTS e Docker Desktop. Com o Docker aberto:

```bash
cd vibepage
npm ci
npm run setup
npm run dev
```

Abra **http://localhost:3000**. O setup prepara a configuração local, o banco PostgreSQL, as migrations e os temas iniciais.

Consulte as [instruções completas](./vibepage/README.md) e os [registros de validação](./vibepage/VALIDATION.md).

O workflow de verificação está em [`.github/workflows/vibepage.yml`](./.github/workflows/vibepage.yml). A demonstração estática não inclui o backend de contas; a versão completa exige Node.js e PostgreSQL.
