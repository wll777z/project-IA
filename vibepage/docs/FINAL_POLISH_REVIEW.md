# Polimento final — VibePage 3.0 RC1

27/10/2026. Base conferida no GitHub: `release/vibepage-3.0-rc1`, `2c1735e147db24dde78156309c10dbd9c1d2cc4a`. Branch de trabalho: `fix/vibepage-final-polish`. Somente `vibepage/`; sem merge, deploy, migrações, dependências novas ou alteração da cobrança.

## Achados e alterações limitadas

| Área               | Evidência no código anterior                                                                                                                                   | Ajuste                                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Navegação          | Oito links sem indicação de página atual; grade mobile com oito/nove destinos antes do conteúdo                                                                | Menu nativo expansível somente no mobile, contexto atual sempre visível, `aria-current`, ícones e alvos de pelo menos 44 px. Rotas preservadas e administração permanece exclusiva. CSS isolado do FAQ; linhas auto/1fr evitam esticar a barra lateral em páginas curtas |
| Redundância        | Estatísticas contém totais/30 dias; Analytics contém comparação/90 dias/CSV/cartões                                                                            | Não são duplicatas funcionais, portanto ambas permanecem. Removido “3.0” do rótulo de navegação; texto explicita a diferença. Não criamos submenu ou rota substituta                                                                                                     |
| Primeiro acesso    | Conta sem perfil tinha CTA, mas faltava explicar salvar versus publicar                                                                                        | Guia compacto inline: username, HTTPS, salvar rascunho, marcar público/salvar e compartilhar. Sem diálogo, popup, estado adicional ou tracking                                                                                                                           |
| Publicação         | Dashboard e editor ofereciam link para rascunho; `published=true` podia mostrar compartilhamento de perfil suspenso, enquanto APIs corretamente retornavam 404 | Estado do dono consulta somente `published/suspendedAt` por `userId` único; ocultar ações públicas de rascunho/indisponível. Aviso neutro ao dono e suporte; edição permanece disponível. Backend e notas privadas não alterados                                         |
| Página inexistente | “Essa vibe ainda não existe” não cobria indisponibilidade                                                                                                      | 404 genérico que não distingue suspensão, remoção ou rascunho; Next continua emitindo noindex                                                                                                                                                                            |
| Plano expirado     | O plano aparecia Free, mas não explicava preservação dos dados Pro                                                                                             | Orientação curta no resumo do plano para entitlement Pro expirado; regras de downgrade intactas                                                                                                                                                                          |
| Estatísticas       | Texto dizia que cartões não eram contados, divergindo de `/go/card/:id` e Analytics                                                                            | Descrição corrigida: esta página conta links; cartões aparecem separadamente no Analytics Pro                                                                                                                                                                            |
| SEO                | Sem sitemap; layout auth não tinha noindex herdado; faltavam canonical/OG da landing                                                                           | Sitemap curado contendo somente a landing; zero consultas ao banco. Metadados auth noindex, robots expandido, APIs/redirects com `X-Robots-Tag`, canonical/OG da landing, descrições de perfil consistentes mesmo sem bio                                                |

## Decisão do sitemap

O sitemap não é um diretório de usuários e não precisa enumerar toda URL indexável. Nesta candidata contém somente `/`, a landing pública. Não inclui usernames, perfis publicados ou privados, suspensões, dashboard, APIs, auth, demo, suporte ou pagamentos. Também não publica automaticamente os textos legais ainda pendentes de aprovação operacional. Isso elimina consultas e entradas de perfil obsoletas após despublicar ou suspender. Perfis públicos continuam com canonical e OG próprios, e podem ser descobertos por links; perfis indisponíveis continuam 404/noindex. Nenhuma promessa de remoção imediata de índices externos é feita.

Canonical, metadataBase, robots e sitemap estáticos usam `BETTER_AUTH_URL` **no build**. O Dockerfile agora aceita essa origem pública como build arg e o Compose de homologação a encaminha. Não é segredo. Construir para o domínio final; mudar a origem exige rebuild, além de atualizar runtime. Perfis públicos continuam usando a origem runtime e seus metadados existentes. Docker/Caddy/HTTPS real não foram executados aqui.

```bash
# Em ambiente autorizado com origem real; não executado como deploy nesta entrega:
docker build --build-arg BETTER_AUTH_URL=https://DOMINIO_REAL -t vibepage:rc1 .
```

## PR #8 / Pix

GitHub conferido: PR #8 aberto, **draft**, head `3331953e7b86c7a371d5b5aea21862c071765d4d`, base RC1. Adiciona `.env.example` com placeholder, página `/pro/pix` e componente de cópia. Não contém chave pessoal literal nos três diffs examinados. A página pode exibir chave se configurada, apesar de alertar que vendas não estão abertas; o componente não confirma pagamento nem concede Pro. Não interpretamos isso como checkout ou autorização comercial. Antes de incorporá-lo, exigir revisão separada do bloqueio de exibição/cópia enquanto vendas estiverem fechadas e do comportamento de build/cache da variável.

**Não incorporado nem modificado nesta tarefa.** `/pro/pix` continua 404 na candidata desta branch. Não configuramos chave Pix, não concedemos Pro por pagamento, não habilitamos vendas nem alteramos o PR #8. Demonstração e dashboard mantêm a informação de que Pro não está disponível para compra.

## Validação e limites

Ver `VALIDATION.md` para comandos e resultados desta branch. A infraestrutura continua sendo o bloqueador já documentado em `RELEASE_CANDIDATE.md` e `STAGING_RUNBOOK.md`. Testes HTTP usam standalone e PGlite isolado, sem SMTP externo. QA visual usa snapshots HTML de contas sintéticas gerados pelo smoke HTTP, sem hidratação, APIs ou sessões no navegador; menu nativo permanece interativo. Isso não valida edição/salvamento pelo browser nem substitui dispositivos físicos ou leitor de tela.

A decisão anterior **NO-GO beta real, lançamento público e comercialização Pro** permanece. Não há novas funcionalidades grandes, temas, cartões ou efeitos nesta entrega.
