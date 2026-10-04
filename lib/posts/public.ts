import type { Post, PostSummary } from "./types";

/**
 * What the website's blog may see of a post. Ids, edit times and draft
 * state stay inside the dashboard.
 *
 * Image paths are returned as stored: `/uploads/<name>` is served by this
 * dashboard, any other path (`/images/...`) by the website itself.
 */

export function publicSummary(post: PostSummary) {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    coverImage: post.coverImage,
    coverAlt: post.coverAlt,
    coverPosition: post.coverPosition,
    publishedAt: post.publishedAt,
    readingMinutes: post.readingMinutes,
    updatedAt: post.updatedAt,
  };
}

export function publicPost(post: Post) {
  return {
    ...publicSummary(post),
    metaDescription: post.metaDescription || post.excerpt,
    contentHtml: post.contentHtml,
  };
}

/** Short shared cache: new posts appear within a minute, the DB stays quiet. */
export const PUBLIC_CACHE = "public, max-age=60, stale-while-revalidate=300";

export function unavailable(error: unknown) {
  console.error("Public API: database unavailable.", error);
  return Response.json(
    { error: "The blog is temporarily unavailable." },
    { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } }
  );
}
