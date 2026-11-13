import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { consumeRateLimit } from "@/lib/auth/public-rate-limit";

export const dynamic = "force-dynamic";

type Body = {
  destination?: string;
  countryCode?: string | null;
  contactName?: string;
  contactPhone?: string;
  audience?: "CUSTOMER" | "TRADER";
  items?: unknown;
  notes?: string;
};

function clientKey(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim().slice(0, 64);
  return req.headers.get("x-real-ip")?.trim().slice(0, 64) || "anon";
}

function sanitize(s: string, max: number) {
  return s.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
}

/** Public ShippingInquiry create — rate-limited, no stack/PII leak. */
export async function POST(req: Request) {
  const limited = consumeRateLimit({
    scope: "shipping-inquiry",
    identity: clientKey(req),
    max: 10,
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

  const destination = sanitize(String(body.destination || ""), 120);
  const contactName = sanitize(String(body.contactName || ""), 120);
  const contactPhone = sanitize(String(body.contactPhone || ""), 40);
  const countryCode = body.countryCode
    ? sanitize(String(body.countryCode), 8).toUpperCase()
    : null;
  const notes = sanitize(String(body.notes || ""), 500);
  const audience = body.audience === "TRADER" ? "TRADER" : "CUSTOMER";

  if (!destination || !contactName || contactPhone.length < 5) {
    return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];

  try {
    const row = await prisma.shippingInquiry.create({
      data: {
        destination,
        countryCode,
        contactName,
        contactPhone,
        notes,
        audience,
        itemsJson: items as object,
        status: "NEW",
      },
      select: { id: true, status: true, createdAt: true },
    });
    return NextResponse.json({
      ok: true,
      id: row.id,
      status: row.status,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "CREATE_FAILED" }, { status: 500 });
  }
}
