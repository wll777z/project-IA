# VibePage 3.0 — checklist objetivo de publicação

27/10/2026. Branch proposta: `release/vibepage-3.0-production-ready`, base freeze `3e166f26b0faf885872790bae812379fc6b74da3`. O nome da branch não aprova produção. Sem contratação, implantação, merge ou alteração de dados reais.

## Registro do ambiente — operador deve preencher

- [ ] Responsável técnico, suporte/moderação e substituto definidos.
- [ ] Ambiente, provedor, domínio final e região registrados.
- [ ] Commit/imagem aprovados e fixados após revisão do Pull Request.
- [ ] Node LTS e versão PostgreSQL nativo registrados (template usa Node 24 e PostgreSQL 17).
- [ ] Responsável legal, contato público autorizado, política de idade/menores, retenção/backups e termos/privacidade revisados.
- [ ] RPO, RTO, retenção e destino de backup externo aprovados.

Nenhum contato privado do administrador foi transformado automaticamente em informação pública. SMTP, domínio e responsáveis não foram inventados.

## Artefato e configuração

- [x] Candidata preserva o freeze e a cadeia Ultimate/Next Level/auditoria/RC1/polimento; Pix separado.
- [x] Testes locais, probe interno e documentação preparados; resultados em `VALIDATION.md`.
- [ ] `BETTER_AUTH_URL` HTTPS idêntica no build/runtime; manifesto de origem conferido. Não executar server.js diretamente.
- [ ] Segredos exclusivos no host/secret manager, confirmação obrigatória e SMTP completo; nenhum segredo de fixture.
- [ ] Build e inicialização no host final; imagem/commit e resultados sanitizados anexados.

Instalação de homologação (exige host Docker autorizado; **não executada aqui**): copiar `.env.staging.example` para arquivo privado, preencher valores, executar `npm run staging:check`, depois `docker compose --env-file .env.staging -f compose.staging.yaml config --quiet` e `up --build -d`. Procedimento completo em `STAGING_RUNBOOK.md`. Não publicar banco/porta 3000, não usar `down -v`.

## Banco nativo e migrations

- [ ] Banco vazio dedicado: `npm ci`, `npm run db:migrate`, `npm run db:seed` e `psql -v ON_ERROR_STOP=1 -f ops/native-postgres-acceptance.sql` com DATABASE_URL no ambiente privado do Prisma; o psql usa o serviço privado PGSERVICE.
- [ ] Banco legado de homologação: backup validado antes do upgrade; aplicar oito migrations, comparar IDs/links/cartões/arquivos/coleções/agenda/métricas e executar o SQL de aceite.
- [ ] Conferir unicidade, FK/checks/índices e ausência de órfãos; SQL é somente leitura e não cria/restaura banco.
- [ ] Dois processos/sessões simultâneos: username e revisão concorrentes, IDs de outros donos, agenda sobreposta, rate limits compartilhados e timeout de conexão/query.
- [ ] Reiniciar aplicação e banco preservando dados e sessões; validar uploads e exclusão em cascata com fixtures autorizadas.
- [ ] Pool total cabe em `max_connections` com reserva operacional: até 10 conexões por processo, mais migration/cleanup/backup. TLS/CA corretos quando remoto; não desabilitar validação de certificado.

PGlite local não marca nenhum desses itens como aprovado.

## HTTPS, proxy, prontidão e manutenção

- [ ] DNS/certificado reais aprovados, cookies Secure/HttpOnly/SameSite e headers conferidos.
- [ ] Origem inacessível diretamente; `AUTH_IP_HEADER` sobrescrito pelo proxy; 403/429 por cliente e limite de corpo/timeouts validados.
- [ ] `/api/health` acessível apenas ao probe interno: 200 com banco disponível, 503 sem banco. Proxy fornecido bloqueia esse caminho; não expor diagnósticos em outro provedor.
- [ ] Docker healthcheck e dependência do proxy em `service_healthy` ensaiados. Estado unhealthy não reinicia automaticamente um container: alertar e definir recuperação operacional.
- [ ] Template `ops/systemd/vibepage-cleanup.{service,timer}` adaptado e instalado manualmente; execução diária, `list-timers`, resultado do job e alerta de falha comprovados. Nenhum timer foi instalado nesta entrega.
- [ ] Monitorar disponibilidade/latência, HTTP 5xx/429, falhas de login, SQL/pool, espaço/bytes de Upload, `SMTP_DELIVERY_FAILED`, prontidão, cleanup e backups. Definir canal real de alerta e testar recebimento.
- [ ] Logs não guardam cookies, senhas, tokens, URLs de confirmação/reset, corpos de formulário ou conteúdo de denúncias. Eventos novos são códigos estáticos, sem destinatário ou diagnóstico SMTP.

