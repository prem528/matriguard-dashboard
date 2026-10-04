import { connection } from "next/server";
import { PUBLIC_CACHE, publicSummary, unavailable } from "@/lib/posts/public";
import { listPublished } from "@/lib/posts/store";

/** GET /api/public/posts: every live post, newest first, without bodies. */
export async function GET() {
  // Read the database per request; never bake a list into the build.
  await connection();

  try {
    const posts = await listPublished();
    return Response.json(
      { posts: posts.map(publicSummary) },
      { headers: { "Cache-Control": PUBLIC_CACHE } }
    );
  } catch (error) {
    return unavailable(error);
  }
}
