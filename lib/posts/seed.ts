import type { Post } from "./types";

/**
 * The ten articles the website listed before the panel existed, so the blog
 * does not go empty on first run. Each body is only its excerpt: the full
 * text was never written, and needs adding in the editor.
 */
const articles: Array<
  Pick<Post, "slug" | "title" | "excerpt" | "category" | "publishedAt" | "coverImage"> & {
    coverPosition?: string;
  }
> = [
  {
    slug: "what-to-check-before-you-say-yes",
    title: "What is worth checking before you say yes",
    excerpt:
      "Families often ask us what matters most. In practice it comes down to six things, and four of them can be settled in under a week.",
    category: "Where to start",
    publishedAt: "2026-09-02",
    coverImage: "/images/image3.png",
  },
  {
    slug: "red-flags-in-a-matrimonial-profile",
    title: "Red flags in an online matrimonial profile",
    excerpt:
      "Online matchmaking made it easier to meet families, and easier for a few people to say things that are not true. Here is what tends to give them away.",
    category: "Safety",
    publishedAt: "2026-08-12",
    coverImage: "/images/image5.png",
  },
  {
    slug: "a-job-letter-is-not-proof-of-income",
    title: "Why a job letter is not proof of income",
    excerpt:
      "A letter on company paper is easy to produce. What actually confirms a salary is the dull paperwork nobody thinks to ask for.",
    category: "Money",
    publishedAt: "2026-08-05",
    coverImage: "/images/image4.png",
  },
  {
    slug: "what-a-report-contains",
    title: "What a background report actually contains",
    excerpt:
      "Every point is marked confirmed, not confirmed, or not found, and what we heard locally is kept separate from what we verified ourselves.",
    category: "Your report",
    publishedAt: "2026-07-28",
    coverImage: "/images/hero/hero-4.webp",
    coverPosition: "center 40%",
  },
  {
    slug: "asking-about-an-earlier-marriage",
    title: "Asking about an earlier marriage, without causing offence",
    excerpt:
      "It is the question families most dread raising. It is also the one that most often changes a decision, so it is worth asking well.",
    category: "Families",
    publishedAt: "2026-07-14",
    coverImage: "/images/hero/hero-1.webp",
    coverPosition: "75% center",
  },
  {
    slug: "degrees-that-do-not-exist",
    title: "Degrees that do not exist, and how we spot them",
    excerpt:
      "A convincing certificate from a university that never awarded it. The registrar's office usually settles the question in a day or two.",
    category: "Documents",
    publishedAt: "2026-06-30",
    coverImage: "/images/image2.png",
  },
  {
    slug: "what-we-cannot-check",
    title: "What we cannot check, and why we tell you",
    excerpt:
      "We do not tap phones or open private accounts. A clear “we could not confirm this” is worth more to you than a soft answer.",
    category: "How we work",
    publishedAt: "2026-06-18",
    coverImage: "/images/image1.png",
  },
  {
    slug: "how-long-a-check-takes",
    title: "How long a check takes, honestly",
    excerpt:
      "Two to four working days for documents, up to a fortnight for conduct enquiries. Here is what actually makes a case run long.",
    category: "How we work",
    publishedAt: "2026-06-04",
    coverImage: "/images/hero/hero-3.webp",
    coverPosition: "65% 45%",
  },
  {
    slug: "checking-a-family-not-just-a-person",
    title: "Checking a family, not just a person",
    excerpt:
      "A proposal is rarely about one person alone. What we look at when the real question is about the household behind them.",
    category: "Families",
    publishedAt: "2026-05-21",
    coverImage: "/images/image3.png",
  },
  {
    slug: "a-report-you-did-not-want",
    title: "What to do with a report you did not want",
    excerpt:
      "Sometimes the findings confirm the worry rather than settle it. Families usually have more options open to them than they think.",
    category: "Your report",
    publishedAt: "2026-05-07",
    coverImage: "/images/image5.png",
  },
];

export function seedPosts(now: string): Post[] {
  return articles.map((article, index) => ({
    id: `seed-${String(index + 1).padStart(2, "0")}`,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    coverImage: article.coverImage,
    coverAlt: "",
    coverPosition: article.coverPosition ?? "center",
    contentHtml: `<p>${article.excerpt.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`,
    metaDescription: "",
    status: "published",
    publishedAt: article.publishedAt,
    readingMinutes: 1,
    createdAt: now,
    updatedAt: now,
  }));
}