## SMTP, administrador e suporte

- [ ] Provedor/remetente, SPF, DKIM e DMARC aprovados pelo operador/provedor. SMTP 465 usa TLS implícito; demais portas exigem STARTTLS. Testar a conexão sem desabilitar verificação TLS.
- [ ] Confirmação/reenvio/reset efetivamente entregues, spam/latência/erros avaliados, tokens expirados/reutilizados negados e sessões revogadas após reset. Capture em memória não conta como entrega.
- [ ] Administrador criado/concedido pelo CLI com senha privada de 12–128 caracteres, e-mail confirmado e nenhuma credencial padrão; telefone é contato privado, não autenticação SMS.
- [ ] Intake habilitado somente com configurações legais completas e administrador confirmado. Denúncia, revisão concorrente, suspensão/restauração, retenção e exclusão ensaiadas.
- [ ] Rotina humana de atendimento, escalonamento, prazos, revisão de links suspeitos em ambiente seguro e resposta ao solicitante definidos.

## Jornada de aceite no domínio final

Registrar somente evidências sanitizadas de conta sintética autorizada:

- [ ] Landing → demo identificada sem backend ou venda fictícia.
- [ ] Cadastro → recebimento externo → confirmação → login.
- [ ] Username → aparência/Studio → links/cartões → salvar → publicar.
- [ ] Perfil anônimo → QR → VibeCard → cópia/download/Web Share.
- [ ] Estatísticas e exportação de dados → despublicar (mídia/QR/PNG/redirects indisponíveis) → republicar preservando dados.
- [ ] Pro concedido por operação autorizada → coleção/temporada/galeria/analytics/CSV → expiração/save Free → dados privados preservados → reconcessão autorizada.
- [ ] Suspensão impede bypass pelo dono e não revela notas privadas publicamente; restauração preserva conteúdo.
- [ ] Reset/sessão expirada/logout/CSRF/IDOR/URLs/uploads inválidos e conflitos de revisão tratados.
- [ ] Exclusão confirmada → conta, perfil, mídia, sessões e credenciais indisponíveis; contato de suporte tratado conforme política.

A suíte local cobre essas fronteiras por partes, mas não aprova uma jornada única com SMTP/TLS/PostgreSQL externos.

## Dispositivos, acessibilidade e capacidade

- [x] Conferência local de snapshots em 360/390/768/1024/1440 e probe de 12 cartões/100 links; limites no relatório.
- [ ] Safari/iOS e Chrome/Android físicos: teclado virtual, scroll, foco, modais, salvar, uploads/downloads, QR, compartilhamento e rede lenta.
- [ ] Leitor de tela real, teclado, contraste e movimento reduzido do sistema; não há certificação WCAG nesta entrega.
- [ ] LCP ≤2,5 s, CLS ≤0,1 e INP ≤200 ms no p75 real; dados locais não são distribuição de usuários.
- [ ] Carga e concorrência no host, CPU/memória isoladas do servidor, latência APIs/PNG e CPU de animações em aparelho alvo. Revise orçamento JS de 300 KiB gzip após medição real.

## Backup, rollback e decisão

