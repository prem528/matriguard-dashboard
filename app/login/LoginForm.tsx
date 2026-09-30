"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  Envelope,
  Eye,
  EyeSlash,
  LockSimple,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { login, type LoginState } from "@/lib/auth/actions";
import { button, input, label } from "@/lib/ui";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [visible, setVisible] = useState(false);

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <p role="alert" className="flex items-start gap-2.5 rounded-lg bg-danger-soft px-3.5 py-3 text-sm leading-normal text-danger">
          <WarningCircle size={18} weight="fill" className="mt-px shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={label}>
          Email
        </label>
        <div className="relative">
          <Envelope size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            defaultValue={state.email}
            placeholder="Email"
            className={`${input} h-12 rounded-lg pl-11 text-[15px] focus-visible:shadow-[0_0_0_4px_rgb(197_146_48/0.16)] focus-visible:outline-none`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={label}>
          Password
        </label>
        <div className="relative">
          <LockSimple size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Your password"
            className={`${input} h-12 rounded-lg pr-12 pl-11 text-[15px] focus-visible:shadow-[0_0_0_4px_rgb(197_146_48/0.16)] focus-visible:outline-none`}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0.5 right-0.5 flex w-11 items-center justify-center rounded-r-lg text-ink-faint transition-colors hover:text-ink"
          >
            {visible ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={pending} className={`${button.primary} h-12.5 rounded-lg text-[15px] font-semibold`}>
        {pending ? "Signing in…" : "Sign in"}
        {/* Gold on the navy button; in dark mode the button is gold, so navy. */}
        {!pending && <ArrowRight size={18} className="text-accent dark:text-primary-ink" />}
      </button>
    </form>
  );
}
