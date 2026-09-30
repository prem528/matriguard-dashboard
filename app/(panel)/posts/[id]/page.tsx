import { notFound } from "next/navigation";
import PostEditor from "@/components/editor/PostEditor";
import { requireAdmin } from "@/lib/auth/session";
import { siteUrl } from "@/lib/media";
import { getPost, listCategories } from "@/lib/posts/store";

export async function generateMetadata({ params }: PageProps<"/posts/[id]">) {
  const post = await getPost((await params).id);
  return { title: post?.title || "Untitled draft" };
}

export default async function EditPostPage({ params }: PageProps<"/posts/[id]">) {
  await requireAdmin();

  const { id } = await params;
  const [post, categories] = await Promise.all([getPost(id), listCategories()]);
  if (!post) notFound();

  // Not keyed by updatedAt: a save refreshes this page, and remounting would
  // throw away the cursor position and undo history mid-edit.
  return <PostEditor post={post} categories={categories} siteUrl={siteUrl()} />;
}