- [ ] Executar `BACKUP_RECOVERY.md`: backup criptografado externo, checksum, chave recuperável, restore em banco separado vazio e comparação funcional/integra.
- [ ] Plano de incidente/rollback com responsável, imagem compatível e modo manutenção. Conservar tabelas; sem migrations reversas destrutivas nem restauração sobre dados novos sem autorização.
- [ ] Aprovação de demo pública: build com origem real e demonstração identificada; não pressupõe que a prévia hospedada esteja atualizada.
- [ ] Aprovação de beta fechado: todos os gates de infraestrutura, autenticação, banco, e-mail, backups e suporte, participantes/acesso restrito e autorização expressa.
- [ ] Aprovação pública: gates do beta mais moderação, monitoramento, políticas e aceitação mobile.
- [ ] Aprovação comercial Pro: fase futura de pagamentos/contratos/suporte/cancelamento; checkout/Pix não fazem parte desta missão.

**Decisão atual:** demo local apta; demonstração pública condicionada ao artefato/domínio e autorização; **NO-GO beta real / público / Pro comercial**. Não modificar esse estado sem anexar evidências e aprovação dos responsáveis.

## Execução final — candidata de trabalho de 28/10/2026

A branch `fix/vibepage-final-launch-blockers` parte de `7a7c721`. Inventário/ações em [FINAL_LAUNCH_BLOCKERS](FINAL_LAUNCH_BLOCKERS.md). Não marcar um gate do servidor com base no CI ou em PGlite. A prévia estática pública anterior não é uma instalação de contas.

### Comando único de ensaio PostgreSQL nativo

Pré-requisitos: Node 24, `npm ci` concluído, build explícito localhost atual, Docker Engine/Desktop em execução, acesso ao registry da imagem PostgreSQL 17 e nenhuma instância usando esse checkout durante build.

```bash
BETTER_AUTH_URL=http://localhost:3000 npm run build
npm run test:native
```

O segundo comando cria seu próprio container/porta loopback/bancos aleatórios. Não informe DATABASE_URL real. Executa migrations/SQL de aceite, os 111 checks HTTP do standalone em PostgreSQL nativo, concorrência, blocos/coleções/agenda, downgrade, upgrade legado sintético, reinício, dump/checksum/restore em outro banco vazio e limpeza/cascatas. Esperado: cada etapa START→PASS, JSON final de duração/estados e saída zero. Sem Docker: BLOCKED e saída não zero; não contar como aprovação. Falha mantém NO-GO para o gate correspondente. Dump temporário sintético e container próprio são removidos ao terminar; nunca usa banco de produção. Ensaio não valida SMTP, TLS externo, GPG/chave do operador, cópia externa nem recuperação em outro host. O runner GitHub Actions inclui job nativo separado; ler o resultado efetivo do commit aprovado.

### O QUE O RESPONSÁVEL PRECISA CONFIGURAR MANUALMENTE

