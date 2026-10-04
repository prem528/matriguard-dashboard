import { connection } from "next/server";
import { PUBLIC_CACHE, publicPost, unavailable } from "@/lib/posts/public";
import { getPublishedBySlug } from "@/lib/posts/store";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** GET /api/public/posts/<slug>: one live post with its body, or 404. */
export async function GET(_request: Request, { params }: RouteContext<"/api/public/posts/[slug]">) {
  await connection();

  const { slug } = await params;
  if (!SLUG.test(slug) || slug.length > 90) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const post = await getPublishedBySlug(slug);
    if (!post) {
      return Response.json({ error: "Not found." }, { status: 404, headers: { "Cache-Control": PUBLIC_CACHE } });
    }
    return Response.json({ post: publicPost(post) }, { headers: { "Cache-Control": PUBLIC_CACHE } });
  } catch (error) {
    return unavailable(error);
  }
}
