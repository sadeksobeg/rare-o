/** ASCII slug from Latin / digits; strips everything else. */
export function slugifyLatin(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Lightweight Arabic → Latin map for URL tokens when English name is empty. */
const AR_MAP: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "a",
  ة: "h",
  ء: "",
  ئ: "y",
  ؤ: "w",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export function transliterateArabic(raw: string): string {
  let out = "";
  for (const ch of raw.trim()) {
    if (AR_MAP[ch] != null) out += AR_MAP[ch];
    else if (/[a-zA-Z0-9]/.test(ch)) out += ch.toLowerCase();
    else if (/\s|-|_/.test(ch)) out += "-";
  }
  // Domain-friendly: عود → oud (not "awd")
  return out.replace(/(^|[^a-z])awd(?=[^a-z]|$)/gi, "$1oud");
}

/** Prefer English name; fall back to Arabic transliteration; then a safe token. */
export function productSlugCandidate(nameEn: string, nameAr: string): string {
  const fromEn = slugifyLatin(nameEn);
  if (fromEn) return fromEn;
  const fromAr = slugifyLatin(transliterateArabic(nameAr));
  if (fromAr) return fromAr;
  return "product";
}
