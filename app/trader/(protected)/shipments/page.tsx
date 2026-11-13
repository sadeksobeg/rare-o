import Link from "next/link";
import { Package, Truck } from "lucide-react";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listTraderShipments } from "@/lib/shipping/trader-shipments";
export const dynamic = "force-dynamic";

const STATUS_AR: Record<string, string> = {
  CONFIRMED: "مؤكَّد",
  PACKED: "مغلَّف",
  HANDED_OVER: "سُلِّم للناقل",
  IN_TRANSIT: "في الطريق",
  ARRIVED: "وصل",
  DELIVERED: "تم التسليم",
  FAILED: "تعذّر",
  RETURNED: "مرتجع",
  CANCELLED: "ملغى",
};

export default async function TraderShipmentsPage() {
  const session = await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const rows = await listTraderShipments(session.sub);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--rad-tx-2)]">
          {ar ? "الشحن" : "Shipping"}
        </p>
        <h1 className="text-2xl font-semibold text-[color:var(--rad-tx)]">
          {ar ? "شحناتي" : "My shipments"}
        </h1>
        <p className="max-w-prose text-sm text-[color:var(--rad-tx-2)]">
          {ar
            ? "متابعة شحنات الجملة والوساطة الخاصة بك — التتبع والمستندات تُضاف تدريجياً."
            : "Track your wholesale and brokerage shipments — tracking and documents land next."}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[color:var(--rad-bd)] px-6 py-14 text-center">
          <Truck
            className="size-10 text-[color:var(--rad-tx-2)]"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-sm font-medium text-[color:var(--rad-tx)]">
            {ar ? "لا شحنات بعد" : "No shipments yet"}
          </p>
          <p className="max-w-sm text-xs text-[color:var(--rad-tx-2)]">
            {ar
              ? "عندما يُنشئ الفريق شحنة لطلب جملة أو وساطة، تظهر هنا."
              : "When the team creates a shipment for a wholesale or brokerage request, it appears here."}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link
              href="/trader/wholesale"
              className="rounded-full bg-[color:var(--rad-accent)] px-4 py-2 text-sm font-medium text-white"
            >
              {dict.trader.wholesale}
            </Link>
            <Link
              href="/trader/brokerage"
              className="rounded-full border border-[color:var(--rad-bd)] px-4 py-2 text-sm font-medium"
            >
              {dict.trader.brokerage}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <article className="rounded-2xl border border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] p-4 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.45)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--rad-tx)]">
                      <Package className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                      {r.destCountry || (ar ? "وجهة" : "Destination")}
                      {r.destCity ? ` · ${r.destCity}` : ""}
                    </div>
                    <p className="text-xs text-[color:var(--rad-tx-2)]">
                      {r.methodLabel || (ar ? "طريقة غير محددة" : "Method TBD")}
                      {r.carrierLabel ? ` · ${r.carrierLabel}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[color:var(--rad-c1)] px-2.5 py-1 text-[11px] font-semibold">
                    {ar ? STATUS_AR[r.status] || r.status : r.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[color:var(--rad-tx-2)]">
                  {r.trackingNumber ? (
                    <span>
                      {ar ? "تتبع" : "Tracking"}:{" "}
                      <bdi dir="ltr">{r.trackingNumber}</bdi>
                    </span>
                  ) : (
                    <span>{ar ? "لا رقم تتبع بعد" : "No tracking yet"}</span>
                  )}
                  <bdi dir="ltr" className="font-medium text-[color:var(--rad-tx)]">
                    {r.priceCharged} {r.currency}
                  </bdi>
                  <Link
                    href={`/track/${r.publicToken}`}
                    className="ms-auto font-medium text-[color:var(--rad-accent)] underline-offset-4 hover:underline"
                  >
                    {ar ? "صفحة التتبع" : "Tracking page"}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
