"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "./password";
import { clearFailures, lockedForMinutes, recordFailure } from "./rate-limit";
import { createSession, destroySession } from "./session";
import { getAuthUserByEmail } from "@/lib/users/store";

/** Runs scrypt even when no account exists, so timing does not reveal which half failed. */
const DUMMY_PASSWORD_HASH = `${Buffer.alloc(16).toString("base64url")}:${Buffer.alloc(64).toString("base64url")}`;

export interface LoginState {
  error?: string;
  email?: string;
}

async function clientIp() {
  const list = await headers();
  // nginx sets X-Forwarded-For; the first entry is the browser.
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "local";
}

/** Only same-site paths, so ?next= can never bounce the admin elsewhere. */
function safeNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!process.env.SESSION_SECRET) {
    console.error("Login: SESSION_SECRET is not set.");
    return { email, error: "Sign-in is not configured on this server yet." };
  }

  const ip = await clientIp();
  const wait = lockedForMinutes(ip);
  if (wait > 0) {
    return {
      email,
      error: `Too many attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.`,
    };
  }

  const account = email ? await getAuthUserByEmail(email) : null;
  const passwordOk = await verifyPassword(password, account?.password_hash ?? DUMMY_PASSWORD_HASH);
  if (!account || !passwordOk) {
    recordFailure(ip);
    return { email, error: "That email and password do not match." };
  }

  clearFailures(ip);
  await createSession(account.email);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
