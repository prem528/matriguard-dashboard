import type { Post, PostState } from "./types";

/** Safe to import from client components: no Node APIs in here. */

export const COVER_POSITIONS = [
  { value: "center top", label: "Top" },
  { value: "center", label: "Centre" },
  { value: "center bottom", label: "Bottom" },
] as const;

export const LIMITS = {
  title: 140,
  slug: 90,
  excerpt: 280,
  category: 40,
  coverAlt: 160,
  metaDescription: 160,
} as const;

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITS.slug)
    .replace(/-+$/, "");
}

/** Today in India, as YYYY-MM-DD. Publication dates are all IST. */
export function todayIst() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function postState(post: Pick<Post, "status" | "publishedAt">, today = todayIst()): PostState {
  if (post.status === "draft") return "draft";
  return post.publishedAt > today ? "scheduled" : "published";
}

export const STATE_LABEL: Record<PostState, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

/** "2 September 2026", matching the public blog. */
export function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "4 min ago", "yesterday", or a date, for edit timestamps. */
export function formatRelative(isoDateTime: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(isoDateTime).getTime());
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(isoDateTime);
}

export function countWords(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(html: string) {
  return Math.max(1, Math.round(countWords(html) / 200));
}
