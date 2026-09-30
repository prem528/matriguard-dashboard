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

      <section className={`${panel} mt-4 overflow-hidden`}>
        {posts.length === 0 ? (
          <div className="px-6 py-16 text-center">
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
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface-muted/60 text-xs text-ink-muted">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Post</th>
                <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Date</th>
                <th scope="col" className="hidden px-4 py-3 font-medium xl:table-cell">Edited</th>
                <th scope="col" className="w-12 px-4 py-3">
                  <span className="sr-only">Open on website</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((post) => {
                const postStateNow = postState(post, today);
                return (
                  <tr key={post.id} className="group transition-colors hover:bg-surface-muted/60">
                    <td className="px-6 py-3.5">
                      <Link href={`/posts/${post.id}`} className="flex items-center gap-4">
                        <CoverThumb src={mediaSrc(post.coverImage, site)} position={post.coverPosition} />
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-medium text-ink group-hover:text-accent-ink">
                            {post.title || "Untitled draft"}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-xs text-ink-faint">
                            /blog/{post.slug}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3.5 text-ink-muted md:table-cell">
                      {post.category || <span className="text-ink-faint">None</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <StateBadge state={postStateNow} />
                    </td>
                    <td className="hidden px-4 py-3.5 whitespace-nowrap text-ink-muted lg:table-cell">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="hidden px-4 py-3.5 whitespace-nowrap text-ink-faint xl:table-cell">
                      {formatRelative(post.updatedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {postStateNow === "published" && site ? (
                        <a
                          href={`${site}/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface hover:text-ink"
                          aria-label={`Open “${post.title}” on the website`}
                          title="Open on the website"
                        >
                          <ArrowSquareOut size={17} />
                        </a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
