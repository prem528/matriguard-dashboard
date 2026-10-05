import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless session token: base64url(payload).base64url(HMAC-SHA256).
 *
 * Kept free of next/headers so proxy.ts can import it too. Rotating
 * SESSION_SECRET signs every admin out at once.
 */

export const SESSION_COOKIE = "mg_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
  /** The admin's email. */
  sub: string;
  /** Expiry, seconds since epoch. */
  exp: number;
}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return value;
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createToken(email: string) {
  const payload: SessionPayload = {
    sub: email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.sub !== "string" || !payload.sub.includes("@")) return null;
    return payload;
  } catch {
    return null;
  }
}
