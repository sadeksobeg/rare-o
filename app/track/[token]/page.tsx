import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { consumeRateLimit } from "@/lib/auth/public-rate-limit";
import { getRequestDictionary } from "@/lib/i18n/server";
import {
  SHIPMENT_STATUS_AR,
  SHIPMENT_STATUS_EN,
  getPublicTracking,
} from "@/lib/shipping/shipments";
import { formatDate, formatListDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "تتبع الشحنة · Shipment tracking",
  robots: { index: false, follow: false, nocache: true },
};

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ||
    h.get("x-real-ip")?.trim().slice(0, 64) ||
    "anon";
  const { locale } = await getRequestDictionary();
  const ar = locale === "ar";
  const limited = consumeRateLimit({
    scope: "track",
    identity: ip,
    max: 30,
    windowMs: 60_000,
  });
  if (!limited.allowed) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p role="alert">
          {ar ? "طلبات كثيرة، حاول بعد قليل." : "Too many requests, try again shortly."}
        </p>
      </main>
    );
  }
  const t = await getPublicTracking(token);
  if (!t) notFound();
  const label = (s: string) =>
    (ar ? SHIPMENT_STATUS_AR : SHIPMENT_STATUS_EN)[s] ?? s;

  return (
    <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-10 [&>header]:rounded-2xl [&>header]:border [&>header]:border-current/15 [&>header]:p-5">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide opacity-70">RARE OUD</p>
        <h1 className="text-2xl font-semibold">
          {ar ? "تتبع الشحنة" : "Shipment tracking"}
        </h1>
        <p className="text-lg font-medium">{label(t.status)}</p>
        <p className="text-sm opacity-80">
          {t.destCountry}
          {t.carrierLabel ? ` · ${t.carrierLabel}` : ""}
          {t.trackingNumber ? (
            <>
              {" · "}
              <bdi dir="ltr">{t.trackingNumber}</bdi>
            </>
          ) : null}
        </p>
      </header>
      <ol className="space-y-3 border-s border-current/20 ps-4">
        {[...t.events].reverse().map((e, i) => (
          <li key={`${e.at}-${i}`} className="space-y-0.5">
            <p className="font-medium">{label(e.status)}</p>
            {e.note ? <p className="text-sm opacity-80">{e.note}</p> : null}
            <p className="text-xs opacity-60">
              <bdi dir="ltr">
                {formatListDate(e.at)}{" "}
                {formatDate(e.at, locale, { hour: "2-digit", minute: "2-digit", hour12: false })}
              </bdi>
            </p>
          </li>
        ))}
      </ol>
    </main>
  );
}
