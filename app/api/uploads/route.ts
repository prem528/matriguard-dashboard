import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/auth/session";
import { UPLOADS_DIR } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024;

/** Identify by content, not by the name or type the browser claims. */
function sniff(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(4, 8) === "ftyp" && ascii(8, 12).startsWith("avi")) return "avif";
  return null;
}

export async function POST(request: Request) {
  if (!(await getSession())) {
    return Response.json({ error: "Sign in again to continue." }, { status: 401 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return Response.json({ error: "That upload did not arrive in one piece." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Images must be 5 MB or smaller." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = sniff(bytes);
  if (!extension) {
    return Response.json({ error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 415 });
  }

  // Unguessable and never reused, so the website can cache it forever.
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${extension}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, name), bytes);

  return Response.json({ url: `/uploads/${name}` }, { status: 201 });
}
