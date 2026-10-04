import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { db, toSqlTime } from "@/lib/db";

/**
 * Uploaded images live in the `media` table. A Node.js Web App's folder can
 * be replaced on redeploy, so the database is the one place they survive,
 * and one phpMyAdmin export backs up posts and images together.
 */

export async function saveMedia(name: string, mime: string, bytes: Uint8Array) {
  await db().execute(
    "INSERT INTO media (name, mime, size, bytes, created_at) VALUES (?, ?, ?, ?, ?)",
    [name, mime, bytes.byteLength, Buffer.from(bytes), toSqlTime(new Date().toISOString())]
  );
}

interface MediaRow extends RowDataPacket {
  mime: string;
  bytes: Buffer;
}

export async function getMedia(name: string) {
  const [rows] = await db().query<MediaRow[]>("SELECT mime, bytes FROM media WHERE name = ?", [name]);
  return rows[0] ?? null;
}
