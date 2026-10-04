export type PostStatus = "draft" | "published";

/** What a reader would see today: a published post dated ahead is scheduled. */
export type PostState = "draft" | "scheduled" | "published";

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  /**
   * `/uploads/<file>` for images uploaded here, or a path on the website
   * itself (e.g. `/images/image3.png`) for the covers it already ships.
   */
  coverImage: string | null;
  coverAlt: string;
  /** CSS object-position, since the site crops covers to several ratios. */
  coverPosition: string;
  /** Sanitised on every save. */
  contentHtml: string;
  metaDescription: string;
  status: PostStatus;
  /** YYYY-MM-DD, India time. The date shown on the article. */
  publishedAt: string;
  readingMinutes: number;
  createdAt: string;
  updatedAt: string;
}

/** A post without its body: what lists and the public index carry. */
export type PostSummary = Omit<Post, "contentHtml">;

/** Everything the editor sends; the server derives the rest. */
export interface PostInput {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  coverAlt: string;
  coverPosition: string;
  contentHtml: string;
  metaDescription: string;
  status: PostStatus;
  publishedAt: string;
}

export type PostField = keyof PostInput;

export type SaveResult =
  | { ok: true; id: string; slug: string; updatedAt: string }
  | { ok: false; message: string; fieldErrors: Partial<Record<PostField, string>> };
