"use client";

import { useState } from "react";
import { ImageSquare } from "@phosphor-icons/react";

/**
 * Small cover preview for lists. Falls back to a quiet placeholder when
 * there is no image, or when it cannot load (seeded covers are served by
 * the website, which may be down or not running locally).
 */
export default function CoverThumb({
  src,
  position,
  className = "h-11 w-16 rounded-md",
}: {
  src: string | null;
  position: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={`${className} flex shrink-0 items-center justify-center bg-surface-muted text-ink-faint`}
      >
        <ImageSquare size={18} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- covers come from two origins; the site optimises them, the panel only previews.
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 bg-surface-muted object-cover`}
      style={{ objectPosition: position }}
    />
  );
}
