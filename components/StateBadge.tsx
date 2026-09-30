import { STATE_LABEL } from "@/lib/posts/format";
import type { PostState } from "@/lib/posts/types";

const TONE: Record<PostState, string> = {
  published: "bg-ok-soft text-ok",
  scheduled: "bg-warn-soft text-warn",
  draft: "bg-surface-muted text-ink-muted",
};

export default function StateBadge({ state }: { state: PostState }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${TONE[state]}`}
    >
      {STATE_LABEL[state]}
    </span>
  );
}
