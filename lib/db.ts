import "server-only";

import mysql, { type Pool } from "mysql2/promise";
import { ensureBootstrapUser } from "@/lib/db/ensure-bootstrap-user";
import { ensureSchema } from "@/lib/db/ensure-schema";

/**
 * One MySQL pool per server process.
 *
 * Kept on globalThis so `next dev` hot reloads reuse it rather than opening
 * a fresh set of connections on every edit; shared hosting caps how many
 * connections one database user may hold.
 */
const globalForDb = globalThis as typeof globalThis & {
  __matriguardPool?: Pool;
  __matriguardSchemaReady?: Promise<void>;
};

export function db() {
  if (!globalForDb.__matriguardPool) {
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
    if (!DB_NAME || !DB_USER) {
      throw new Error("DB_NAME and DB_USER must be set to reach the database.");
    }

    globalForDb.__matriguardPool = mysql.createPool({
      host: DB_HOST || "127.0.0.1",
      port: Number(DB_PORT) || 3306,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD ?? "",
      charset: "UTF8MB4_UNICODE_CI",
      // A one-admin panel never needs many; Hostinger limits them per user.
      connectionLimit: 4,
      waitForConnections: true,
      enableKeepAlive: true,
      connectTimeout: 10_000,
      // DATE and DATETIME come back as the text stored, so a publication
      // date can never drift by a timezone on its way through a JS Date.
      dateStrings: true,
      timezone: "Z",
    });
  }
  return globalForDb.__matriguardPool;
}

/** Ensures required tables exist, then returns the shared pool. */
export async function ready() {
  const pool = db();
  if (!globalForDb.__matriguardSchemaReady) {
    globalForDb.__matriguardSchemaReady = (async () => {
      await ensureSchema(pool);
      await ensureBootstrapUser(pool);
    })();
  }
  await globalForDb.__matriguardSchemaReady;
  return pool;
}

/** DATETIME(3) text ("2026-09-30 10:15:00.000", UTC) to ISO 8601. */
export function fromSqlTime(value: string) {
  return `${value.replace(" ", "T")}Z`;
}

/** ISO 8601 to DATETIME(3) text, UTC. */
export function toSqlTime(iso: string) {
  return iso.replace("T", " ").replace(/Z$/, "");
}

/** Error codes MySQL and MariaDB raise that callers act on. */
export function isDuplicateKey(error: unknown) {
  return (error as { code?: string })?.code === "ER_DUP_ENTRY";
}

export function isPacketTooLarge(error: unknown) {
  return (error as { code?: string })?.code === "ER_NET_PACKET_TOO_LARGE";
}
