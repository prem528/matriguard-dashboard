// Prints the .env lines for the admin login.
//
//   node scripts/hash-password.mjs "the-password"
//
// Keep the format in step with lib/auth/password.ts.

import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password || password.length < 12) {
  console.error('Usage: node scripts/hash-password.mjs "<password of 12+ characters>"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log(`ADMIN_PASSWORD_HASH=${salt.toString("base64url")}:${hash.toString("base64url")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
