import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { POSTS_FILE } from "@/lib/storage";
import { postState, readingMinutes, todayIst } from "./format";
import { seedPosts } from "./seed";
import type { Post, PostInput, PostState } from "./types";

/**
 * Posts live in one JSON file. For a single-admin blog of a few hundred
 * articles that is faster and easier to back up than a database.
 *
 * Writes are queued so two saves can never interleave, and land through a
 * temp file + rename so a crash mid-write cannot leave half a file.
 */

let queue: Promise<unknown> = Promise.resolve();

function serialise<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<Post[]> {
  try {
    return JSON.parse(await readFile(POSTS_FILE, "utf8")) as Post[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // First run: start from the articles the website already listed.
    const seeded = seedPosts(new Date().toISOString());
    await writeAll(seeded);
    return seeded;
  }
}

async function writeAll(posts: Post[]) {
  await mkdir(path.dirname(POSTS_FILE), { recursive: true });
  const temp = `${POSTS_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(posts, null, 2), "utf8");
  await rename(temp, POSTS_FILE);
}

/** Newest date first; among equal dates, the most recently edited. */
function byDate(a: Post, b: Post) {
  return b.publishedAt.localeCompare(a.publishedAt) || b.updatedAt.localeCompare(a.updatedAt);
}

export async function listPosts(filter?: { state?: PostState; query?: string }) {
  const today = todayIst();
  const query = filter?.query?.trim().toLowerCase();

  return (await serialise(readAll))
    .filter((post) => !filter?.state || postState(post, today) === filter.state)
    .filter(
      (post) =>
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query) ||
        post.slug.includes(query)
    )
    .sort(byDate);
}

export async function getPost(id: string) {
  return (await serialise(readAll)).find((post) => post.id === id) ?? null;
}

export async function slugTaken(slug: string, exceptId?: string) {
  return (await serialise(readAll)).some((post) => post.slug === slug && post.id !== exceptId);
}

export async function listCategories() {
  const posts = await serialise(readAll);
  return [...new Set(posts.map((post) => post.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export async function postCounts() {
  const today = todayIst();
  const counts: Record<PostState | "all", number> = { all: 0, draft: 0, scheduled: 0, published: 0 };
  for (const post of await serialise(readAll)) {
    counts.all += 1;
    counts[postState(post, today)] += 1;
  }
  return counts;
}

/** Creates the post when id is null. Returns null if the id no longer exists. */
export function savePost(id: string | null, input: PostInput) {
  return serialise(async () => {
    const posts = await readAll();
    const now = new Date().toISOString();
    const fields = { ...input, readingMinutes: readingMinutes(input.contentHtml), updatedAt: now };

    if (id === null) {
      const post: Post = { ...fields, id: randomUUID(), createdAt: now };
      await writeAll([...posts, post]);
      return post;
    }

    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    const post: Post = { ...posts[index], ...fields };
    posts[index] = post;
    await writeAll(posts);
    return post;
  });
}

export function deletePost(id: string) {
  return serialise(async () => {
    const posts = await readAll();
    const remaining = posts.filter((post) => post.id !== id);
    if (remaining.length === posts.length) return false;
    await writeAll(remaining);
    return true;
  });
}
