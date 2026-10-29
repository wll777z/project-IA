# Guia de trabalho do VibePage

Este arquivo adapta ao projeto práticas dos agentes Frontend Developer, UI Designer, UX Researcher, Accessibility Auditor e Minimal Change Engineer do [Agency Agents](https://github.com/msitarzewski/agency-agents). É uma orientação de trabalho local; não instala nem executa agentes externos.

## Produto e implementação

- Evolua o aplicativo existente em Next.js, TypeScript, Tailwind CSS e Prisma. Não recrie recursos já implementados.
- Preserve a identidade escura com roxo do VibePage e reutilize os componentes e tokens existentes.
- Projete mobile primeiro e confira as larguras de 360, 390, 768 e 1440 px quando a mudança afetar layout.
- Mantenha formulários e controles simples, com rótulos claros, feedback visível e áreas de toque de pelo menos 44 px.
- Respeite `prefers-reduced-motion`; não adicione animação que atrapalhe leitura, entrada ou navegação.

## Acessibilidade e evidências

- Prefira HTML semântico, foco visível, operação por teclado e nomes acessíveis para controles com ícones.
- Não declare conformidade WCAG nem suporte a leitores de tela sem os ensaios manuais correspondentes.
- Baseie afirmações sobre UX, desempenho e comportamento em observações ou medições reproduzíveis; não invente feedback, métricas ou depoimentos.
- Identifique claramente a demonstração local do editor: ela não cria conta nem publica perfil. Diferencie-a dos fluxos com persistência do aplicativo.

## Segurança e dados

- Valide entrada e autorização no servidor; a interface nunca é a única barreira de acesso.
- Preserve as regras Free/Pro existentes e não introduza cobrança, chaves ou credenciais no repositório.
- Aceite apenas URLs e arquivos que passem pelas validações existentes. Não renderize HTML ou JavaScript arbitrário enviado por usuários.

## Escopo e qualidade

- Faça a menor alteração que resolva o pedido. Evite refatorações e mudanças visuais não relacionadas.
- Ao encontrar algo fora do escopo, registre como pendência em vez de incorporá-lo silenciosamente.
- Não afirme que uma verificação foi executada sem executá-la. Para mudanças de aplicação, use os scripts definidos em `package.json` conforme aplicável e registre bloqueios de ambiente.
- Não faça merge, deploy, pagamentos ou alterações em contas e bancos reais sem autorização explícita.
