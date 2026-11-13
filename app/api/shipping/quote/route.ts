import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/auth/public-rate-limit";
import { quote, type QuoteAudience } from "@/lib/shipping/engine";

export const dynamic = "force-dynamic";

type Body = {
  destinationCode?: string;
  weightKg?: number | null;
  audience?: QuoteAudience;
  items?: { productId?: string; qty: number; weightKg?: number | null }[];
};

function clientKey(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim().slice(0, 64);
  return req.headers.get("x-real-ip")?.trim().slice(0, 64) || "anon";
}

/**
 * Public read-only shipping quote. Never returns unverified rates.
 * Client totals are display-only; submit paths re-quote server-side.
 */
export async function POST(req: Request) {
  const limited = consumeRateLimit({
    scope: "shipping-quote",
    identity: clientKey(req),
    max: 60,
    windowMs: 60_000,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec ?? 60) } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const destinationCode =
    typeof body.destinationCode === "string" ? body.destinationCode.trim() : "";
  if (!destinationCode || destinationCode.length > 32) {
    return NextResponse.json({ ok: false, error: "DESTINATION_REQUIRED" }, { status: 400 });
  }

  const audience: QuoteAudience =
    body.audience === "TRADER" ? "TRADER" : "CUSTOMER";

  const weightKg =
    body.weightKg == null ? null : Number(body.weightKg);
  if (weightKg != null && (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 10_000)) {
    return NextResponse.json({ ok: false, error: "WEIGHT_INVALID" }, { status: 400 });
  }

  const items = Array.isArray(body.items)
    ? body.items
        .slice(0, 50)
        .map((i) => ({
          productId: typeof i.productId === "string" ? i.productId.slice(0, 64) : undefined,
          qty: Math.max(0, Math.min(999, Math.floor(Number(i.qty) || 0))),
          weightKg:
            i.weightKg == null ? null : Number(i.weightKg),
        }))
        .filter((i) => i.qty > 0)
    : [];

  try {
    const result = await quote({
      destinationCode,
      weightKg,
      items,
      audience,
      // Never allow public callers to preview unverified notebook rates.
      includeUnverified: false,
    });

    return NextResponse.json({
      ok: true,
      destinationCode: result.destinationCode,
      destination: result.destination,
      weightKg: result.weightKg,
      weightSource: result.weightSource,
      inquiry: result.inquiry,
      inquiryReason: result.inquiryReason,
      inquiryNote: result.inquiryNote,
      methods: result.methods.map((m) => ({
        code: m.methodCode,
        labelAr: m.labelAr,
        labelEn: m.labelEn,
        mode: m.mode,
        speed: m.speed,
        security: m.security,
        consolidation: m.consolidation,
        note: m.note,
        amount: m.price.total,
        currency: m.price.currency,
        alternate: m.price.alt
          ? { amount: m.price.alt.amount, currency: m.price.alt.currency }
          : null,
        rateId: m.rateId,
      })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "QUOTE_FAILED" }, { status: 500 });
  }
}
