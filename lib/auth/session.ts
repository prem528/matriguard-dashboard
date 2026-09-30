import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createToken,
  verifyToken,
} from "./token";

export async function createSession(email: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The signed-in admin, or null. Memoised per request. */
export const getSession = cache(async () => {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
});

/**
 * Gate for every page and Server Action that reads or changes content.
 * proxy.ts only redirects optimistically; this is the real check.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** How the panel greets the admin. Falls back to the part before the @. */
export function adminName(email: string) {
  return process.env.ADMIN_NAME?.trim() || email.split("@")[0];
}
