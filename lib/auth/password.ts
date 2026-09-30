import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export const KEY_LENGTH = 64;

/**
 * Checks a password against ADMIN_PASSWORD_HASH, which has the form
 * `<salt>:<hash>` in base64url (see scripts/hash-password.mjs). No `$`
 * in the format, because Next expands `$NAME` inside .env files.
 */
export async function verifyPassword(password: string, stored: string) {
  const [saltPart, hashPart] = stored.split(":");
  if (!saltPart || !hashPart) return false;

  const expected = Buffer.from(hashPart, "base64url");
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await scryptAsync(password, Buffer.from(saltPart, "base64url"), KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}
