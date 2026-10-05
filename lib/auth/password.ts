import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export const KEY_LENGTH = 64;

/** Stored as `<salt>:<hash>` in base64url (see hashPassword). */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

/**
 * Checks a password against a stored hash (`<salt>:<hash>` in base64url).
 * No `$` in the format, because Next expands `$NAME` inside .env files.
 */
export async function verifyPassword(password: string, stored: string) {
  const [saltPart, hashPart] = stored.split(":");
  if (!saltPart || !hashPart) return false;

  const expected = Buffer.from(hashPart, "base64url");
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await scryptAsync(password, Buffer.from(saltPart, "base64url"), KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}
