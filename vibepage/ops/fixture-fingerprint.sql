-- Synthetic acceptance databases ONLY. Hash full rows, including upload bytes.
\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on
BEGIN READ ONLY;
SET LOCAL statement_timeout = '30s';
SELECT format('SELECT %L::text AS entity, count(*) AS rows, md5(coalesce(string_agg(row_json, E''\n'' ORDER BY row_json),'''')) AS digest FROM (SELECT row_to_json(r)::text AS row_json FROM public.%I r) data', tablename, tablename)
FROM pg_tables WHERE schemaname='public' ORDER BY tablename
\gexec
COMMIT;
