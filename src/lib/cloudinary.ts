// Browser image upload to Cloudinary (unsigned). Config is fetched at runtime
// from /api/upload-config (server env) so it never depends on NEXT_PUBLIC
// build-time inlining or stale bundles.

interface UploadConfig { configured: boolean; cloudName: string; preset: string }

let cached: UploadConfig | null = null;

export async function getUploadConfig(): Promise<UploadConfig> {
  if (cached) return cached;
  try {
    const res = await fetch("/api/upload-config", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load image upload configuration");
    const config = (await res.json()) as UploadConfig;
    if (config.configured) cached = config;
    return config;
  } catch {
    return { configured: false, cloudName: "", preset: "" };
  }
}

/** Upload an image file to Cloudinary; returns the secure URL. */
export async function uploadImage(file: File): Promise<string> {
  const cfg = await getUploadConfig();
  if (!cfg.configured) {
    throw new Error("Image upload is not configured (set Cloudinary env vars on the server / Vercel).");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", cfg.preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    let msg = "Upload failed";
    try {
      const e = await res.json();
      msg = e?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  if (typeof data.secure_url !== "string" || !data.secure_url.startsWith("https://")) {
    throw new Error("Image hosting did not return a secure image URL.");
  }
  return data.secure_url;
}

/** Derive a small, optimized thumbnail URL from a Cloudinary image URL. */
export function thumbUrl(url: string | null | undefined, size = 120): string {
  if (!url) return "";
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
}
