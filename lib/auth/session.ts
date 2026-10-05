import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/lib/users/store";
import type { User } from "@/lib/users/store";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createToken,
  verifyToken,
} from "./token";

export interface AdminSession {
  email: string;
  user: User;
}

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
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserByEmail(session.sub);
  if (!user) redirect("/login");

  return { email: session.sub, user };
}

/** How the panel greets the signed-in user. */
export function adminName(user: Pick<User, "name" | "email">) {
  return user.name.trim() || user.email.split("@")[0];
}
