import "server-only";

import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { fromSqlTime, ready, toSqlTime } from "@/lib/db";

export type UserRole = "admin" | "editor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

function toUser(row: UserRow): User {
  const email = row.email;
  return {
    id: row.id,
    email,
    name: row.name.trim() || email.split("@")[0],
    role: row.role,
    createdAt: fromSqlTime(row.created_at),
    updatedAt: fromSqlTime(row.updated_at),
  };
}

export async function countUsers() {
  const [rows] = await (await ready()).query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM users");
  return Number(rows[0]?.total ?? 0);
}

export async function listUsers(): Promise<User[]> {
  const [rows] = await (await ready()).query<UserRow[]>(
    "SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at ASC"
  );
  return rows.map(toUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const [rows] = await (await ready()).query<UserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await (await ready()).query<UserRow[]>("SELECT * FROM users WHERE email = ? LIMIT 1", [
    email.trim().toLowerCase(),
  ]);
  return rows[0] ? toUser(rows[0]) : null;
}

/** Includes password_hash for login verification only. */
export async function getAuthUserByEmail(email: string) {
  const [rows] = await (await ready()).query<UserRow[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()]
  );
  return rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role?: UserRole;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const email = input.email.trim().toLowerCase();

  await (await ready()).execute(
    `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, email, input.name.trim(), input.passwordHash, input.role ?? "admin", toSqlTime(now), toSqlTime(now)]
  );

  return { id, email, name: input.name.trim() || email.split("@")[0], role: input.role ?? "admin", createdAt: now, updatedAt: now } as User;
}

export async function updateUser(id: string, input: { name?: string; role?: UserRole }) {
  const now = toSqlTime(new Date().toISOString());
  const sets: string[] = ["updated_at = ?"];
  const params: string[] = [now];

  if (input.name !== undefined) {
    sets.push("name = ?");
    params.push(input.name.trim());
  }
  if (input.role !== undefined) {
    sets.push("role = ?");
    params.push(input.role);
  }

  params.push(id);
  await (await ready()).execute(
    `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
}

export async function updateUserPassword(id: string, passwordHash: string) {
  const now = toSqlTime(new Date().toISOString());
  await (await ready()).execute(
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    [passwordHash, now, id]
  );
}

export async function deleteUser(id: string) {
  await (await ready()).execute("DELETE FROM users WHERE id = ?", [id]);
}

