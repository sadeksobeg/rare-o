import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderResponse } from "@/components/storefront/order-response";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { getPublicOrder } from "@/lib/retail-request/order-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "طلبي · My request — RARE OUD",
  robots: { index: false, follow: false, nocache: true },
};

const STATUS: Record<string, [string, string]> = {
  draft: ["مسودة", "Draft"],
  ready_for_handoff: ["بانتظار تواصلك معنا عبر واتساب", "Waiting for your WhatsApp message"],
  handoff_opened: ["وصلنا تواصلك", "We received your message"],
  in_follow_up: ["قيد المتابعة", "In follow-up"],
  completed: ["مكتمل", "Completed"],
  cancelled: ["ملغى", "Cancelled"],
};

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getPublicOrder(token);
  if (!order) notFound();
  const { locale } = await getRequestDictionary();
  const ar = locale === "ar";
  const money = (n: number) =>
    `${formatNumber(n, locale, { maximumFractionDigits: 2 })} ${order.currency}`;
  const closed = order.status === "completed" || order.status === "cancelled";
  const st = STATUS[order.status] ?? [order.status, order.status];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-ro-muted">
          <bdi dir="ltr">{order.reference}</bdi>
        </p>
        <h1 className="ro-type-h1">{ar ? "بيانات طلبك" : "Your request details"}</h1>
        <p className="text-ro-text-2">{ar ? st[0] : st[1]}</p>
      </header>

      {order.response ? (
        <div
          role="status"
          className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-control)] bg-ro-paper p-4 text-sm"
        >
          <p className="font-semibold text-ro-ink">
            {order.response === "confirmed"
              ? ar
                ? "شكراً، أكّدتَ صحة البيانات ✓"
                : "Thank you — you confirmed your details ✓"
              : ar
                ? "وصلنا طلب التعديل وسنحدّث الطلب"
                : "We received your change request"}
          </p>
          {order.responseNote ? <p className="mt-1 text-ro-text-2">{order.responseNote}</p> : null}
          {order.respondedAt ? (
            <p className="mt-1 text-xs text-ro-muted">
              <bdi dir="ltr">
                {formatDate(order.respondedAt, locale, { dateStyle: "medium", timeStyle: "short" })}
              </bdi>
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="divide-y divide-[var(--ro-border-control)] rounded-[var(--ro-r-md)] border border-[var(--ro-border-control)] bg-ro-paper">
        {[
          [ar ? "الاسم" : "Name", order.customerName],
          [ar ? "الهاتف" : "Phone", order.maskedPhone],
          [ar ? "الوجهة" : "Destination", order.destinationCountry],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
            <span className="text-ro-muted">{k}</span>
            <span className="font-medium text-ro-ink" dir="auto">
              {v}
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-control)] bg-ro-paper p-4">
        <h2 className="mb-3 text-sm font-semibold text-ro-ink">{ar ? "القطع" : "Pieces"}</h2>
        <ul className="space-y-2 text-sm">
          {order.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                {l.name} × {l.quantity}
              </span>
              <bdi dir="ltr" className="tabular-nums">
                {money(l.lineTotal)}
              </bdi>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-[var(--ro-border-control)] pt-3 text-sm">
          <div className="flex justify-between">
            <span>{ar ? "المجموع" : "Subtotal"}</span>
            <bdi dir="ltr">{money(order.subtotal)}</bdi>
          </div>
          <div className="flex justify-between">
            <span>{ar ? "الشحن (تقدير)" : "Shipping (estimate)"}</span>
            {order.shipping ? (
              <bdi dir="ltr">
                {formatNumber(order.shipping.amount, locale)} {order.shipping.currency}
              </bdi>
            ) : (
              <span className="text-ro-muted">{ar ? "يُحدَّد بعد التأكيد" : "to be confirmed"}</span>
            )}
          </div>
          {order.total != null ? (
            <div className="flex justify-between font-semibold">
              <span>{ar ? "الإجمالي التقديري" : "Estimated total"}</span>
              <bdi dir="ltr">{money(order.total)}</bdi>
            </div>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-ro-muted">
          {ar
            ? "الأسعار تقديرية ولا يوجد دفع على الموقع — نؤكد التفاصيل معك عبر واتساب."
            : "Prices are estimates and nothing is paid on the site — we confirm details with you on WhatsApp."}
        </p>
      </section>

      {order.customerNotes ? (
        <section className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-control)] bg-ro-paper p-4 text-sm">
          <h2 className="mb-1 font-semibold text-ro-ink">{ar ? "ملاحظاتك" : "Your notes"}</h2>
          <p className="text-ro-text-2" dir="auto">
            {order.customerNotes}
          </p>
        </section>
      ) : null}

      <OrderResponse token={token} locale={locale} disabled={closed} />
    </div>
  );
}
