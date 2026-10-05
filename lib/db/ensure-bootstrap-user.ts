import "server-only";

import { randomUUID } from "node:crypto";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { hashPassword } from "@/lib/auth/password";
import { toSqlTime } from "@/lib/db";

/**
 * When the users table is empty, seed the first admin from .env.
 * ADMIN_PASSWORD is hashed before storage; ADMIN_PASSWORD_HASH (legacy) is
 * copied as-is for one-time migration from the old env-only auth.
 */
export async function ensureBootstrapUser(pool: Pool) {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!email) return;

    // Check if this admin user already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (existing.length > 0) return;

    // Check if users table already has accounts (only auto-bootstrap first admin if table is empty)
    const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM users");
    if (Number(rows[0]?.total ?? 0) > 0) return;

    const name = process.env.ADMIN_NAME?.trim() || email.split("@")[0];

    let passwordHash: string | undefined;
    const plain = process.env.ADMIN_PASSWORD;
    if (plain) {
      passwordHash = await hashPassword(plain);
    } else if (process.env.ADMIN_PASSWORD_HASH) {
      passwordHash = process.env.ADMIN_PASSWORD_HASH;
    }
    if (!passwordHash) return;

    const now = toSqlTime(new Date().toISOString());
    await pool.execute(
      `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'admin', ?, ?)`,
      [randomUUID(), email, name, passwordHash, now, now]
    );
  } catch (err) {
    console.warn("ensureBootstrapUser skipped:", err);
  }
}
