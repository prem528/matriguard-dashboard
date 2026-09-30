/**
 * Turns a stored image path into something a browser can load from the
 * panel. Uploads are served here; seeded covers still live on the website.
 * Client-safe: siteUrl is passed in rather than read from the environment.
 */
export function mediaSrc(path: string | null, siteUrl: string) {
  if (!path) return null;
  if (path.startsWith("/uploads/")) return path;
  return siteUrl ? `${siteUrl}${path}` : null;
}

export function siteUrl() {
  return (process.env.SITE_URL ?? "").replace(/\/+$/, "");
}
