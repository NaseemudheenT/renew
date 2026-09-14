import "server-only";

import mysql, { type Pool, type PoolConnection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

/**
 * Renew's MySQL data layer (Hostinger). A single pooled connection is reused
 * across the app; queries are ALWAYS parameterized (never string-interpolated),
 * timestamps are UTC, and text is utf8mb4. Credentials come only from the
 * environment — never hardcoded. This is the Firebase/Firestore replacement.
 *
 * Config: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME — or a single
 * DATABASE_URL (mysql://user:pass@host:port/name), which wins when present.
 */
let pool: Pool | undefined;

function makePool(): Pool {
  const url = process.env.DATABASE_URL?.trim();
  const common = {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 10),
    maxIdle: Number(process.env.DB_POOL_LIMIT ?? 10),
    idleTimeout: 60_000,
    enableKeepAlive: true,
    charset: "utf8mb4",
    timezone: "Z", // store/read UTC
    supportBigNumbers: true,
    bigNumberStrings: false,
    dateStrings: false,
  } as const;

  if (url) return mysql.createPool({ uri: url, ...common });

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;
  if (!host || !user || !database) {
    throw new Error("MySQL is not configured — set DATABASE_URL or DB_HOST/DB_USER/DB_NAME.");
  }
  return mysql.createPool({
    host,
    port: Number(process.env.DB_PORT ?? 3306),
    user,
    password: process.env.DB_PASSWORD ?? "",
    database,
    ...common,
  });
}

/** The shared pool (lazily created). */
export function db(): Pool {
  if (!pool) pool = makePool();
  return pool;
}

/** True when MySQL connection settings are present (for graceful fallbacks). */
export function isMysqlConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim() || (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME));
}

/** A single positional value for a parameterized query. */
export type SqlParam = string | number | boolean | Date | Buffer | null;
/** Positional values for a parameterized query (use `?` placeholders in SQL). */
export type SqlParams = SqlParam[];

/** Parameterized SELECT returning typed rows. */
export async function query<T extends RowDataPacket>(sql: string, values: SqlParams = []): Promise<T[]> {
  const [rows] = await db().query<T[]>(sql, values);
  return rows;
}

/** First matching row, or null. */
export async function queryOne<T extends RowDataPacket>(sql: string, values: SqlParams = []): Promise<T | null> {
  const rows = await query<T>(sql, values);
  return rows[0] ?? null;
}

/** Parameterized INSERT/UPDATE/DELETE; returns affectedRows / insertId. */
export async function execute(sql: string, values: SqlParams = []): Promise<ResultSetHeader> {
  const [res] = await db().execute<ResultSetHeader>(sql, values);
  return res;
}

/**
 * Run a set of statements in a single transaction. The callback receives the
 * connection; throwing rolls everything back. Use for multi-row writes (e.g.
 * CSV import, transfers) — never a per-row network round-trip.
 */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (e) {
    try { await conn.rollback(); } catch { /* already gone */ }
    throw e;
  } finally {
    conn.release();
  }
}

export type { RowDataPacket, ResultSetHeader, PoolConnection };
