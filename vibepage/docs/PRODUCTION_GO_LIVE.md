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