| Serviço/dado                               | Por que / onde configurar                                                            | Como validar                                                                                                | Sem custos adicionais?                                                                                             | Se faltar                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Host Node 24/Docker com disco persistente  | Executar backend TCP e guardar banco; host autorizado, clone da candidata            | Build, Compose, reinício, teste nativo e jornada no host                                                    | Possível em equipamento existente; custos de disponibilidade/rede são do operador. Nenhuma oferta grátis garantida | Site completo não opera; Sites atual é só demo               |
| Domínio/DNS                                | Origem única de links/auth/SEO; DNS do domínio e BETTER_AUTH_URL/VIBEPAGE_DOMAIN     | A/AAAA corretos; certificado real; canonical/OG/sitemap/QR sem localhost                                    | Subdomínio já controlado pode evitar compra; domínio novo pode custar e não foi comprado                           | Não aprovar HTTPS público nem publicação                     |
| HTTPS/proxy                                | Proteger cookies e origem; Caddy/ACME, TLS_EMAIL autorizado, firewall                | 80/443 somente proxy; 3000/5432 fechadas; health externo bloqueado; limite5MB, timeouts e IP anti-spoofing  | Caddy/ACME software sem licença paga; host/domínio/rede podem custar                                               | NO-GO beta/publicação                                        |
| PostgreSQL 17 persistente                  | Perfis, contas, uploads; volume staging_pg ou serviço equivalente                    | Migrations8, SQL de aceite, reinício, concorrência, restore e jornada                                       | Software livre; armazenamento/operação podem custar                                                                | Perda ou indisponibilidade de dados                          |
| Segredos exclusivos                        | Sessão/banco/proxy; arquivo privado modo0600 ou secret manager                       | Preflight e launcher; evitar config completo/log de ambiente                                                | Geração local gratuita; armazenamento depende do host                                                              | Launcher/preflight recusam configuração ou ambiente inseguro |
| SMTP/remetente/DNS                         | Confirmação/reset; SMTP_* e SPF/DKIM/DMARC                                           | SMTP_ACCEPTANCE com recebimento real/inbox/spam, reset e revogação                                          | Serviço já disponível pode atender; cota/termos precisam ser conferidos                                            | Cadastro público não pode ser aprovado                       |
| Admin autorizado                           | Operar fila; ADMIN_BOOTSTRAP_EMAIL/PHONE em privado e CLI com prompt oculto          | E-mail confirmado, acesso moderacao; usuário normal403; conceder não reseta senha                           | CLI sem custo; atendimento exige pessoa                                                                            | Intake permanece indisponível                                |
| Identificação legal/contato/idade/retenção | Termos/privacidade/suporte; LEGAL_* e SUPPORT_RETENTION_DAYS                         | Revisão pelo responsável; dados reais aprovados visíveis; sem usar automaticamente contato privado de admin | Preenchimento sem serviço pago; aconselhamento é decisão do operador                                               | Não habilitar intake/beta real                               |
| Operador de suporte/moderação              | Denúncias exigem resposta humana; escala, prazos e substituto em registro privado    | Caso→fila→revisão→suspensão/restauração→resposta autorizada                                                 | Sistema existente gratuito; capacidade humana necessária                                                           | Canal técnico sozinho não atende operação                    |
| Backups/chave/destino externo              | Recuperar perda/ransomware; BACKUP_RECOVERY e serviços pg privados                   | Checksum, GPG, chave recuperável, restore separado, comparação completa/RPO/RTO                             | GPG/pg gratuitos; destino existente pode atender, redundância pode custar                                          | NO-GO por falta de recuperação comprovada                    |
| Monitor/alerta/limpeza                     | Detectar falha antes do usuário; ops:status, systemd/journal e canal já administrado | Simular falha isolada, receber alerta; cleanup diário; verificar5xx/429/latência e disco dos volumes        | Script/systemd gratuitos; canal/host precisam existir                                                              | Não há garantia de resposta a incidentes                     |
| Dispositivos e aceite                      | Teclado/compartilhamento/download variam por aparelho                                | iPhone/Safari e Android/Chrome reais; leitor de tela e movimento reduzido                                   | Pode usar aparelhos próprios/emprestados, sem comprar                                                              | Aceite mobile permanece pendente                             |

### Implantação autorizada — sequência exata

Estes comandos são um procedimento para o responsável, **não uma implantação executada**. Revisar/aceitar PR #12 e cadeia anterior, fixar o commit aprovado e escolher host que suporte Node/PostgreSQL persistente e rede TCP. O template fornecido é de homologação privada; não remover Basic Auth nem abrir público automaticamente.

1. Provisionar host e domínio sob autorização, apontar DNS A/AAAA ao host e restringir firewall às portas necessárias (SSH só para operador; 80/443 proxy). Configurar acesso privado, backup e recuperação do host. Não expor web/db diretamente.
2. No clone do repositório, selecionar a branch/commit exatos aprovados. Dentro de `vibepage/`, instalar dependências e criar arquivo privado fora do checkout:

```bash
npm ci
install -m 600 .env.staging.example /caminho/privado/staging.env
# Preencher pelo editor privado; não colar credenciais em histórico/PR.
npm run staging:check -- /caminho/privado/staging.env
docker compose --env-file /caminho/privado/staging.env -f compose.staging.yaml config --quiet
```

3. Preencher os dados da tabela, SMTP/DNS e o domínio final. Gerar chave auth e senha de banco exclusivas; hash Basic Auth via prompt interativo Caddy (`STAGING_RUNBOOK`). Não usar fixtures e não imprimir `docker compose config` sem `--quiet`.
4. Mediante autorização de homologação no host:

