/** The website's own mark, with a quiet label saying which side of it this is. */
export default function Wordmark({ tone = "rail" }: { tone?: "rail" | "page" }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-serif text-[22px] font-extrabold tracking-wide text-accent">
        MatriGuard
      </span>
      <span
        className={
          tone === "rail"
            ? "text-xs font-medium text-rail-ink-muted"
            : "text-xs font-medium text-ink-faint"
        }
      >
        Admin
      </span>
    </span>
  );
}
