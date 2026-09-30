import "server-only";

import path from "node:path";

/**
 * Where posts and uploads live on disk. Outside the build output, so a
 * redeploy (git pull + next build) never touches content.
 * On the server, point DATA_DIR somewhere backed up, e.g. /var/lib/matriguard.
 */
export const DATA_DIR = path.resolve(
  // A runtime location, not source: keep the build tracer out of it.
  /*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(process.cwd(), "data")
);
export const POSTS_FILE = path.join(DATA_DIR, "posts.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
