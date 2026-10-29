# Backup e recuperação — procedimento a executar pelo operador

Não executado nesta entrega: não há PostgreSQL nativo, `pg_dump`, `pg_restore`, host ou credenciais de homologação disponíveis. Não usar contas reais como fixtures. Retenção, RPO/RTO, responsável e destino externo permanecem pendentes. Nenhum backup ou chave é armazenado no Git; os padrões comuns também estão excluídos do contexto Docker.

## Preparação privada

1. Criar serviços PostgreSQL **fora do checkout**, em arquivo de serviços e arquivo de senhas com modo 0600: `vibepage_staging_source` e `vibepage_restore_validation`. Usar `PGSERVICEFILE`/`PGPASSFILE` privados; nunca passar URL com senha em argumentos. Configurar TLS com validação do servidor para conexão remota.
2. O destino de restauração deve ser banco separado, vazio, dedicado, chamado `vibepage_restore_*`, sem aplicativo conectado. A origem não deve ser produção neste ensaio. Não usar `--clean`, `--create`, DROP ou restore sobre dados existentes.
3. Escolher armazenamento privado **fora do repositório**, com acesso restrito, cópia criptografada fora do host e monitoramento. Configurar chave pública GPG confiável do operador e guardar a chave privada/recuperação separadamente. Não gerar identidade fictícia nem incluir chaves no código.
4. Preencher `BACKUP_DIR`, `BACKUP_GPG_RECIPIENT`, `PGSERVICEFILE`, `PGPASSFILE` em ambiente privado. Os comandos abaixo são exemplos para revisão, não foram executados. Interromper gravações na homologação durante o ensaio de comparação.

## Backup com falha fechada

Em Bash, no host autorizado com ferramentas instaladas:

```bash
set -euo pipefail
umask 077
export PGCONNECT_TIMEOUT=5
export PGSERVICE=vibepage_staging_source
: "${BACKUP_DIR:?Defina diretorio privado externo ao checkout}"
: "${BACKUP_GPG_RECIPIENT:?Defina fingerprint da chave publica confiavel}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
backup_file="$BACKUP_DIR/vibepage-$(date -u +%Y%m%dT%H%M%SZ).dump.gpg"
pg_dump --format=custom --no-owner --no-acl |
  gpg --batch --encrypt --recipient "$BACKUP_GPG_RECIPIENT" --output "$backup_file.part"
mv "$backup_file.part" "$backup_file"
sha256sum "$backup_file" > "$backup_file.sha256"
```

`pipefail` impede marcar um dump com falha como backup pronto. Um `.part` não é backup válido. Não registrar comandos com senha, cookies, tokens ou conteúdo dos registros. Confirmar checksum depois da cópia externa e testar recuperação da chave; arquivo criptografado sem chave recuperável não atende ao gate.

## Restauração isolada

Definir `backup_file` e os serviços privados no host autorizado. Comparar identidade do banco de origem e destino; negar identidade igual. A checagem de vazio é uma proteção adicional, não autorização de restore:

```bash
set -euo pipefail
umask 077
source_db=$(PGSERVICE=vibepage_staging_source psql -AXt -v ON_ERROR_STOP=1 -c 'SELECT current_database()')
restore_db=$(PGSERVICE=vibepage_restore_validation psql -AXt -v ON_ERROR_STOP=1 -c 'SELECT current_database()')
test "$source_db" != "$restore_db"
PGSERVICE=vibepage_restore_validation psql -v ON_ERROR_STOP=1 -f ops/assert-empty-restore.sql
sha256sum --check "$backup_file.sha256"
gpg --decrypt "$backup_file" |
  PGSERVICE=vibepage_restore_validation pg_restore --exit-on-error --single-transaction --no-owner --no-privileges
PGSERVICE=vibepage_restore_validation psql -v ON_ERROR_STOP=1 -f ops/native-postgres-acceptance.sql
```

GPG pode exigir a chave privada/pinentry do operador. Nunca gravar a passphrase em argumentos/Git. Durante toda a restauração o banco deve continuar exclusivo e sem clientes escrevendo. Comparar contagens, IDs e conteúdo das fixtures, bytes/hashes de uploads, perfil público, login, coleção, agenda, QR/VibeCard e moderação. Contagens iguais isoladamente não comprovam integridade. Registrar duração e perda potencial para aprovar RPO/RTO. Não executar o SQL de aceite antes de restaurar, pois ele exige migrations concluídas.

## Retenção e incidentes

`BACKUP_RETENTION_DAYS` deve ser definido pelo operador conforme retenção/recuperação aprovadas; não há valor jurídico ou prazo padrão inventado. Preparar lista de candidatos, sem exclusão automática:

```bash
: "${BACKUP_RETENTION_DAYS:?Prazo aprovado em dias}"
[[ "$BACKUP_RETENTION_DAYS" =~ ^[1-9][0-9]*$ ]]
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'vibepage-*.dump.gpg' -mtime +"$BACKUP_RETENTION_DAYS" -print
```

Antes de aprovar a eliminação, confirmar cópia externa restaurável, retenção mínima e necessidades de incidente/exclusão de dados. Este procedimento não agenda nem apaga backups. Falhas de dump, criptografia, checksum, chave, restore ou comparação devem alertar o operador e manter o gate NO-GO. Fazer rollback de aplicativo com imagem/schema compatíveis; não apagar migrations nem restaurar banco real automaticamente. Consulte `STAGING_RUNBOOK.md` para o risco de reintroduzir versões anteriores à suspensão administrativa.

## Ensaio automático com dados descartáveis

`npm run test:native` prepara PostgreSQL17 nativo em container próprio, gera dump custom/checksum em diretório temporário modo restrito e restaura em outro banco vazio `vibepage_restore_*`, conferindo hashes de todas as linhas/tabelas (inclusive bytes de uploads), constraints e migrations. Reinicia o banco para verificar persistência e remove somente a fixture da execução. Esse ensaio local/CI não executa GPG, não testa chave do operador, cópia externa, retenção, recuperação em outro host ou RPO/RTO de produção. Não substitui os gates privados acima. Não executar `ops/fixture-fingerprint.sql` em banco grande de produção: agrega linhas completas e foi escrito somente para fixtures pequenas.
