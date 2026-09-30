"use client";

import { useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ImageSquare,
  LinkSimple,
  ListBullets,
  ListNumbers,
  Minus,
  Paragraph,
  Quotes,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextUnderline,
} from "@phosphor-icons/react";
import { uploadImage } from "@/lib/upload-client";
import { button, cx, hint, input, label } from "@/lib/ui";

interface RichTextProps {
  initialHtml: string;
  onChange: (html: string) => void;
  invalid?: boolean;
  describedBy?: string;
}

type Bar = null | "link" | "image";

export default function RichText({ initialHtml, onChange, invalid, describedBy }: RichTextProps) {
  const [bar, setBar] = useState<Bar>(null);

  const editor = useEditor({
    // The page is server-rendered; ProseMirror needs the DOM.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      // Only images uploaded here. Pasted images from other sites would be
      // stripped on save anyway, so they are refused at the door instead.
      Image.extend({ parseHTML: () => [{ tag: 'img[src^="/uploads/"]' }] }).configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Start writing. Use the toolbar for headings, lists and images." }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "article-body",
        "aria-label": "Article",
        "aria-multiline": "true",
        role: "textbox",
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div>
      {/* Sticks under the phone bar plus the editor's action bar (56px each);
          on desktop only the action bar is above it. */}
      <div className="sticky top-28 z-10 -mx-1 border-b border-line bg-canvas px-1 py-2 lg:top-14">
        {editor ? <Toolbar editor={editor} bar={bar} setBar={setBar} /> : <div className="h-9" />}
        {editor && bar === "link" && <LinkBar editor={editor} close={() => setBar(null)} />}
        {editor && bar === "image" && <ImageBar editor={editor} close={() => setBar(null)} />}
      </div>

      <div className={cx("pt-6", invalid && "rounded-md ring-1 ring-danger ring-offset-8 ring-offset-canvas")}>
        {editor ? <EditorContent editor={editor} /> : <EditorSkeleton />}
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="min-h-96 animate-pulse space-y-4 pt-1" aria-hidden="true">
      <div className="h-4 w-11/12 rounded bg-surface-muted" />
      <div className="h-4 w-full rounded bg-surface-muted" />
      <div className="h-4 w-9/12 rounded bg-surface-muted" />
    </div>
  );
}

function Toolbar({ editor, bar, setBar }: { editor: Editor; bar: Bar; setBar: (bar: Bar) => void }) {
  // Re-render only when a toolbar state actually changes, not on every keystroke.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      paragraph: editor.isActive("paragraph"),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      link: editor.isActive("link"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5">
      <Tool label="Body text" active={state.paragraph} onClick={() => chain().setParagraph().run()}>
        <Paragraph size={18} />
      </Tool>
      <Tool label="Heading" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <TextHTwo size={18} />
      </Tool>
      <Tool label="Subheading" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <TextHThree size={18} />
      </Tool>

      <Divider />

      <Tool label="Bold (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <TextB size={18} />
      </Tool>
      <Tool label="Italic (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <TextItalic size={18} />
      </Tool>
      <Tool label="Underline (Ctrl+U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
        <TextUnderline size={18} />
      </Tool>
      <Tool label="Link" active={state.link || bar === "link"} onClick={() => setBar(bar === "link" ? null : "link")}>
        <LinkSimple size={18} />
      </Tool>

      <Divider />

      <Tool label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
        <ListBullets size={18} />
      </Tool>
      <Tool label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListNumbers size={18} />
      </Tool>
      <Tool label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quotes size={18} />
      </Tool>
      <Tool label="Divider line" onClick={() => chain().setHorizontalRule().run()}>
        <Minus size={18} />
      </Tool>
      <Tool label="Image" active={bar === "image"} onClick={() => setBar(bar === "image" ? null : "image")}>
        <ImageSquare size={18} />
      </Tool>

      <span className="ml-auto flex gap-0.5">
        <Tool label="Undo (Ctrl+Z)" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <ArrowCounterClockwise size={18} />
        </Tool>
        <Tool label="Redo (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <ArrowClockwise size={18} />
        </Tool>
      </span>
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection: a mousedown on the button would otherwise blur the editor.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors disabled:opacity-35",
        active ? "bg-accent-soft text-accent-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1.5 h-5 w-px bg-line-strong" aria-hidden="true" />;
}

function LinkBar({ editor, close }: { editor: Editor; close: () => void }) {
  const existing = (editor.getAttributes("link").href as string | undefined) ?? "";
  const [href, setHref] = useState(existing);
  const [error, setError] = useState("");

  const apply = () => {
    const value = href.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      close();
      return;
    }
    const url = /^(https?:|mailto:|tel:|\/)/.test(value) ? value : `https://${value}`;
    try {
      if (!url.startsWith("/")) new URL(url);
    } catch {
      setError("That does not look like a web address.");
      return;
    }
    if (editor.state.selection.empty && !editor.isActive("link")) {
      editor.chain().focus().insertContent({ type: "text", text: value, marks: [{ type: "link", attrs: { href: url } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    close();
  };

  return (
    <form
      className="mt-2 flex flex-wrap items-start gap-2 rounded-lg border border-line bg-surface p-3"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <div className="min-w-60 flex-1">
        <label htmlFor="link-href" className="sr-only">
          Link address
        </label>
        <input
          id="link-href"
          autoFocus
          value={href}
          onChange={(event) => {
            setHref(event.target.value);
            setError("");
          }}
          onKeyDown={(event) => event.key === "Escape" && close()}
          placeholder="https://… or /contact"
          aria-invalid={error ? true : undefined}
          className={`${input} h-9`}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
      <button type="submit" className={button.primary}>
        {existing ? "Update link" : "Add link"}
      </button>
      {existing && (
        <button
          type="button"
          className={button.ghost}
          onClick={() => {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            close();
          }}
        >
          Remove
        </button>
      )}
      <button type="button" className={button.ghost} onClick={close}>
        Cancel
      </button>
    </form>
  );
}

function ImageBar({ editor, close }: { editor: Editor; close: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const insert = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const src = await uploadImage(file);
      editor.chain().focus().setImage({ src, alt: alt.trim() }).run();
      close();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 grid gap-3 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="inline-image" className={label}>
          Image
        </label>
        <input
          id="inline-image"
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="text-sm text-ink-muted file:mr-3 file:h-9 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:text-sm file:font-medium file:text-ink"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="inline-alt" className={label}>
          Description
        </label>
        <input
          id="inline-alt"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder="What the image shows"
          className={`${input} h-9`}
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={insert} disabled={busy} className={button.primary}>
          {busy ? "Uploading…" : "Insert"}
        </button>
        <button type="button" onClick={close} className={button.ghost}>
          Cancel
        </button>
      </div>
      <p className={`${hint} sm:col-span-3`}>
        {error ? <span className="text-danger">{error}</span> : "JPG, PNG, WebP or AVIF, up to 5 MB. The description is read aloud to blind readers and helps search."}
      </p>
    </div>
  );
}
