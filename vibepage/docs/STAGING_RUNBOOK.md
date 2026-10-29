> Para a candidata congelada e os gates atuais, consulte [RELEASE_FREEZE](RELEASE_FREEZE.md) e [RELEASE_FREEZE_CHECKLIST](RELEASE_FREEZE_CHECKLIST.md).

# Homologação real — procedimento pendente de execução

Este documento prepara a operação; não comprova host, TLS, PostgreSQL ou SMTP. No ambiente desta entrega não estão disponíveis Docker, PostgreSQL nativo, domínio administrável ou credenciais SMTP. Uma integração Render foi sugerida, mas não está conectada. Não contratamos serviços. Compose abaixo exige host com Docker Compose; não é um blueprint de Render. Se o provedor for conectado, adaptar o mesmo contrato de ambiente/rede/persistência sem alterar o produto.

## 1. Preparação privada

Usar a candidata revisada `release/vibepage-3.0-production-ready`, a partir do freeze `3e166f2`, Node LTS 24 e PostgreSQL 17. Em host autorizado, dentro de `vibepage/`:

```bash
cp .env.staging.example .env.staging
chmod 600 .env.staging
npm ci
npm run staging:check
```

Preencher `.env.staging` por editor/gerenciador privado: domínio DNS real e `BETTER_AUTH_URL=https://dominio`, `TLS_EMAIL`, senha de banco aleatória URL-safe com 32+ caracteres, chave auth aleatória exclusiva, SMTP/remetente real. Não copiar segredos do desenvolvimento. Gerar hash bcrypt para o acesso privado do proxy com `caddy hash-password` interativo; armazenar hash com aspas simples no arquivo dotenv para preservar `$`. Não passar senhas em argumentos. O preflight verifica formato, não DNS, entrega SMTP ou conectividade.

Definir contato administrativo privado e, separadamente, responsável legal, contato público autorizado, versão dos avisos, retenção, idade/menores e backups. Não publicar automaticamente telefone/e-mail de administrador nos termos. Só ativar `SUPPORT_INTAKE_ENABLED=true` com os dados completos. Requer também ao menos um administrador confirmado. Sem isso a página informa indisponibilidade e API responde 503, sem criar solicitação.

## 2. Subida isolada (não executada nesta entrega)

```bash
docker compose --env-file .env.staging -f compose.staging.yaml config --quiet
docker compose --env-file .env.staging -f compose.staging.yaml up --build -d
```

O build recebe a origem pública `BETTER_AUTH_URL` via build arg para canonical, robots e sitemap; runtime deve usar a mesma origem. Mudar domínio exige rebuild; o launcher verifica o manifesto gerado contra a origem runtime e recusa divergências públicas. Não editar o manifesto nem iniciar server.js diretamente. O preflight deve concluir antes do banco; migrations/seed antes de web. Caddy termina HTTPS e exige acesso privado; SMTP é saída de rede, não servidor falso. Somente proxy publica portas 80/443. Ele aguarda o healthcheck do serviço web e bloqueia `/api/health` externamente; o probe interno executa SELECT 1. Estado unhealthy precisa de alerta/recuperação do operador, não implica reinício automático. Não abrir porta 3000/5432 externamente. O IP confiável é sobrescrito pelo proxy; validar que cabeçalho enviado pelo cliente não modifica limite. Volumes preservam banco/certificados. Não executar `down -v`.

O template inclui healthcheck interno e modelo systemd de cleanup, mas não instala timers, agenda backups ou configura alertas. Antes de usuários reais: configurar rotina diária de cleanup, backup criptografado fora do host, monitoramento, operador responsável, RPO/RTO e rollback. Não imprimir configuração completa ou logs com senhas, tokens, cookies ou URLs de confirmação. A falta de logs de acesso no Caddy evita registrar tokens; estabelecer política de logs sanitizados para incidentes.

## 3. Administrador

Contatos privados foram preparados localmente; não estão no Git. Nenhuma conta real foi criada. Para nova conta, informar senha **nova** de 12–128 caracteres somente no prompt oculto:

```bash
docker compose --env-file .env.staging -f compose.staging.yaml run --rm admin-bootstrap
```

