/** Browser side of /api/uploads. Resolves to the stored path. */
export async function uploadImage(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");

  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/uploads", { method: "POST", body });
  const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!response.ok || !data?.url) {
    throw new Error(data?.error ?? "The upload failed. Check your connection and try again.");
  }
  return data.url;
}
