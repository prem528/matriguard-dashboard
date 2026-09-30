import Link from "next/link";
import { button } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-ink-faint">404</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-ink">That page is not here</h1>
      <p className="mt-2 max-w-[42ch] text-sm leading-6 text-ink-muted">
        The post may have been deleted, or the link was copied incompletely.
      </p>
      <Link href="/posts" className={`${button.primary} mt-8`}>
        Back to posts
      </Link>
    </div>
  );
}
