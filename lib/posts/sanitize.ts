import sanitizeHtml from "sanitize-html";

/**
 * The only markup a post may contain: what the editor toolbar can produce.
 * Anything pasted in from Word or another site is reduced to this.
 */
export function sanitizePostHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "h3", "strong", "em", "u", "s", "a",
      "ul", "ol", "li", "blockquote", "hr", "br", "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: [] },
    allowProtocolRelative: false,
    // Images must be ones uploaded here; nothing hot-linked from elsewhere.
    exclusiveFilter: (frame) =>
      frame.tag === "img" && !/^\/uploads\/[a-z0-9-]+\.(jpe?g|png|webp|avif)$/.test(frame.attribs.src ?? ""),
    transformTags: {
      h1: "h2",
      h4: "h3",
      h5: "h3",
      h6: "h3",
      b: "strong",
      i: "em",
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const clean: Record<string, string> = { href };
        if (/^https?:\/\//.test(href)) {
          clean.target = "_blank";
          clean.rel = "noopener noreferrer";
        }
        return { tagName, attribs: clean };
      },
    },
  })
    // The editor always leaves an empty paragraph to type into at the end.
    .replace(/(<p>\s*<\/p>\s*)+$/, "")
    .trim();
}
