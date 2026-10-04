import { getMedia } from "@/lib/media-store";

/** Exactly the names the upload route generates. */
const NAME = /^[a-z0-9]+-[a-f0-9]{12}\.(jpg|png|webp|avif)$/;

/**
 * Serves an uploaded image from the database. Names are random and never
 * reused, so browsers and the website may cache them for a year.
 */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[file]">) {
  const { file } = await params;
  if (!NAME.test(file)) return new Response("Not found", { status: 404 });

  let media;
  try {
    media = await getMedia(file);
  } catch (error) {
    console.error("Uploads: database unavailable.", error);
    return new Response("Temporarily unavailable", { status: 503, headers: { "Retry-After": "30" } });
  }
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(media.bytes), {
    headers: {
      "Content-Type": media.mime,
      "Content-Length": String(media.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