Confirmar o e-mail recebido antes de usar `/dashboard/moderacao`. Telefone é contato privado, não prova de posse/SMS. Em conta já existente e confirmada, conceder papel sem resetar senha:

```bash
docker compose --env-file .env.staging -f compose.staging.yaml run --rm admin-bootstrap npm run admin:bootstrap -- --grant-existing
```

No processo Node direto, usar `.env` de homologação e `.env.admin.local` ignorado para contatos; `npm run admin:bootstrap`. O modo `--password-stdin` destina-se a secret manager; nunca usar senha literal em histórico do shell. Administrador não concede Pro automaticamente. Para revogar papel via operação administrativa autorizada, remover registro Administrator no banco sob controle do operador; não há rota web de concessão/revogação.

## 4. Aceitação antes do beta

Registrar data, versão, host, responsável e evidências sanitizadas para cada item:

1. PostgreSQL nativo vazio: aplicar oito migrations/seed; verificar FK/índices/checks. Em outro banco com versão anterior e dados sintéticos, executar upgrade e verificar perfil/links. Nenhum downgrade SQL destrutivo.
2. Backup com ferramentas nativas e restauração em banco **separado**: comparar perfis/links, mídia, papéis, casos e eventos; medir recuperação e confirmar retenção/acesso. Não restaurar sobre produção.
3. DNS/certificado HTTPS válido, cookies Secure/HttpOnly, proxy, origem privada, 403/429 e concorrência em múltiplas instâncias; recuperação após reinício preserva dados.
4. Cadastro → e-mail efetivamente recebido → confirmação → login → perfil → publicação → link compartilhado. Recuperar senha com entrega real e revogar sessão antiga. Registrar somente evidências sem tokens.
5. Free salva links/cartões permitidos; Pro autorizado personaliza/salva/compartilha; expirar Pro preserva privados e remove recursos exclusivos públicos; exclusão torna perfil/mídia indisponíveis e remove papel/contacto. Os testes locais não aprovam estas jornadas no domínio real.
6. Denúncia real sintética → recibo → fila privada → revisão/suspensão → perfil/mídia/QR/VibeCard indisponíveis → restauração. Rejeitar sessão não administrativa/CSRF/revisão antiga. Designar responsável, periodicidade de revisão, resposta humana e escalonamento; nenhuma mensagem é enviada automaticamente pela fila.
7. Executar cleanup e confirmar remoção de casos expirados/eventos, com alerta para falha. `docker compose --env-file .env.staging -f compose.staging.yaml run --rm cleanup` deve ser agendado pelo operador.
8. Celulares físicos iOS/Safari e Android/Chrome, 360/390/768/1024/1440, teclado/leitor de tela/movimento reduzido: formulários, editor, salvar, upload, menu, fila, QR, download e compartilhamento. Guardar capturas e limitações.
9. Aprovar responsável/contato/idade/retenção/termos/privacidade e atendimento. Definir participantes do beta e acesso individual/rotação; Basic Auth de homologação não é um sistema final de convites.

Somente com evidências aceitas e autorização expressa abrir beta fechado. Público e venda Pro têm decisões separadas; pagamento não existe nesta versão.

## 5. Rollback

Guardar imagem/commit anterior, segredos em gerenciador e snapshot/backup verificável. Fazer rollback do aplicativo mantendo tabelas/colunas aditivas. Código anterior à suspensão administrativa não é rollback seguro se houver perfis suspensos: manter modo manutenção/acesso fechado até versão que respeite a suspensão. Não apagar migrations nem restaurar banco real sem autorização. Registrar incidente e recuperação sem dados pessoais nos logs.

## Candidata incremental e comandos de aceite

Após revisão usar `fix/vibepage-final-launch-blockers` (base `7a7c721`), fixando o commit aprovado. Nenhum merge automático. Consulte [PRODUCTION_GO_LIVE](PRODUCTION_GO_LIVE.md) para configuração manual/publicação autorizada e [SMTP_ACCEPTANCE](SMTP_ACCEPTANCE.md) para recebimento externo. `npm run test:native` ensaia somente bancos Docker novos; não aceita DATABASE_URL real como fallback. `npm run ops:status -- /arquivo/privado/staging.env` não altera serviços e não entrega alerta: configurar operador/agenda/canal de falha separadamente.
