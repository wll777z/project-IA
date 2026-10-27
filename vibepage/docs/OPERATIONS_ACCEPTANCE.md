# Aceitação operacional — executar apenas em homologação autorizada

Nenhum comando desta seção foi executado contra infraestrutura real nesta auditoria. Não há host Node/HTTPS, PostgreSQL nativo, SMTP, backup ou monitoramento fornecidos. Não preencher contatos, credenciais, RPO/RTO, retenção ou condições comerciais com dados inventados.

## Gate e responsáveis

O operador deve registrar ambiente, responsável técnico, controlador/contatos, público etário, política para menores, lista de convidados do beta, aprovação de tratamento de dados e canal real de suporte/denúncia. O estado atual é NO-GO para usuários reais. Antes de publicar, registrar os IDs/SHAs aprovados e assinar cada aceitação; o PR não é autorização de deploy.

## Banco e backup

1. Provisionar PostgreSQL nativo persistente em homologação isolada, com credenciais próprias, TLS quando remoto e privilégio mínimo. Nunca usar o banco real como fixture de testes.
2. Fazer backup anterior ao upgrade e validar restauração em OUTRO banco vazio. Exemplos para o operador, não executados aqui:

```bash
pg_dump --format=custom --file=vibepage-staging.backup "$VIBEPAGE_STAGING_DATABASE_URL"
pg_restore --list vibepage-staging.backup
pg_restore --no-owner --no-privileges --dbname="$VIBEPAGE_RESTORE_DATABASE_URL" vibepage-staging.backup
```

Conferir explicitamente que as duas URLs são de homologação e que a restauração aponta para banco vazio separado. Não usar `--clean` ou apagar o banco original. Guardar o arquivo criptografado, com acesso restrito; não enviar ao Git. Definir retenção, RPO/RTO e tratamento de exclusões nos backups.

3. No clone candidato com dependências de desenvolvimento: `npm ci`, `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`. Rodar uma vez em banco vazio e uma vez na cópia de uma versão anterior. Comparar contagens/IDs de usuários, perfis, links, cartões, uploads, coleções e métricas, não só o status do comando. Registrar versão do servidor e sete checksums em `evidence/migrations.sha256`.
4. Conferir FK/cascatas, unicidade, índices e queries via catálogos nativos; testar duas conexões/processos concorrentes com a mesma revisão, username/IDs concorrentes, limites e sobreposição de temporadas. Testes PGlite não substituem esta etapa.
5. Com conta sintética autorizada, confirmar downgrade/save/reconcessão Pro sem apagar arquivos ou cartões legados; Free continua exibindo só três cartões e recursos permitidos.

## Configuração e e-mail

Usar `.env.example` sem chaves de fixture: `DATABASE_URL`, `BETTER_AUTH_URL` origem HTTPS exata, `BETTER_AUTH_SECRET` exclusivo, `REQUIRE_EMAIL_VERIFICATION=true` e SMTP completo. Rodar por `npm start` ou Dockerfile/`launch.mjs`; não contornar validação com `server.js`. Confirmar Node suportado, volume/conexão persistentes e política de reinício do host.

O domínio deve servir TLS válido. No proxy, limitar corpos/conexões/timeouts; sobrescrever `AUTH_IP_HEADER` e bloquear acesso direto à origem. Sem header confiável, buckets de tráfego público são compartilhados. Confirmar Secure/HttpOnly/SameSite, 403 cross-origin e 429 reais; não confiar em cabeçalhos enviados pelo visitante. Revisar HSTS após validar o domínio/proxy; não declarar ativo sem medir.

Configurar remetente e DNS (SPF/DKIM/DMARC) com o responsável. Testar entrega de confirmação, reenvio, recuperação, expiração/reutilização de token e revogação das sessões em provedores reais; registrar horário, domínio receptor e resultado sem salvar tokens. Um callback de teste ou `verify()` de SMTP isolado não aprova entregabilidade.

## Jornada de aceitação

Registrar a sequência completa em browser com a conta sintética: landing/demo → cadastro → recebimento externo → confirmação → login → editor Free → publicação → página anônima → QR/PNG/download. Conceder Pro somente pelo script administrativo autorizado, testar Studio/galeria/coleção/agenda/analytics/CSV, expirar Pro, salvar como Free sem perder dados e conferir privacidade. Despublicar: QR/PNG/mídia anônima retornam 404. Exportar, excluir com senha e confirmar cascatas/404. Não excluir dados reais para demonstrar o fluxo.

Repetir em Safari/iOS e Chrome/Android reais, teclado/leitor de tela e movimento reduzido. Medir rede móvel lenta, CPU de animações, RSS/CPU do processo Node, concorrência e p75 de LCP/CLS/INP. A medição local sequencial é uma referência, não capacidade contratada ou SLO comprovado.

## Limpeza, alertas e recuperação

Agendar `npm run db:cleanup` com credencial restrita; conferir execução e falha, sem registrar segredos. Ele remove sessões/verificações e rate limits expirados, não define retenção geral de perfis/métricas/backups. O operador deve aprovar essa política.

Monitorar HTTP/latência/5xx/429, conexão/pool/armazenamento PostgreSQL, crescimento dos uploads, erros de e-mail e término da limpeza. Monitorar banco independentemente: uma landing estática 200 não prova que as APIs estão saudáveis. Definir destinatário de alertas, escalonamento e teste de recuperação; não registrar cookies, tokens, senhas, corpos de formulário ou conteúdo privado.

Rollback: conservar as sete migrations/tabelas; não executar migration reversa destrutiva. Usar artefato anterior aprovado e compatível com o schema, validar origem/segredos e rodar os checks de aceitação. Voltar ao commit de referência reintroduz a perda de configuração no save Free; se esse rollback for indispensável, o operador deve suspender gravações afetadas até aplicar correção para frente. Registrar decisão e preservar o backup; não restaurar backup antigo sobre dados novos sem avaliar perda de dados e autorização.

## Denúncias e moderação — estrutura operacional pendente

Não há endpoint de denúncias nem console administrativo de revisão nesta versão. Não inserir link falso ou inventar e-mail. Antes do beta com público, definir um canal funcional e responsáveis; antes de abrir cadastros amplos, validar capacidade de triagem e retirada. Para cada caso, usar este registro técnico (sem dados pessoais desnecessários):

```text
ID do caso:
Recebido em (UTC) / canal real:
URL e IDs de perfil/link envolvidos:
Categoria / descrição objetiva:
Evidência mínima / armazenamento restrito:
Responsável pela revisão:
Decisão, justificativa e data:
Ação autorizada / confirmação de execução:
Contato e recurso ao solicitante, quando aplicável:
Prazo de retenção aprovado / data de descarte:
```

Não abrir arquivos ou links suspeitos no ambiente administrativo. A revisão deve distinguir conteúdo publicado de dados privados. A retirada não deve apagar conta/dados sem autorização e procedimento; registrar quem autorizou e executou. Não há operação de moderação considerada aprovada apenas por existir este documento.
