-- Guard for a dedicated, empty restore-validation database. Does not restore or delete anything.
\set ON_ERROR_STOP on
BEGIN READ ONLY;
DO $$ BEGIN
 IF current_database() NOT LIKE 'vibepage_restore_%' THEN
  RAISE EXCEPTION 'Use a dedicated vibepage_restore_* validation database.';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%'
 AND c.relkind IN ('r','p','m','f')) THEN
  RAISE EXCEPTION 'Restore target is not empty; no restore permitted.';
 END IF;
END $$;
COMMIT;
