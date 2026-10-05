import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "mysql2/promise";

/** Pull CREATE TABLE statements out of db/schema.sql (comments stripped). */
function parseCreateStatements(sql: string) {
  const body = sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  return body
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => /^CREATE TABLE/i.test(statement));
}

/** Run db/schema.sql once per process; IF NOT EXISTS keeps it safe to repeat. */
export async function ensureSchema(pool: Pool) {
  try {
    const schemaPath = path.join(process.cwd(), "db", "schema.sql");
    const sql = await readFile(schemaPath, "utf8");

    for (const statement of parseCreateStatements(sql)) {
      await pool.execute(statement);
    }
  } catch (err) {
    console.warn("ensureSchema skipped or table already exists:", err);
  }
}
