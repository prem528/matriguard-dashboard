"use client";

import { useRef, useState, type DragEvent } from "react";
import { ArrowsClockwise, ImageSquare, Trash } from "@phosphor-icons/react";
import { mediaSrc } from "@/lib/media";
import { COVER_POSITIONS } from "@/lib/posts/format";
import { uploadImage } from "@/lib/upload-client";
import { button, cx, hint, input, label } from "@/lib/ui";

interface CoverFieldProps {
  value: string | null;
  alt: string;
  position: string;
  siteUrl: string;
  error?: string;
  onChange: (patch: { coverImage?: string | null; coverAlt?: string; coverPosition?: string }) => void;
}

export default function CoverField({ value, alt, position, siteUrl, error, onChange }: CoverFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  const src = mediaSrc(value, siteUrl);
  const message = uploadError || error;

  const take = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setUploadError("");
    try {
      onChange({ coverImage: await uploadImage(file) });
    } catch (reason) {
      setUploadError((reason as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void take(event.dataTransfer.files[0]);
  };

  const picker = (
    <input
      ref={fileRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/avif"
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => void take(event.target.files?.[0])}
    />
  );

  if (!value) {
    return (
      <div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={busy}
          aria-describedby={message ? "cover-error" : undefined}
          className={cx(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-accent bg-accent-soft" : "border-line-strong hover:border-ink-faint hover:bg-surface",
            message && "border-danger"
          )}
        >
          {busy ? (
            <span className="text-sm text-ink-muted">Uploading…</span>
          ) : (
            <>
              <ImageSquare size={26} className="text-ink-faint" />
              <span className="text-sm font-medium text-ink">Add a cover image</span>
              <span className="text-xs text-ink-faint">Drop a file here or click to choose. Wide images crop best.</span>
            </>
          )}
        </button>
        {picker}
        {message && (
          <p id="cover-error" className="mt-2 text-xs text-danger">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className={cx("relative overflow-hidden rounded-lg bg-surface-muted", dragging && "ring-2 ring-accent")}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview only; the website serves the optimised copy.
          <img
            src={src}
            alt=""
            className="aspect-video w-full object-cover transition-[object-position] duration-300"
            style={{ objectPosition: position }}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-ink-faint">
            This cover lives on the website. Set SITE_URL to preview it here.
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-canvas/70 text-sm font-medium text-ink">
            Uploading…
          </div>
        )}
      </div>
      {picker}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Keep which part in view</legend>
          <span className="text-xs text-ink-muted" aria-hidden="true">
            Focus
          </span>
          <span className="flex rounded-md border border-line-strong p-0.5">
            {COVER_POSITIONS.map((option) => (
              <label
                key={option.value}
                className={cx(
                  "cursor-pointer rounded px-2.5 py-1 text-xs transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent",
                  position === option.value ? "bg-surface-muted font-medium text-ink" : "text-ink-muted hover:text-ink"
                )}
              >
                <input
                  type="radio"
                  name="cover-position"
                  value={option.value}
                  checked={position === option.value}
                  onChange={() => onChange({ coverPosition: option.value })}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </span>
        </fieldset>

        <span className="flex gap-1">
          <button type="button" className={button.ghost} onClick={() => fileRef.current?.click()} disabled={busy}>
            <ArrowsClockwise size={16} />
            Replace
          </button>
          <button
            type="button"
            className={`${button.ghost} hover:text-danger`}
            onClick={() => onChange({ coverImage: null })}
            disabled={busy}
          >
            <Trash size={16} />
            Remove
          </button>
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="cover-alt" className={label}>
          Image description
        </label>
        <input
          id="cover-alt"
          value={alt}
          maxLength={160}
          onChange={(event) => onChange({ coverAlt: event.target.value })}
          placeholder="e.g. Two families meeting over tea"
          className={input}
        />
        <p className={hint}>Read aloud to blind visitors. Leave empty if the image is purely decorative.</p>
      </div>

      {message && <p className="mt-2 text-xs text-danger">{message}</p>}
    </div>
  );
}
