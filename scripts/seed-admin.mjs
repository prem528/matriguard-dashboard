// Seeds or updates the admin user from .env.local into the MySQL `users` table.
// Usage: node scripts/seed-admin.mjs

import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

// Load env file (.env.local or .env)
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_NAME,
  DB_USER,
  DB_PASSWORD = "",
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME = "Admin",
} = process.env;

if (!DB_NAME || !DB_USER) {
  console.error("❌ Error: DB_NAME and DB_USER must be set in .env.local or environment.");
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local or environment.");
  process.exit(1);
}

async function run() {
  console.log(`📡 Connecting to MySQL database ${DB_NAME} at ${DB_HOST}:${DB_PORT}...`);
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    charset: "UTF8MB4_UNICODE_CI",
  });

  try {
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const name = ADMIN_NAME.trim() || email.split("@")[0];
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    const now = new Date().toISOString().replace("T", " ").replace(/Z$/, "");

    // Check if user already exists
    const [existing] = await connection.query(
      "SELECT id, email, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      console.log(`ℹ️ User ${email} already exists. Updating password hash and name...`);
      await connection.execute(
        "UPDATE users SET name = ?, password_hash = ?, updated_at = ? WHERE email = ?",
        [name, passwordHash, now, email]
      );
      console.log(`✅ User ${email} updated successfully with hashed password in users table.`);
    } else {
      const id = randomUUID();
      console.log(`✨ Creating admin user: ${email} (Name: ${name})...`);
      await connection.execute(
        `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'admin', ?, ?)`,
        [id, email, name, passwordHash, now, now]
      );
      console.log(`✅ Admin user created in users table! ID: ${id}`);
    }
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error("❌ Failed to seed admin user:", err.message);
  process.exit(1);
});
