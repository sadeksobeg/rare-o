/**
 * Customer identity rules for retail requests (owner requirement):
 * a three-part name and a reachable phone number are mandatory — the team
 * confirms every request on WhatsApp, so both must be usable.
 */

/** Letters of any script (Arabic, Latin…); punctuation/digits do not count as a name part. */
function nameParts(name: string): string[] {
  return name
    .normalize("NFKC")
    .replace(/[^\p{L}\p{M}\s'’-]/gu, " ")
    .split(/\s+/)
    .map((p) => p.trim())
    .filter((p) => [...p.replace(/[\p{M}'’-]/gu, "")].length >= 2);
}

export function isFullName(name: string | null | undefined): boolean {
  return nameParts(name ?? "").length >= 3;
}

/** Digits with optional leading +, 8–15 digits (E.164 range); spaces/dashes/brackets tolerated. */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/[^\d]/g, "");
}

export function isValidPhone(phone: string | null | undefined): boolean {
  const raw = (phone ?? "").trim();
  if (!/^\+?[\d\s().-]+$/.test(raw)) return false;
  const d = normalizePhoneDigits(raw);
  return d.length >= 8 && d.length <= 15;
}

export const FULL_NAME_MESSAGE = {
  ar: "الاسم الثلاثي مطلوب (الاسم واسم الأب والكنية).",
  en: "Full name is required (first, father's and family name).",
} as const;

export const PHONE_MESSAGE = {
  ar: "أدخل رقم هاتف صحيحاً مع رمز الدولة (مثل +963…) — نتواصل معك عليه عبر واتساب.",
  en: "Enter a valid phone number with country code (e.g. +963…) — we confirm your request on WhatsApp.",
} as const;
