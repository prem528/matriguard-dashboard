// Seeds the initial 10 articles into the MySQL `posts` table from db/seed.sql
// Usage: node scripts/seed-posts.mjs

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

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
} = process.env;

if (!DB_NAME || !DB_USER) {
  console.error("❌ Error: DB_NAME and DB_USER must be set in .env.local or environment.");
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
    multipleStatements: true,
  });

  try {
    const seedPath = path.resolve(process.cwd(), "db", "seed.sql");
    const sql = readFileSync(seedPath, "utf8");

    console.log("🌱 Executing db/seed.sql...");
    await connection.query(sql);

    const [rows] = await connection.query("SELECT COUNT(*) AS total FROM posts");
    console.log(`✅ Seed complete! Total posts in database: ${rows[0]?.total}`);
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error("❌ Failed to seed posts:", err.message);
  process.exit(1);
});
