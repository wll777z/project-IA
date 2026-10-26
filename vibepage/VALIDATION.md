# Validação — preparação para lançamento

Rodada de 26/10/2026, na branch `fix/vibepage-launch-readiness`, baseada na `main` `080141fc0e49a92ab815a8c22f59a2a90ed65da1`. Node.js 24.22.1, npm 11.9.0. Mudanças exclusivamente dentro de `vibepage/`. Nenhum merge ou deploy.

## Resultados desta rodada

| Verificação            | Resultado real                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `npm ci`               | Concluído a partir do lockfile do repositório                                           |
| `npm run lint`         | Aprovado, sem erros ou avisos do linter                                                 |
| `npm run typecheck`    | Aprovado, com Prisma Client gerado                                                      |
| `npm test`             | **94 testes aprovados em 9 arquivos**                                                   |
| `npm run build`        | Build de produção aprovado; standalone e launcher preparados                            |
| `npm run test:http`    | **28 verificações HTTP aprovadas** na aplicação standalone de produção                  |
| `npm run format:check` | Prettier aprovado                                                                       |
| `npm audit --json`     | **0 vulnerabilidades conhecidas** reportadas, incluindo dependências de desenvolvimento |

O npm ainda emite aviso de fim de suporte do ESLint 9; isso não é um aviso do linter nem uma vulnerabilidade reportada pelo audit. O conjunto de plugins precisa ser atualizado de forma coordenada antes de um lançamento amplo.

## Regressões reproduzidas

- Antes da correção, `safeLinkSchema.safeParse("not a url")` e string vazia lançavam `TypeError`; uma URL contendo newline e um host `.local.` eram aceitos. Agora são rejeitados sem lançar exceção. Há casos para entradas parciais, controles, backslash, host local com ponto final e canonicalização de protocolo/host.
- O teste `link-race.integration.test.ts` simula deterministicamente a reivindicação de um ID entre o preflight e a escrita, usando operações e restrições reais do banco embarcado. Foi executado contra o código original: **falhou como esperado**, pois a promessa resolvia após o upsert indevido. Com a correção, a colisão é rejeitada e a transação faz rollback. Não é um teste de carga com conexões PostgreSQL nativas concorrentes.
- Links legados inválidos continuam visíveis ao dono para correção e não são renderizados como destinos públicos. O teste confirma leitura, recusa no write e correção para URL canônica.

O build repetido revelou um erro no cache persistido do Turbopack neste ambiente (`invalid digit found in string`). O cache de build foi desativado via configuração suportada no Next instalado, preservando o cache de desenvolvimento. As execuções aprovadas acima são posteriores a essa correção.

## Autenticação e e-mail

Testes com Better Auth e Prisma reais confirmam cadastro genérico, ausência de auto-login, bloqueio antes de confirmar e-mail, rejeição de token inválido, confirmação, login, recuperação genérica para contas existentes/inexistentes, troca de senha, recusa de token reutilizado e revogação das sessões.

As mensagens de confirmação e recuperação são capturadas por um callback em memória. Nenhum e-mail é enviado. As fixtures removem configurações SMTP herdadas para não usar um provedor real acidentalmente. Foram testados também os guardas de configuração e a geração de chave no setup quando a linha está ausente ou vazia; chaves válidas são preservadas.

## HTTP de produção

O smoke inicia o launcher e a aplicação standalone em porta dinâmica com banco PGlite isolado, exercitando:

- Landing e CSS; cabeçalho `Referrer-Policy: no-referrer`.
- Redirect de anônimo, cadastro, login e dashboard do dono.
- Rejeição de write autenticado com origem externa; exportação exige sessão e não expõe senha ou sessões.
- Salvamento, rascunho HTTP 404, publicação e HTML de bio escapado.
- PNG de compartilhamento, `no-store`, 404 de rascunho e de conta excluída.
- Visita agregada, redirect só para destino salvo e resumo Free sem detalhes Pro.
- Logout, recusa do cookie revogado, exclusão com senha e remoção da página.

## Banco, uploads, limites e permissões

As quatro migrations existentes são aplicadas em banco novo em cada fixture, por Prisma/pg sobre PGlite. Nenhuma migration anterior foi alterada e não há mudança de schema nesta revisão. A suíte mantém os testes de uploads reais normalizados com Sharp, MIME incompatível/SVG/tamanho, estágios de imagem, controles de propriedade, limitação atômica, revisão do editor, unicidade, expiração Pro, privacidade de mídia e cascatas.

## Limites e pendências reais

- Não há Docker, PostgreSQL 17 nativo ou SMTP real disponíveis. Compose/Dockerfile, upgrade de um banco com dados reais, carga, concorrência entre processos, restauração de backups e entregabilidade não foram verificados aqui.
- Não foi feito teste em navegador ou aparelho físico nesta rodada; o design e os arquivos CSS foram preservados. A navegação do contador por username foi revisada estaticamente. Mobile e leitor de tela ainda precisam de revisão própria.
- O banco remoto e a hospedagem Node.js continuam sem configuração. A demonstração existente não é o backend. Não houve deploy nesta auditoria.
- Para origem pública: `DATABASE_URL`, `BETTER_AUTH_URL` HTTPS exato, chave aleatória exclusiva, `REQUIRE_EMAIL_VERIFICATION=true` e SMTP completo são obrigatórios. Use `npm start` ou o Dockerfile, ambos com o launcher validado; não inicie `server.js` diretamente.
- É preciso configurar proxy confiável, tarefa de manutenção, backups/retenção, controlador e contato de privacidade, requisitos de menores de idade e moderação/denúncias. Os textos legais permanecem rascunhos.
- `no-store` controla novas respostas Open Graph; não apaga cópias já baixadas ou caches de plataformas externas.
- A CSP ainda permite scripts/styles inline necessários ao Next. Não foi implementada política com nonce. A auditoria não garante ausência de todas as falhas.

Consulte [docs/LAUNCH_AUDIT.md](docs/LAUNCH_AUDIT.md) para achados, evidência, correções e bloqueios operacionais. Os resultados anteriores de 61 testes e 20 checks HTTP pertencem à entrega do MVP antes desta revisão, não aos números desta rodada.
