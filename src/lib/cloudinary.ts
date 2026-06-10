// Browser-direct (unsigned) Cloudinary image upload.
// Configure via NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function cloudinaryConfigured(): boolean {
  return Boolean(CLOUD && PRESET);
}

/** Upload an image file to Cloudinary; returns the secure URL. */
export async function uploadImage(file: File): Promise<string> {
  if (!CLOUD || !PRESET) {
    throw new Error("Image upload is not configured (set NEXT_PUBLIC_CLOUDINARY_* env vars).");
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
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
  return data.secure_url as string;
}

/** Derive a small, optimized thumbnail URL from a Cloudinary image URL. */
export function thumbUrl(url: string | null | undefined, size = 120): string {
  if (!url) return "";
  if (!url.includes("/upload/")) return url; // non-Cloudinary or already transformed
  return url.replace("/upload/", `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
}
