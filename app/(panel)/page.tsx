import Link from "next/link";
import { ArrowRight, PencilSimpleLine } from "@phosphor-icons/react/ssr";
import CoverThumb from "@/components/CoverThumb";
import StateBadge from "@/components/StateBadge";
import { adminName, requireAdmin } from "@/lib/auth/session";
import { mediaSrc, siteUrl } from "@/lib/media";
import { formatDate, formatRelative, postState, todayIst } from "@/lib/posts/format";
import { listPosts } from "@/lib/posts/store";
import { button, panel } from "@/lib/ui";

export const metadata = { title: "Overview" };

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function OverviewPage() {
  const session = await requireAdmin();
  const posts = await listPosts();
  const site = siteUrl();
  const today = todayIst();

  const withState = posts.map((post) => ({ post, state: postState(post, today) }));
  const count = (state: string) => withState.filter((item) => item.state === state).length;

  const byEdit = [...withState].sort((a, b) => b.post.updatedAt.localeCompare(a.post.updatedAt));
  const draft = byEdit.find((item) => item.state === "draft")?.post;
  const recent = byEdit.slice(0, 6);

  const categories = Object.entries(
    posts.reduce<Record<string, number>>((acc, post) => {
      if (post.category) acc[post.category] = (acc[post.category] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const figures = [
    { label: "Live on the blog", value: count("published"), href: "/posts?state=published" },
    { label: "Scheduled", value: count("scheduled"), href: "/posts?state=scheduled" },
    { label: "Drafts", value: count("draft"), href: "/posts?state=draft" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            {greeting()}, <span className="capitalize">{adminName(session.sub)}</span>
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{formatDate(today)}</p>
        </div>
        <Link href="/posts/new" className={button.primary}>
          <PencilSimpleLine size={17} />
          Write a post
        </Link>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* The thing most worth doing next: an unfinished draft if there is
            one, otherwise the newest post on the site. */}
        {draft ? (
          <section className={`${panel} flex flex-col p-6 sm:p-8`}>
            <h2 className="text-sm font-medium text-ink-muted">Pick up where you left off</h2>
            <p className="mt-5 font-serif text-2xl font-bold leading-snug text-ink sm:text-[28px]">
              {draft.title || "Untitled draft"}
            </p>
            {draft.excerpt && (
              <p className="mt-3 max-w-[60ch] text-[15px] leading-7 text-ink-muted">{draft.excerpt}</p>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
              <span className="text-xs text-ink-faint">
                Last edited {formatRelative(draft.updatedAt)}
              </span>
              <Link href={`/posts/${draft.id}`} className={button.secondary}>
                Continue editing
                <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        ) : posts[0] ? (
          <section className={`${panel} grid overflow-hidden sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]`}>
            <CoverThumb
              src={mediaSrc(posts[0].coverImage, site)}
              position={posts[0].coverPosition}
              className="aspect-16/10 w-full rounded-none sm:aspect-auto sm:h-full"
            />
            <div className="flex flex-col p-6 sm:p-8">
              <h2 className="text-sm font-medium text-ink-muted">Newest on the blog</h2>
              <p className="mt-4 font-serif text-2xl font-bold leading-snug text-ink">{posts[0].title}</p>
              <p className="mt-2 text-xs text-ink-faint">{formatDate(posts[0].publishedAt)}</p>
              <div className="mt-auto pt-6">
                <Link href={`/posts/${posts[0].id}`} className={button.secondary}>
                  Open in editor
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className={`${panel} p-8`}>
            <h2 className="font-serif text-2xl font-bold text-ink">Nothing written yet</h2>
            <p className="mt-2 max-w-[48ch] text-sm leading-6 text-ink-muted">
              Posts you publish here appear on the website&apos;s blog within a minute.
            </p>
            <Link href="/posts/new" className={`${button.primary} mt-6`}>
              Write the first post
            </Link>
          </section>
        )}

        <section className={panel} aria-labelledby="figures">
          <h2 id="figures" className="px-6 pt-6 text-sm font-medium text-ink-muted">
            The blog at a glance
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {figures.map((figure) => (
              <li key={figure.label}>
                <Link
                  href={figure.href}
                  className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-muted"
                >
                  <span className="text-sm text-ink">{figure.label}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-medium tabular-nums text-ink">{figure.value}</span>
                    <ArrowRight
                      size={14}
                      className="text-ink-faint transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className={panel} aria-labelledby="recent">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 id="recent" className="text-sm font-medium text-ink-muted">
              Recently edited
            </h2>
            <Link href="/posts" className="text-xs font-medium text-accent-ink hover:underline">
              All posts
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="px-6 py-10 text-sm text-ink-faint">Edits will show up here.</p>
          ) : (
            <ul className="mt-3 pb-2">
              {recent.map(({ post, state }) => (
                <li key={post.id}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-surface-muted"
                  >
                    <CoverThumb src={mediaSrc(post.coverImage, site)} position={post.coverPosition} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {post.title || "Untitled draft"}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-faint">
                        Edited {formatRelative(post.updatedAt)}
                      </span>
                    </span>
                    <StateBadge state={state} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${panel} p-6`} aria-labelledby="categories">
          <h2 id="categories" className="text-sm font-medium text-ink-muted">
            Categories
          </h2>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-ink-faint">Categories appear once posts use them.</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {categories.map(([name, total]) => (
                <li key={name}>
                  <Link
                    href={`/posts?q=${encodeURIComponent(name)}`}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-line px-3 text-sm text-ink transition-colors hover:border-line-strong hover:bg-surface-muted"
                  >
                    {name}
                    <span className="font-mono text-xs tabular-nums text-ink-faint">{total}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
