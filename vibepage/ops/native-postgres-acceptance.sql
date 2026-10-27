-- Run only in authorized native PostgreSQL staging AFTER prisma migrate deploy.
-- Read-only verification, not a migration runner or an approval of production.
\set ON_ERROR_STOP on
BEGIN READ ONLY;
SET LOCAL statement_timeout = '10s';
SET LOCAL lock_timeout = '2s';
SELECT version() AS server_version, current_database() AS database_name;
DO $$
DECLARE expected text[] := ARRAY[
 '202610260001_init','202610260002_profiles','202610260003_analytics',
 '202610260004_staged_uploads','202610270001_ultimate','202610270002_aurora_blue',
 '202610270003_next_level','202610270004_release_operations'
];
BEGIN
 IF to_regclass('public."_prisma_migrations"') IS NULL THEN
  RAISE EXCEPTION 'Missing Prisma migration history; run migrate deploy in staging.';
 END IF;
 IF (SELECT count(*) FROM "_prisma_migrations" WHERE migration_name=ANY(expected) AND finished_at IS NOT NULL AND rolled_back_at IS NULL) <> 8 THEN
  RAISE EXCEPTION 'Expected eight completed release migrations.';
 END IF;
 IF EXISTS(SELECT 1 FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL) THEN
  RAISE EXCEPTION 'Unfinished migration requires operator review.';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND NOT i.indisvalid) THEN
  RAISE EXCEPTION 'Invalid public index requires review.';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='Profile_username_key') OR
    NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='GamerCard_profileId_position_key') OR
    NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='SupportCase_expiresAt_idx') THEN
  RAISE EXCEPTION 'Missing required release indexes.';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='Profile_userId_fkey' AND contype='f' AND convalidated) OR
    NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='Upload_safe_media' AND contype='c' AND convalidated) THEN
  RAISE EXCEPTION 'Missing or unvalidated release constraints.';
 END IF;
 IF EXISTS(SELECT 1 FROM "Profile" p LEFT JOIN "User" u ON u.id=p."userId" WHERE u.id IS NULL) OR
    EXISTS(SELECT 1 FROM "ProfileLink" l LEFT JOIN "Profile" p ON p.id=l."profileId" WHERE p.id IS NULL) THEN
  RAISE EXCEPTION 'Orphan profile/link data.';
 END IF;
END $$;
SELECT 'users' AS entity,count(*) AS rows FROM "User"
UNION ALL SELECT 'profiles',count(*) FROM "Profile"
UNION ALL SELECT 'links',count(*) FROM "ProfileLink"
UNION ALL SELECT 'cards',count(*) FROM "GamerCard"
UNION ALL SELECT 'uploads',count(*) FROM "Upload"
UNION ALL SELECT 'collections',count(*) FROM "SavedAppearance"
UNION ALL SELECT 'schedules',count(*) FROM "AppearanceSchedule"
UNION ALL SELECT 'views',count(*) FROM "PageView"
UNION ALL SELECT 'support_cases',count(*) FROM "SupportCase";
COMMIT;
