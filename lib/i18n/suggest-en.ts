import { transliterateArabic } from "@/lib/catalog/slug";

/**
 * Draft Arabic → English suggestion for catalog admin fields.
 * Tries MyMemory, then Google gtx (unofficial), then a local glossary /
 * transliteration draft. Result is always a draft — admin must review
 * (storefront copy should be real translations).
 */
export async function suggestEnglishFromArabic(
  text: string
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const q = text.trim();
  if (!q) return { ok: false, error: "EMPTY" };
  if (q.length > 4500) return { ok: false, error: "TOO_LONG" };

  const fromMemory = await tryMyMemory(q);
  if (fromMemory) return { ok: true, text: fromMemory };

  const fromGtx = await tryGoogleGtx(q);
  if (fromGtx) return { ok: true, text: fromGtx };

  const local = localDraftEnglish(q);
  if (local) return { ok: true, text: local };

  return { ok: false, error: "UPSTREAM" };
}

/** Common catalog phrases / words — longest first for phrase replace. */
const GLOSSARY: [string, string][] = [
  ["آلات موسيقية وترية", "stringed musical instruments"],
  ["خشب الورد الهندي", "Indian rosewood"],
  ["خشب الورد", "rosewood"],
  ["جوز أمريكي", "American walnut"],
  ["خشب الجوز", "walnut"],
  ["خشب الصنوبر", "spruce"],
  ["خشب الأرز", "cedar"],
  ["خشب الأبنوس", "ebony"],
  ["خشب القيقب", "maple"],
  ["لوحة الأصابع", "fingerboard"],
  ["مربط الأوتار", "bridge"],
  ["طلاء لامع", "gloss finish"],
  ["طلاء مطفي", "matte finish"],
  ["عود كلاسيكي نادر", "rare classic oud"],
  ["عود كلاسيكي", "classic oud"],
  ["عود احترافي", "professional oud"],
  ["عود اقتصادي", "economy oud"],
  ["عود متوسط", "mid-range oud"],
  ["عود نادر", "rare oud"],
  ["عود VIP", "VIP oud"],
  ["موالف رقمي", "digital tuner"],
  ["حمالة جلد", "leather strap"],
  ["إكسسوارات", "accessories"],
  ["كلاسيكي", "classic"],
  ["احترافي", "professional"],
  ["اقتصادي", "economy"],
  ["متوسط", "mid-range"],
  ["رقمي", "digital"],
  ["موالف", "tuner"],
  ["نادر", "rare"],
  ["جلد", "leather"],
  ["حمالة", "strap"],
  ["الظهر", "back"],
  ["الوجه", "face"],
  ["المفاتيح", "pegs"],
  ["الطلاء", "finish"],
  ["طلاء", "finish"],
  ["لامع", "gloss"],
  ["مطفي", "matte"],
  ["صنوبر", "spruce"],
  ["أرز", "cedar"],
  ["أبنوس", "ebony"],
  ["قيقب", "maple"],
  ["جوز", "walnut"],
  ["عود", "oud"],
];

function localDraftEnglish(q: string): string | null {
  let remaining = q;
  const parts: string[] = [];

  // Phrase / word greedy replace (longest glossary entries first)
  const sorted = [...GLOSSARY].sort((a, b) => b[0].length - a[0].length);
  while (remaining.trim()) {
    let matched = false;
    const trimmed = remaining.trimStart();
    const leadingWs = remaining.length - trimmed.length;
    if (leadingWs) {
      parts.push(remaining.slice(0, leadingWs));
      remaining = trimmed;
    }
    for (const [ar, en] of sorted) {
      if (remaining.startsWith(ar)) {
        parts.push(en);
        remaining = remaining.slice(ar.length);
        matched = true;
        break;
      }
    }
    if (matched) continue;
    // Take one Arabic / Latin token
    const m = remaining.match(/^[\u0600-\u06FFA-Za-z0-9]+|^./u);
    if (!m) break;
    const token = m[0];
    if (/[\u0600-\u06FF]/.test(token)) {
      const latin = transliterateArabic(token).replace(/-/g, "");
      parts.push(latin || token);
    } else {
      parts.push(token);
    }
    remaining = remaining.slice(token.length);
  }

  const joined = parts.join("").replace(/\s+/g, " ").trim();
  if (!joined) return null;
  // Title-case words for a readable draft name
  return joined
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

async function tryMyMemory(q: string): Promise<string | null> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", q.slice(0, 450));
  url.searchParams.set("langpair", "ar|en");
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string };
    };
    const translated = data.responseData?.translatedText?.trim() ?? "";
    if (!translated || data.responseStatus !== 200) return null;
    if (translated === q) return null;
    return translated;
  } catch {
    return null;
  }
}

async function tryGoogleGtx(q: string): Promise<string | null> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "ar");
  url.searchParams.set("tl", "en");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", q.slice(0, 900));
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const parts = (data[0] as unknown[])
      .map((row) => (Array.isArray(row) && typeof row[0] === "string" ? row[0] : ""))
      .join("");
    const translated = parts.trim();
    if (!translated || translated === q) return null;
    return translated;
  } catch {
    return null;
  }
}
