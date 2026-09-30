"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowSquareOut,
  Article,
  List,
  PencilSimpleLine,
  SignOut,
  SquaresFour,
  X,
} from "@phosphor-icons/react";
import Wordmark from "@/components/Wordmark";
import { logout } from "@/lib/auth/actions";
import { cx } from "@/lib/ui";

const NAV = [
  { href: "/", label: "Overview", icon: SquaresFour },
  { href: "/posts", label: "Posts", icon: Article },
];

interface RailProps {
  name: string;
  email: string;
  siteUrl: string;
}

export default function Rail({ name, email, siteUrl }: RailProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || (pathname.startsWith(`${href}/`) && pathname !== "/posts/new");

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/" aria-label="Overview">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1.5 text-rail-ink-muted hover:text-rail-ink lg:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-3 pt-2">
        <Link
          href="/posts/new"
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-accent/60 text-sm font-medium text-rail-ink transition-colors hover:border-accent hover:bg-accent/10 active:translate-y-px"
        >
          <PencilSimpleLine size={17} className="text-accent" />
          Write a post
        </Link>
      </div>

      <nav aria-label="Main" className="mt-6 flex flex-col gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                active
                  ? "bg-rail-active font-medium text-rail-ink"
                  : "text-rail-ink-muted hover:bg-rail-active/60 hover:text-rail-ink"
              )}
            >
              <Icon size={19} weight={active ? "fill" : "regular"} className={active ? "text-accent" : undefined} />
              {label}
            </Link>
          );
        })}

        {siteUrl && (
          <a
            href={`${siteUrl}/blog`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-rail-ink-muted transition-colors hover:bg-rail-active/60 hover:text-rail-ink"
          >
            <ArrowSquareOut size={19} />
            Blog on the website
          </a>
        )}
      </nav>

      <div className="mt-auto border-t border-rail-line px-5 py-4">
        <p className="truncate text-sm font-medium capitalize text-rail-ink">{name}</p>
        <p className="truncate text-xs text-rail-ink-muted">{email}</p>
        <form action={logout} className="mt-3">
          <button
            type="submit"
            className="-ml-2 inline-flex h-8 items-center gap-2 rounded-md px-2 text-xs font-medium text-rail-ink-muted transition-colors hover:bg-rail-active hover:text-rail-ink"
          >
            <SignOut size={16} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Phones and tablets: a slim bar, with the rail as a drawer. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rail-line bg-rail px-4 lg:hidden">
        <Link href="/" aria-label="Overview">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-rail-ink"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <List size={22} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#080d1a]/60"
          />
          {/* Any link tapped inside the drawer closes it on the way out. */}
          <aside
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-rail"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {body}
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-rail-line bg-rail lg:block">
        {body}
      </aside>
    </>
  );
}
