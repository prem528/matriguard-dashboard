"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Trash } from "@phosphor-icons/react";
import { deletePost } from "@/lib/posts/actions";
import { button } from "@/lib/ui";

export default function DeletePost({ id, title, live }: { id: string; title: string; live: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center gap-2 self-start rounded-md px-1 py-1 text-xs font-medium text-ink-faint transition-colors hover:text-danger"
      >
        <Trash size={15} />
        Delete this post
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-lg border border-line bg-surface p-0 text-ink shadow-panel backdrop:bg-[#080d1a]/55"
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => event.target === dialogRef.current && dialogRef.current?.close()}
      >
        <div className="p-6">
          <h2 id="delete-title" className="text-base font-semibold">
            Delete &ldquo;{title || "Untitled draft"}&rdquo;?
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {live
              ? "It comes off the website straight away, and anyone following a link to it will land on a missing page. This cannot be undone."
              : "The draft and its text are removed for good. This cannot be undone."}
          </p>
        </div>
        <form
          action={deletePost.bind(null, id)}
          className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-6 py-4"
        >
          <button type="button" className={button.secondary} onClick={() => dialogRef.current?.close()}>
            Keep it
          </button>
          <ConfirmButton />
        </form>
      </dialog>
    </>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={button.danger} disabled={pending}>
      {pending ? "Deleting…" : "Delete post"}
    </button>
  );
}
