import "server-only";

import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db, fromSqlTime, toSqlTime } from "@/lib/db";
import { readingMinutes, todayIst } from "./format";
import type { Post, PostInput, PostState, PostSummary } from "./types";

/**
 * Posts live in the `posts` table (db/schema.sql). Every function here keeps
 * the shape the screens already use, so nothing above this file knows
 * where the data is kept.
 */

interface PostRow extends RowDataPacket {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_image: string | null;
  cover_alt: string;
  cover_position: string;
  content_html?: string;
  meta_description: string;
  status: "draft" | "published";
  published_at: string;
  reading_minutes: number;
  created_at: string;
  updated_at: string;
}

/** Everything but the article body, which lists never show. */
const SUMMARY_COLUMNS = `id, slug, title, excerpt, category, cover_image, cover_alt, cover_position,
  meta_description, status, published_at, reading_minutes, created_at, updated_at`;

const ALL_COLUMNS = `${SUMMARY_COLUMNS}, content_html`;

/** Newest date first; among equal dates, the most recently edited. */
const NEWEST_FIRST = "ORDER BY published_at DESC, updated_at DESC";

function toSummary(row: PostRow): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    coverImage: row.cover_image,
    coverAlt: row.cover_alt,
    coverPosition: row.cover_position,
    metaDescription: row.meta_description,
    status: row.status,
    publishedAt: row.published_at,
    readingMinutes: row.reading_minutes,
    createdAt: fromSqlTime(row.created_at),
    updatedAt: fromSqlTime(row.updated_at),
  };
}

function toPost(row: PostRow): Post {
  return { ...toSummary(row), contentHtml: row.content_html ?? "" };
}

/** Where-clause for one dashboard tab. Scheduled = published with a future date. */
function stateClause(state: PostState) {
  if (state === "draft") return "status = 'draft'";
  if (state === "scheduled") return "status = 'published' AND published_at > ?";
  return "status = 'published' AND published_at <= ?";
}

/** Searches the text as typed: %, _ and \ match themselves, not patterns. */
function likeContains(text: string) {
  return `%${text.replace(/[\\%_]/g, "\\$&")}%`;
}

export async function listPosts(filter?: { state?: PostState; query?: string }) {
  const where: string[] = [];
  const params: string[] = [];

  if (filter?.state) {
    where.push(stateClause(filter.state));
    if (filter.state !== "draft") params.push(todayIst());
  }

  const query = filter?.query?.trim();
  if (query) {
    where.push("(title LIKE ? OR category LIKE ? OR slug LIKE ?)");
    params.push(likeContains(query), likeContains(query), likeContains(query));
  }

  const [rows] = await db().query<PostRow[]>(
    `SELECT ${SUMMARY_COLUMNS} FROM posts ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ${NEWEST_FIRST}`,
    params
  );
  return rows.map(toSummary);
}

export async function getPost(id: string) {
  const [rows] = await db().query<PostRow[]>(`SELECT ${ALL_COLUMNS} FROM posts WHERE id = ?`, [id]);
  return rows[0] ? toPost(rows[0]) : null;
}

export async function slugTaken(slug: string, exceptId?: string) {
  const [rows] = await db().query<RowDataPacket[]>(
    "SELECT 1 FROM posts WHERE slug = ? AND id <> ? LIMIT 1",
    [slug, exceptId ?? ""]
  );
  return rows.length > 0;
}

export async function listCategories() {
  const [rows] = await db().query<RowDataPacket[]>(
    "SELECT DISTINCT category FROM posts WHERE category <> '' ORDER BY category"
  );
  return rows.map((row) => row.category as string);
}

export async function postCounts() {
  const today = todayIst();
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,
       SUM(status = 'draft') AS draft,
       SUM(status = 'published' AND published_at > ?) AS scheduled,
       SUM(status = 'published' AND published_at <= ?) AS published
     FROM posts`,
    [today, today]
  );
  const row = rows[0] ?? {};
  // SUM over no rows is NULL, and MySQL sends sums as decimal strings.
  return {
    all: Number(row.total ?? 0),
    draft: Number(row.draft ?? 0),
    scheduled: Number(row.scheduled ?? 0),
    published: Number(row.published ?? 0),
  };
}

/**
 * Creates the post when id is null. Returns null if the id no longer exists.
 * A slug that lost a race to another save surfaces as ER_DUP_ENTRY.
 */
export async function savePost(id: string | null, input: PostInput): Promise<Post | null> {
  const now = new Date().toISOString();
  const minutes = readingMinutes(input.contentHtml);
  const values = [
    input.slug,
    input.title,
    input.excerpt,
    input.category,
    input.coverImage,
    input.coverAlt,
    input.coverPosition,
    input.contentHtml,
    input.metaDescription,
    input.status,
    input.publishedAt,
    minutes,
    toSqlTime(now),
  ];

  if (id === null) {
    const newId = randomUUID();
    await db().execute(
      `INSERT INTO posts (slug, title, excerpt, category, cover_image, cover_alt, cover_position,
         content_html, meta_description, status, published_at, reading_minutes, updated_at, id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...values, newId, toSqlTime(now)]
    );
    return { ...input, id: newId, readingMinutes: minutes, createdAt: now, updatedAt: now };
  }

  const [result] = await db().execute<ResultSetHeader>(
    `UPDATE posts SET slug = ?, title = ?, excerpt = ?, category = ?, cover_image = ?, cover_alt = ?,
       cover_position = ?, content_html = ?, meta_description = ?, status = ?, published_at = ?,
       reading_minutes = ?, updated_at = ?
     WHERE id = ?`,
    [...values, id]
  );
  return result.affectedRows === 0 ? null : getPost(id);
}

export async function deletePost(id: string) {
  const [result] = await db().execute<ResultSetHeader>("DELETE FROM posts WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

/* ----------------------------------------------------------------
   Public reads, for the website's API. Published and dated today or
   earlier only: drafts and scheduled posts never leave the panel.
   ---------------------------------------------------------------- */

export async function listPublished() {
  const [rows] = await db().query<PostRow[]>(
    `SELECT ${SUMMARY_COLUMNS} FROM posts WHERE status = 'published' AND published_at <= ? ${NEWEST_FIRST}`,
    [todayIst()]
  );
  return rows.map(toSummary);
}

export async function getPublishedBySlug(slug: string) {
  const [rows] = await db().query<PostRow[]>(
    `SELECT ${ALL_COLUMNS} FROM posts WHERE slug = ? AND status = 'published' AND published_at <= ?`,
    [slug, todayIst()]
  );
  return rows[0] ? toPost(rows[0]) : null;
}
