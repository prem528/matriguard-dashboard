"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "./password";
import { clearFailures, lockedForMinutes, recordFailure } from "./rate-limit";
import { createSession, destroySession } from "./session";

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

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash || !process.env.SESSION_SECRET) {
    console.error("Login: ADMIN_EMAIL, ADMIN_PASSWORD_HASH or SESSION_SECRET is not set.");
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

  // The hash runs even for a wrong email, so response time does not reveal
  // which half of the pair was wrong.
  const passwordOk = await verifyPassword(password, adminHash);
  if (email !== adminEmail || !passwordOk) {
    recordFailure(ip);
    return { email, error: "That email and password do not match." };
  }

  clearFailures(ip);
  await createSession(adminEmail);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