```bash
docker compose --env-file /caminho/privado/staging.env -f compose.staging.yaml up --build -d
# Compose executa preflight → banco saudável → migrations/seed → web saudável → proxy.
npm run ops:status -- /caminho/privado/staging.env
```

5. Conferir migrations, HTTPS/cookies/headers/IP, estado dos containers e nenhum acesso direto. Aplicar `ops/native-postgres-acceptance.sql` pelo serviço pg privado ou `docker compose exec -T db psql -U vibepage -d vibepage -v ON_ERROR_STOP=1 < ops/native-postgres-acceptance.sql`, incluindo `--env-file` e `-f compose.staging.yaml` no comando Compose. Não registrar URLs/token/segredos.
6. Após autorização para criar/conceder o administrador, preencher contatos privados ADMIN_BOOTSTRAP_* no arquivo de ambiente (o operador deve adicioná-los; não são contatos públicos). Executar:

```bash
docker compose --env-file /caminho/privado/staging.env -f compose.staging.yaml run --rm admin-bootstrap
# Para conta existente já confirmada, sem trocar senha:
docker compose --env-file /caminho/privado/staging.env -f compose.staging.yaml run --rm admin-bootstrap npm run admin:bootstrap -- --grant-existing
```

Senha nova somente pelo prompt oculto. Confirmar e-mail recebido; nenhum admin padrão. Antes de habilitar intake: contato/legal/idade/retenção aprovados, admin confirmado e rotina humana disponível. Testar denúncia e revisão por conta autorizada; usuário comum não acessa fila. 7. Executar SMTP_ACCEPTANCE, BACKUP_RECOVERY, jornada integral descrita acima, downgrade Pro autorizado e dispositivos físicos. Guardar evidências sanitizadas com versão/data/responsável. Não promover Pro por requisição nem habilitar venda. 8. Adaptar/instalar manualmente templates systemd de cleanup e monitoramento, conferir timer e alerta real. `npm run ops:status` pode ser agendado como job local retornando erro para journal/OnFailure. O script não envia mensagens. Monitorar também disco específico do volume Docker, disponibilidade HTTPS externa, 5xx/429/latência por observabilidade sanitizada. Não habilitar logs de URI/cookies/corpos. 9. Testar rollback: manter imagem anterior compatível com schema e suspensão, backup restaurável, operador e modo manutenção. Não fazer rollback para versão que ignore suspensão. Não usar `down -v`, migrations reversas ou restore sobre dados novos. Em incidente, manter acesso fechado e aprovar recuperação explicitamente. 10. Revisão GO para beta fechado somente com todos os P0 aceitos, suporte pronto, participantes/restrição de acesso e autorização do responsável. Lançamento público requer aceite mobile/políticas/moderação/capacidade/monitoramento e autorização própria. Comercialização Pro permanece bloqueada e fora desta tarefa.

### Métricas internas e critérios de alerta

O Caddyfile ativa `metrics` globalmente e fixa admin em `127.0.0.1:2019` **dentro do container**, sem publicar essa porta nem criar rota pública de métricas. `ops:status` consulta o endpoint interno por `docker compose exec -T proxy wget` e só conserva contagem/soma de duração por status/método/handler. Nenhum URI, token, IP ou Host é retido pelo parser; logs de acesso continuam desligados. Referência: [documentação oficial de métricas Caddy](https://caddyserver.com/docs/metrics).

As séries são cumulativas desde o início do processo, por handler; não somar todos os handlers nem chamar o valor de taxa dos últimos15min. O operador deve comparar amostras ou usar seu Prometheus já disponível, selecionar o handler efetivamente exposto e estabelecer limiares (5xx, 429, latência, disco e saúde) conforme tráfego do beta. Um 429 pode representar proteção funcionando; investigar antes de alterar limites. O script não instala coletor, não guarda histórico nem envia mensagens. Testar falha/alerta recebido continua obrigatório; nunca publicar admin 2019 para facilitar scraping.
