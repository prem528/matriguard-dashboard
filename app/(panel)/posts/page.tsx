import Link from "next/link";
import {
  ArrowSquareOut,
  CheckCircle,
  MagnifyingGlass,
  PencilSimpleLine,
} from "@phosphor-icons/react/ssr";
import CoverThumb from "@/components/CoverThumb";
import StateBadge from "@/components/StateBadge";
import { requireAdmin } from "@/lib/auth/session";
import { mediaSrc, siteUrl } from "@/lib/media";
import { formatDate, formatRelative, postState, todayIst } from "@/lib/posts/format";
import { listPosts, postCounts } from "@/lib/posts/store";
import type { PostState } from "@/lib/posts/types";
import { button, cx, input, panel } from "@/lib/ui";

export const metadata = { title: "Posts" };

const TABS: Array<{ state: PostState | null; label: string; key: PostState | "all" }> = [
  { state: null, label: "All", key: "all" },
  { state: "published", label: "Published", key: "published" },
  { state: "scheduled", label: "Scheduled", key: "scheduled" },
  { state: "draft", label: "Drafts", key: "draft" },
];

const STATES = new Set<string>(["published", "scheduled", "draft"]);

function tabHref(state: PostState | null, query: string) {
  const params = new URLSearchParams();
  if (state) params.set("state", state);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/posts?${search}` : "/posts";
}

export default async function PostsPage({ searchParams }: PageProps<"/posts">) {
  await requireAdmin();

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const state =
    typeof params.state === "string" && STATES.has(params.state) ? (params.state as PostState) : null;
  const deleted = params.deleted === "1";

  const [posts, counts] = await Promise.all([
    listPosts({ state: state ?? undefined, query }),
    postCounts(),
  ]);
  const site = siteUrl();
  const today = todayIst();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Posts</h1>
        <Link href="/posts/new" className={button.primary}>
          <PencilSimpleLine size={17} />
          Write a post
        </Link>
      </header>

      {deleted && (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-md bg-ok-soft px-4 py-3 text-sm text-ok"
        >
          <CheckCircle size={18} weight="fill" />
          The post was deleted and is no longer on the website.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {TABS.map((tab) => {
            const active = tab.state === state;
            return (
              <Link
                key={tab.key}
                href={tabHref(tab.state, query)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors",
                  active
                    ? "bg-surface font-medium text-ink shadow-panel"
                    : "text-ink-muted hover:bg-surface-muted hover:text-ink"
                )}
              >
                {tab.label}
                <span className="font-mono text-xs tabular-nums text-ink-faint">{counts[tab.key]}</span>
              </Link>
            );
          })}
        </nav>

        <form role="search" action="/posts" className="relative md:w-72">
          {state && <input type="hidden" name="state" value={state} />}
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
          />
          <label htmlFor="post-search" className="sr-only">
            Search posts
          </label>
          <input
            id="post-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search titles and categories"
            className={`${input} h-9 pl-9`}
          />
        </form>
      </div>

      <section className="mt-5">
        {posts.length === 0 ? (
          <div className={`${panel} px-6 py-16 text-center`}>
            {query ? (
              <>
                <p className="text-sm font-medium text-ink">Nothing matches &ldquo;{query}&rdquo;</p>
                <p className="mt-1 text-sm text-ink-muted">Try part of the title, or a category name.</p>
                <Link href={tabHref(state, "")} className={`${button.secondary} mt-5`}>
                  Clear search
                </Link>
              </>
            ) : counts.all === 0 ? (
              <>
                <p className="font-serif text-xl font-bold text-ink">No posts yet</p>
                <p className="mt-1 text-sm text-ink-muted">Your first article starts here.</p>
                <Link href="/posts/new" className={`${button.primary} mt-5`}>
                  Write a post
                </Link>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                No {state === "draft" ? "drafts" : `${state} posts`} right now.
              </p>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const postStateNow = postState(post, today);
              return (
                <li key={post.id}>
                  {/* The title link is stretched over the whole card, so the
                      card opens the editor while the website link inside it
                      stays a separate, valid link. */}
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-[border-color,box-shadow] duration-200 focus-within:border-accent hover:border-line-strong hover:shadow-panel">
                    <CoverThumb
                      src={mediaSrc(post.coverImage, site)}
                      position={post.coverPosition}
                      className="aspect-16/10 w-full rounded-none"
                    />

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-medium text-accent-ink">
                          {post.category || <span className="text-ink-faint">No category</span>}
                        </span>
                        <StateBadge state={postStateNow} />
                      </div>

                      <h2 className="mt-3 font-serif text-lg leading-snug font-bold text-ink">
                        <Link
                          href={`/posts/${post.id}`}
                          className="line-clamp-2 after:absolute after:inset-0 focus-visible:outline-none group-hover:text-accent-ink"
                        >
                          {post.title || "Untitled draft"}
                        </Link>
                      </h2>

                      {/* mb-5 sets the floor, mt-auto on the footer takes the
                          rest, so footers line up across a row. */}
                      <p className="mt-2 mb-5 line-clamp-2 text-sm leading-6 text-ink-muted">
                        {post.excerpt || <span className="text-ink-faint">No summary yet.</span>}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-xs">
                        <span className="min-w-0 truncate text-ink-muted">
                          {formatDate(post.publishedAt)}
                          <span className="text-ink-faint"> · edited {formatRelative(post.updatedAt)}</span>
                        </span>
                        {postStateNow === "published" && site && (
                          <a
                            href={`${site}/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 -my-1.5 -mr-1.5 inline-flex shrink-0 rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
                            aria-label={`Open “${post.title}” on the website`}
                            title="Open on the website"
                          >
                            <ArrowSquareOut size={17} />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
