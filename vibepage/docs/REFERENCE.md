# Referência de arquitetura

Repositório consultado via plugin GitHub: https://github.com/async-labs/saas (branch master, 26/10/2026).

Foram lidos README.md, LICENSE.md, saas/app/lib/withAuth.tsx, saas/api/server/api/team-member.ts e saas/api/server/aws-s3.ts.

A licença é MIT, copyright (c) 2018 Async. Não copiamos trechos de código nem dependências do projeto. Aproveitamos a ideia de separar formulários, API autenticada e regras de domínio. O VibePage mantém Next App Router, PostgreSQL/Prisma, Better Auth e Tailwind; não incorpora MongoDB, Express, MobX, Stripe, AWS, newsletter, mensagens privadas ou analytics de terceiros.

Decisões: verificar sessão e propriedade no servidor, salvar perfil e links em transação, normalizar uploads no servidor em vez de aceitar nome/caminho arbitrários, não expor cobrança na primeira versão e não enviar e-mails ou identificadores pessoais para analytics. A interface e os temas são originais.
