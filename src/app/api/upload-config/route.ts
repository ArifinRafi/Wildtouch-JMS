import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Returns the Cloudinary upload config at request time (server env), so it
 * never depends on NEXT_PUBLIC build-time inlining or cached bundles.
 * Cloud name + unsigned preset are public by design.
 */
export function GET() {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "";
  const preset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || "";

  return NextResponse.json(
    { configured: Boolean(cloudName && preset), cloudName, preset },
    { headers: { "Cache-Control": "no-store" } },
  );
}
