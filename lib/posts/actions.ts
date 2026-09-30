"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { COVER_POSITIONS, LIMITS, countWords, slugify } from "./format";
import { sanitizePostHtml } from "./sanitize";
import * as store from "./store";
import type { PostField, PostInput, SaveResult } from "./types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const COVER = /^\/(uploads|images)\/[a-zA-Z0-9/_.-]+\.(jpe?g|png|webp|avif)$/;

function text(value: unknown, max: number, multiline = false) {
  if (typeof value !== "string") return "";
  const cleaned = multiline ? value.trim() : value.replace(/\s+/g, " ").trim();
  return cleaned.slice(0, max);
}

/**
 * Drafts may be half-finished; publishing needs everything the public
 * blog card and article page actually print.
 */
export async function savePost(id: string | null, raw: PostInput): Promise<SaveResult> {
  await requireAdmin();

  const input: PostInput = {
    title: text(raw.title, LIMITS.title),
    slug: slugify(text(raw.slug, LIMITS.slug * 2) || text(raw.title, LIMITS.title)),
    excerpt: text(raw.excerpt, LIMITS.excerpt, true),
    category: text(raw.category, LIMITS.category),
    coverImage: typeof raw.coverImage === "string" && COVER.test(raw.coverImage) ? raw.coverImage : null,
    coverAlt: text(raw.coverAlt, LIMITS.coverAlt),
    coverPosition: COVER_POSITIONS.some((p) => p.value === raw.coverPosition)
      ? raw.coverPosition
      : // Seeded covers carry hand-tuned positions; keep those as they are.
        /^[0-9a-z% ]{1,24}$/.test(raw.coverPosition ?? "") ? raw.coverPosition : "center",
    contentHtml: sanitizePostHtml(typeof raw.contentHtml === "string" ? raw.contentHtml : ""),
    metaDescription: text(raw.metaDescription, LIMITS.metaDescription),
    status: raw.status === "published" ? "published" : "draft",
    publishedAt: typeof raw.publishedAt === "string" && DATE.test(raw.publishedAt) ? raw.publishedAt : "",
  };

  const errors: Partial<Record<PostField, string>> = {};
  const publishing = input.status === "published";

  if (!input.title) errors.title = "Give the post a title.";
  if (!input.slug) errors.slug = "The web address needs at least one letter or number.";
  else if (await store.slugTaken(input.slug, id ?? undefined)) {
    errors.slug = "Another post already uses this web address.";
  }
  if (!input.publishedAt) errors.publishedAt = "Pick a publication date.";

  if (publishing) {
    if (!input.excerpt) errors.excerpt = "Published posts need a summary for the blog card.";
    if (!input.category) errors.category = "Choose a category.";
    if (!input.coverImage) errors.coverImage = "Published posts need a cover image.";
    if (countWords(input.contentHtml) < 20) errors.contentHtml = "The article is too short to publish.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: publishing ? "A few things need fixing before this can go live." : "Check the highlighted fields.",
      fieldErrors: errors,
    };
  }

  const post = await store.savePost(id, input);
  if (!post) {
    return { ok: false, message: "This post was deleted in another tab.", fieldErrors: {} };
  }

  revalidatePath("/", "layout");
  return { ok: true, id: post.id, slug: post.slug, updatedAt: post.updatedAt };
}

export async function deletePost(id: string) {
  await requireAdmin();
  await store.deletePost(id);
  revalidatePath("/", "layout");
  redirect("/posts?deleted=1");
}
