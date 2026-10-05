// Prints a SESSION_SECRET for .env.local.
//
//   node scripts/hash-password.mjs
//
// Admin passwords live in ADMIN_PASSWORD and are hashed into the `users`
// table on first startup. To hash a password for a manual INSERT:
//
//   node -e "import('./lib/auth/password.ts').then(m=>m.hashPassword('your-password').then(console.log))"

import { randomBytes } from "node:crypto";

console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
