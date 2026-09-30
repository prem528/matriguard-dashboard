"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { button } from "@/lib/ui";

export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <WarningCircle size={32} className="text-danger" />
      <h1 className="mt-4 text-xl font-semibold text-ink">Something went wrong loading this screen</h1>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        Nothing you saved has been lost. Try again, and if it keeps happening, the server log will say why.
      </p>
      <button type="button" onClick={reset} className={`${button.primary} mt-8`}>
        Try again
      </button>
    </div>
  );
}
