"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowSquareOut, WarningCircle } from "@phosphor-icons/react";
import StateBadge from "@/components/StateBadge";
import { savePost } from "@/lib/posts/actions";
import {
  LIMITS,
  countWords,
  formatRelative,
  postState,
  readingMinutes,
  slugify,
  todayIst,
} from "@/lib/posts/format";
import type { Post, PostField, PostInput, PostStatus } from "@/lib/posts/types";
import { button, cx, hint, input, label, panel } from "@/lib/ui";
import CoverField from "./CoverField";
import DeletePost from "./DeletePost";
import RichText from "./RichText";

interface PostEditorProps {
  post: Post | null;
  categories: string[];
  siteUrl: string;
}

function toInput(post: Post | null): PostInput {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    category: post?.category ?? "",
    coverImage: post?.coverImage ?? null,
    coverAlt: post?.coverAlt ?? "",
    coverPosition: post?.coverPosition ?? "center",
    contentHtml: post?.contentHtml ?? "",
    metaDescription: post?.metaDescription ?? "",
    status: post?.status ?? "draft",
    publishedAt: post?.publishedAt ?? todayIst(),
  };
}

export default function PostEditor({ post, categories, siteUrl }: PostEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<PostInput>(() => toInput(post));
  const [saved, setSaved] = useState(() => JSON.stringify(toInput(post)));
  const [savedAt, setSavedAt] = useState(post?.updatedAt ?? null);
  // A live post's address is out in the world; only new posts follow the title.
  const [slugLocked, setSlugLocked] = useState(Boolean(post));
  const [errors, setErrors] = useState<Partial<Record<PostField, string>>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(form) !== saved;
  const savedStatus: PostStatus = (JSON.parse(saved) as PostInput).status;
  const live = post !== null && savedStatus === "published";
  const future = form.publishedAt > todayIst();
  const words = countWords(form.contentHtml);
  const domain = siteUrl.replace(/^https?:\/\//, "") || "matriguardsolutions.com";

  const update = (patch: Partial<PostInput>) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      if (patch.title !== undefined && !slugLocked) next.slug = slugify(patch.title);
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch) as PostField[]) delete next[key];
      if (patch.title !== undefined && !slugLocked) delete next.slug;
      return next;
    });
  };

  const save = (status: PostStatus) => {
    setMessage("");
    startTransition(async () => {
      const payload = { ...form, status };
      const result = await savePost(post?.id ?? null, payload);

      if (!result.ok) {
        setErrors(result.fieldErrors);
        setMessage(result.message);
        return;
      }

      const stored = { ...payload, slug: result.slug };
      setForm(stored);
      setSaved(JSON.stringify(stored));
      setSavedAt(result.updatedAt);
      setErrors({});
      setSlugLocked(true);
      if (!post) router.replace(`/posts/${result.id}`);
    });
  };

  // Ctrl/Cmd+S keeps the post in whatever state it is already in.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current(savedStatus);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [savedStatus]);

  // Warn before closing the tab on unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const statusLine = pending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : savedAt
        ? `Saved ${formatRelative(savedAt)}`
        : "Not saved yet";

  return (
    // Not a <form>: every action is an explicit button, and the delete dialog
    // inside needs a form of its own.
    <div>
      {/* Action bar */}
      <div className="sticky top-14 z-20 border-b border-line bg-canvas lg:top-0">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-8">
          <Link href="/posts" className={`${button.ghost} -ml-2 px-2`} aria-label="Back to posts">
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Posts</span>
          </Link>
          <StateBadge state={post ? postState({ status: savedStatus, publishedAt: form.publishedAt }) : "draft"} />
          <span
            className={cx("hidden truncate text-xs md:inline", dirty ? "text-warn" : "text-ink-faint")}
            aria-live="polite"
            suppressHydrationWarning
          >
            {statusLine}
          </span>

          <span className="ml-auto flex items-center gap-2">
            {live && siteUrl && !future && (
              <a
                href={`${siteUrl}/blog/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${button.ghost} hidden sm:inline-flex`}
              >
                <ArrowSquareOut size={16} />
                View
              </a>
            )}
            {live ? (
              <button type="button" className={button.secondary} disabled={pending} onClick={() => save("draft")}>
                Unpublish
              </button>
            ) : (
              <button type="button" className={button.secondary} disabled={pending} onClick={() => save("draft")}>
                Save draft
              </button>
            )}
            <button
              type="button"
              className={button.primary}
              disabled={pending || (live && !dirty)}
              onClick={() => save("published")}
            >
              {live ? "Update" : future ? "Schedule" : "Publish"}
            </button>
          </span>
        </div>
      </div>

      {message && (
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8">
          <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
            <WarningCircle size={18} weight="fill" className="mt-px shrink-0" />
            {message}
          </p>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-10 xl:gap-14">
        {/* Writing column, at the website's reading width. */}
        <div className="mx-auto w-full max-w-170">
          <CoverField
            value={form.coverImage}
            alt={form.coverAlt}
            position={form.coverPosition}
            siteUrl={siteUrl}
            error={errors.coverImage}
            onChange={update}
          />

          <label htmlFor="post-title" className="sr-only">
            Title
          </label>
          <textarea
            id="post-title"
            rows={1}
            value={form.title}
            maxLength={LIMITS.title}
            onChange={(event) => update({ title: event.target.value.replace(/\n/g, " ") })}
            placeholder="Post title"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "title-error" : undefined}
            className="mt-10 w-full resize-none bg-transparent font-serif text-[34px] leading-[1.15] font-bold tracking-tight text-ink field-sizing-content placeholder:text-ink-faint/70 focus-visible:outline-none sm:text-[40px]"
          />
          {errors.title && <FieldError id="title-error">{errors.title}</FieldError>}

          <label htmlFor="post-excerpt" className="sr-only">
            Summary
          </label>
          <textarea
            id="post-excerpt"
            rows={2}
            value={form.excerpt}
            maxLength={LIMITS.excerpt}
            onChange={(event) => update({ excerpt: event.target.value })}
            placeholder="Summary for the blog card. Two sentences is plenty."
            aria-invalid={errors.excerpt ? true : undefined}
            aria-describedby="excerpt-hint"
            className="mt-4 w-full resize-none bg-transparent text-lg leading-8 text-ink-muted field-sizing-content placeholder:text-ink-faint/70 focus-visible:outline-none"
          />
          <p id="excerpt-hint" className={cx(hint, "flex justify-between gap-4")}>
            {errors.excerpt ? <span className="text-danger">{errors.excerpt}</span> : <span>Shown on the blog listing, under the title.</span>}
            <Counter value={form.excerpt.length} max={LIMITS.excerpt} />
          </p>

          <div className="mt-8">
            <RichText
              initialHtml={form.contentHtml}
              onChange={(contentHtml) => update({ contentHtml })}
              invalid={Boolean(errors.contentHtml)}
              describedBy={errors.contentHtml ? "content-error" : undefined}
            />
            {errors.contentHtml && (
              <FieldError id="content-error" className="mt-4">
                {errors.contentHtml}
              </FieldError>
            )}
          </div>
        </div>

        {/* Settings column */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <section className={`${panel} p-5`} aria-labelledby="publishing">
            <h2 id="publishing" className="text-sm font-semibold text-ink">
              Publishing
            </h2>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="post-date" className={label}>
                Publication date
              </label>
              <input
                id="post-date"
                type="date"
                value={form.publishedAt}
                onChange={(event) => update({ publishedAt: event.target.value })}
                aria-invalid={errors.publishedAt ? true : undefined}
                className={input}
              />
              {errors.publishedAt ? (
                <FieldError>{errors.publishedAt}</FieldError>
              ) : (
                <p className={hint}>
                  {future ? "Goes live on this date. Until then it stays off the blog." : "Printed on the article."}
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-1.5">
              <label htmlFor="post-category" className={label}>
                Category
              </label>
              <input
                id="post-category"
                list="category-options"
                value={form.category}
                maxLength={LIMITS.category}
                onChange={(event) => update({ category: event.target.value })}
                placeholder="e.g. Families"
                aria-invalid={errors.category ? true : undefined}
                className={input}
              />
              <datalist id="category-options">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.category ? (
                <FieldError>{errors.category}</FieldError>
              ) : (
                <p className={hint}>Reuse an existing one where it fits, so the blog stays tidy.</p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-1.5">
              <label htmlFor="post-slug" className={label}>
                Web address
              </label>
              <div
                className={cx(
                  "flex items-center rounded-md border bg-surface transition-colors focus-within:border-accent",
                  errors.slug ? "border-danger" : "border-line-strong hover:border-ink-faint"
                )}
              >
                <span className="pl-3 font-mono text-xs text-ink-faint">/blog/</span>
                <input
                  id="post-slug"
                  value={form.slug}
                  maxLength={LIMITS.slug}
                  onChange={(event) => {
                    setSlugLocked(true);
                    update({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
                  }}
                  onBlur={() => update({ slug: slugify(form.slug) })}
                  aria-invalid={errors.slug ? true : undefined}
                  className="min-w-0 flex-1 bg-transparent py-2 pr-3 font-mono text-xs text-ink focus-visible:outline-none"
                />
              </div>
              {errors.slug ? (
                <FieldError>{errors.slug}</FieldError>
              ) : live ? (
                <p className={hint}>Changing this breaks links people have already shared.</p>
              ) : (
                <p className={hint}>Follows the title until you edit it.</p>
              )}
            </div>
          </section>

          <section className={`${panel} p-5`} aria-labelledby="search">
            <h2 id="search" className="text-sm font-semibold text-ink">
              Search result
            </h2>

            {/* Roughly how Google lays the result out, so the admin can see
                where the description gets cut. */}
            <div className="mt-4 rounded-md bg-surface-muted p-4" aria-hidden="true">
              <p className="truncate text-xs text-ink-muted">
                {domain} › blog › {form.slug || "…"}
              </p>
              <p className="mt-1 line-clamp-2 text-[15px] leading-snug font-medium text-[#1a4fb3] dark:text-[#9dbcf5]">
                {form.title || "Post title"} | MatriGuard
              </p>
              <p className="mt-1 line-clamp-3 text-xs leading-5 text-ink-muted">
                {form.metaDescription || form.excerpt || "The summary appears here until you write a description."}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="post-meta" className={label}>
                Description for search engines
              </label>
              <textarea
                id="post-meta"
                rows={3}
                value={form.metaDescription}
                maxLength={LIMITS.metaDescription}
                onChange={(event) => update({ metaDescription: event.target.value.replace(/\n/g, " ") })}
                placeholder="Optional. Uses the summary if left empty."
                className={`${input} resize-none`}
              />
              <p className={cx(hint, "flex justify-end")}>
                <Counter value={form.metaDescription.length} max={LIMITS.metaDescription} />
              </p>
            </div>
          </section>

          <p className="px-1 text-xs text-ink-faint">
            <span className="font-mono tabular-nums">{words.toLocaleString("en-IN")}</span> words, about{" "}
            <span className="font-mono tabular-nums">{readingMinutes(form.contentHtml)}</span> min read
          </p>

          {post && <DeletePost id={post.id} title={form.title} live={live} />}
        </aside>
      </div>
    </div>
  );
}

function FieldError({ id, className, children }: { id?: string; className?: string; children: string }) {
  return (
    <p id={id} className={cx("mt-1 flex items-center gap-1.5 text-xs text-danger", className)}>
      <WarningCircle size={14} weight="fill" className="shrink-0" />
      {children}
    </p>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={cx("font-mono tabular-nums", value > max * 0.9 ? "text-warn" : undefined)}>
      {value}/{max}
    </span>
  );
}
