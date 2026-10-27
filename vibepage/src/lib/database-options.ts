import type { PoolConfig } from "pg";
// Per-process bounds. Budget max connections across all application replicas.
export function databaseOptions(env = process.env): PoolConfig {
  return {
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === "test" ? 1 : 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    query_timeout: 12000,
  };
}
