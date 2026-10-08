/** Validate newly structured client profile fields before MongoDB casts them. */
export function validateClientProfileFields(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "invalid client data";
  const body = value as Record<string, unknown>;

  for (const field of ["slatBoard", "offStand", "sample"] as const) {
    if (field in body && typeof body[field] !== "boolean") {
      return `${field} must be true or false`;
    }
  }
  if ("specialInformation" in body && typeof body.specialInformation !== "string") {
    return "specialInformation must be text";
  }
  for (const field of ["clientSource", "theme", "sampleNotes"] as const) {
    if (!(field in body)) continue;
    if (typeof body[field] !== "string") return `${field} must be text`;
    const maxLength = field === "sampleNotes" ? 2000 : 500;
    if (body[field].length > maxLength) return `${field} is too long`;
  }
  if ("barcodeImage" in body && typeof body.barcodeImage !== "string") {
    return "barcodeImage must be an image URL";
  }
  if ("barcodeImages" in body && (!Array.isArray(body.barcodeImages) || body.barcodeImages.some((url: unknown) => typeof url !== "string"))) {
    return "barcodeImages must be a list of image URLs";
  }
  if ("specialInformationDate" in body) {
    const date = body.specialInformationDate;
    if (typeof date !== "string") return "specialInformationDate must be a date";
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)) {
      return "specialInformationDate must be a valid YYYY-MM-DD date";
    }
  }
  return null;
}

/** Preserve a legacy single barcode while supporting a list of hosted image URLs. */
export function normalizeClientBarcodeImages(images: unknown, primary: unknown): string[] {
  const urls = Array.isArray(images) ? images : [];
  const normalized = urls
    .filter((url): url is string => typeof url === "string")
    .map((url) => url.trim())
    .filter(Boolean);
  if (normalized.length === 0 && typeof primary === "string" && primary.trim()) {
    normalized.push(primary.trim());
  }
  return [...new Set(normalized)];
}

/** Keep the legacy primary URL in sync for orders, invoices and planograms. */
export function syncClientBarcodeFields(body: Record<string, unknown>): void {
  if (!("barcodeImages" in body) && !("barcodeImage" in body)) return;
  const images = "barcodeImages" in body
    ? normalizeClientBarcodeImages(body.barcodeImages, undefined)
    : normalizeClientBarcodeImages(undefined, body.barcodeImage);
  body.barcodeImages = images;
  body.barcodeImage = images[0] ?? "";
}
