import PostEditor from "@/components/editor/PostEditor";
import { requireAdmin } from "@/lib/auth/session";
import { siteUrl } from "@/lib/media";
import { listCategories } from "@/lib/posts/store";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireAdmin();
  return <PostEditor post={null} categories={await listCategories()} siteUrl={siteUrl()} />;
}
