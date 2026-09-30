/**
 * Shared class strings. Controls are rounded-md, panels rounded-lg.
 */

const buttonBase =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3.5 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

export const button = {
  primary: `${buttonBase} bg-primary text-primary-ink hover:bg-primary-hover`,
  secondary: `${buttonBase} border border-line-strong bg-surface text-ink hover:border-ink-faint hover:bg-surface-muted`,
  ghost: `${buttonBase} text-ink-muted hover:bg-surface-muted hover:text-ink`,
  danger: `${buttonBase} bg-danger text-surface hover:opacity-90`,
};

export const input =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-ink-faint focus-visible:border-accent aria-invalid:border-danger";

export const label = "text-[13px] font-medium text-ink";

export const hint = "text-xs leading-5 text-ink-faint";

export const panel = "rounded-lg border border-line bg-surface";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
