/** Client-safe brokerage media helpers — no Node / sharp imports. */

export const BROKERAGE_MAX_PHOTOS = 6;
export const BROKERAGE_MAX_BYTES = 8 * 1024 * 1024;

export const BROKERAGE_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type BrokerageMediaError = "TYPE" | "SIZE" | "MAX" | "GENERIC";

/** Served only through the authenticated route handler — see
 *  app/api/media/brokerage/[requestId]/[file]/route.ts. Never under public/. */
export const BROKERAGE_MEDIA_URL_PREFIX = "/api/media/brokerage/";

export function parsePhotoPaths(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is string =>
        typeof p === "string" && p.startsWith(BROKERAGE_MEDIA_URL_PREFIX)
    );
  } catch {
    return [];
  }
}

export function mergePhotoPaths(
  existingJson: string | null | undefined,
  added: string[]
): string[] {
  const existing = parsePhotoPaths(existingJson);
  const merged = [...existing];
  for (const p of added) {
    if (!merged.includes(p) && merged.length < BROKERAGE_MAX_PHOTOS) {
      merged.push(p);
    }
  }
  return merged.slice(0, BROKERAGE_MAX_PHOTOS);
}

export function mediaErrorMessage(
  code: BrokerageMediaError,
  locale: string
): string {
  const ar = locale === "ar";
  switch (code) {
    case "TYPE":
      return ar
        ? "صيغة الصورة غير مدعومة (JPEG / PNG / WebP فقط)."
        : "Unsupported image type (JPEG / PNG / WebP only).";
    case "SIZE":
      return ar
        ? "حجم الصورة يتجاوز 8 ميغابايت."
        : "Image exceeds 8 MB.";
    case "MAX":
      return ar
        ? `الحد الأقصى ${BROKERAGE_MAX_PHOTOS} صور.`
        : `Maximum ${BROKERAGE_MAX_PHOTOS} photos.`;
    default:
      return ar ? "تعذّر رفع الصور." : "Could not upload photos.";
  }
}
