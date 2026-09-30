import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

/** Exactly the names the upload route generates, so no path can escape. */
const NAME = /^[a-z0-9]+-[a-f0-9]{12}\.(jpg|png|webp|avif)$/;

export async function GET(_request: Request, { params }: RouteContext<"/uploads/[file]">) {
  const { file } = await params;
  const match = NAME.exec(file);
  if (!match) return new Response("Not found", { status: 404 });

  try {
    const body = await readFile(path.join(UPLOADS_DIR, file));
    return new Response(body, {
      headers: {
        "Content-Type": TYPES[match[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
