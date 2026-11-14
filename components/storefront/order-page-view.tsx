"use client";

import { m } from "motion/react";
import { PackageCheck, Truck } from "lucide-react";
import { Rings } from "@/components/brand";
import { useMotion } from "@/components/motion/provider";
import { OrderJourney } from "@/components/storefront/order-journey";
import { OrderResponse } from "@/components/storefront/order-response";
import { ButtonLink } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { PublicOrderView } from "@/lib/retail-request/order-page";

const STATUS: Record<string, [string, string]> = {
  draft: ["مسودة", "Draft"],
  ready_for_handoff: ["بانتظار رسالتك على واتساب", "Waiting for your WhatsApp message"],
  handoff_opened: ["وصلنا تواصلك", "We received your message"],
  in_follow_up: ["قيد المتابعة", "In follow-up"],
  completed: ["مكتمل", "Completed"],
  cancelled: ["ملغى", "Cancelled"],
};

const fade = (lite: boolean, delay = 0) => ({
  initial: lite ? (false as const) : { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export function OrderPageView({
  order,
  token,
  locale,
}: {
  order: PublicOrderView;
  token: string;
  locale: Locale;
}) {
  const { lite } = useMotion();
  const ar = locale === "ar";
  const money = (n: number) =>
    `${formatNumber(n, locale, { maximumFractionDigits: 2 })} ${order.currency}`;
  const closed = order.status === "completed" || order.status === "cancelled";
  const confirmed = order.response === "confirmed";
  const st = STATUS[order.status] ?? [order.status, order.status];
  const firstName = order.customerName.trim().split(/\s+/)[0] ?? "";

  const details = (
    <div className="space-y-5">
      <section className="divide-y divide-[var(--ro-border-control)] overflow-hidden rounded-2xl border border-[var(--ro-border-control)] bg-ro-paper">
        {[
          [ar ? "الاسم" : "Name", order.customerName],
          [ar ? "الهاتف" : "Phone", order.phone],
          [ar ? "الوجهة" : "Destination", order.destinationCountry],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 px-5 py-3.5 text-sm">
            <span className="text-ro-muted">{k}</span>
            <span className="font-medium text-ro-ink" dir={k === "الهاتف" || k === "Phone" ? "ltr" : "auto"}>
              {v}
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--ro-border-control)] bg-ro-paper p-5">
        <h3 className="mb-3 text-sm font-semibold text-ro-ink">{ar ? "القطع" : "Pieces"}</h3>
        <ul className="space-y-2.5 text-sm">
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
        <div className="mt-4 space-y-1.5 border-t border-[var(--ro-border-control)] pt-3 text-sm">
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
            <div className="flex justify-between text-base font-semibold">
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
        <section className="rounded-2xl border border-[var(--ro-border-control)] bg-ro-paper p-5 text-sm">
          <h3 className="mb-1 font-semibold text-ro-ink">{ar ? "ملاحظاتك" : "Your notes"}</h3>
          <p className="text-ro-text-2" dir="auto">
            {order.customerNotes}
          </p>
        </section>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <m.header
        {...fade(lite)}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#150b21] via-[#2a1340] to-[#52277c] px-6 py-9 text-white shadow-[0_30px_80px_-30px_rgba(82,39,124,0.7)] sm:px-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 end-0 size-[340px] rounded-full bg-[radial-gradient(circle,rgba(200,150,62,0.32),transparent_65%)]"
        />
        <Rings idle amberRingIndex={5} className="pointer-events-none absolute inset-0 size-full text-white opacity-[0.045]" />
        <div className="relative space-y-3">
          <p className="text-sm text-white/70">
            <bdi dir="ltr" className="tabular-nums tracking-wide">
              {order.reference}
            </bdi>
          </p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            {ar ? `أهلاً ${firstName}` : `Hello ${firstName}`}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-sm ring-1 ring-white/25">
              <span aria-hidden className="size-2 rounded-full bg-[#f4d9a6]" />
              {ar ? st[0] : st[1]}
            </span>
            {order.paymentLabel ? (
              <span className="inline-flex items-center rounded-full bg-[#f4d9a6]/15 px-3.5 py-1.5 text-sm text-[#f4d9a6] ring-1 ring-[#f4d9a6]/30">
                {order.paymentLabel}
              </span>
            ) : null}
            {order.total != null ? (
              <bdi dir="ltr" className="text-sm text-white/80">
                {money(order.total)}
              </bdi>
            ) : null}
          </div>
        </div>
      </m.header>

      {order.response ? (
        <m.div
          {...fade(lite, 0.1)}
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-[var(--ro-border-control)] bg-ro-paper p-4 text-sm"
        >
          <PackageCheck className="mt-0.5 size-5 shrink-0 text-[var(--ro-plum-700)]" aria-hidden />
          <div>
            <p className="font-semibold text-ro-ink">
              {confirmed
                ? ar
                  ? "شكراً، أكّدتَ صحة البيانات"
                  : "Thank you — you confirmed your details"
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
        </m.div>
      ) : null}

      <m.section
        {...fade(lite, 0.15)}
        className="rounded-[24px] border border-[var(--ro-border-control)] bg-ro-paper p-6 sm:p-8"
      >
        <h2 className="mb-2 text-lg font-semibold text-ro-ink">{ar ? "رحلة طلبك" : "Your request journey"}</h2>
        <OrderJourney
          locale={locale}
          input={{
            status: order.status,
            response: order.response,
            shipmentStatus: order.shipment?.status ?? null,
          }}
          etaLabel={order.etaLabel}
          updates={order.updates}
        />
        {order.shipment ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-[color-mix(in_srgb,var(--ro-plum-900)_6%,transparent)] p-3 text-sm">
            <Truck className="size-5 text-[var(--ro-plum-700)]" aria-hidden />
            <span className="flex-1">
              {ar ? "شحنتك" : "Your shipment"}
              {order.shipment.trackingNumber ? (
                <>
                  {" · "}
                  <bdi dir="ltr">{order.shipment.trackingNumber}</bdi>
                </>
              ) : null}
            </span>
            <ButtonLink href={`/track/${order.shipment.trackingToken}`} variant="secondary" size="sm">
              {ar ? "تتبّع" : "Track"}
            </ButtonLink>
          </div>
        ) : null}
      </m.section>

      <m.div {...fade(lite, 0.18)} className="flex justify-end">
        <ButtonLink href={`/invoice/${token}`} variant="secondary" size="sm">
          {ar ? "عرض الفاتورة وطباعتها" : "View & print invoice"}
        </ButtonLink>
      </m.div>

      {/* Once confirmed the data collapses — the journey is the star. */}
      {confirmed || closed ? (
        <m.details {...fade(lite, 0.2)} className="group rounded-2xl border border-[var(--ro-border-control)] bg-ro-paper">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-semibold text-ro-ink [&::-webkit-details-marker]:hidden">
            {ar ? "عرض بيانات الطلب" : "View request details"}
            <span aria-hidden className="text-ro-muted transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-[var(--ro-border-control)] p-4">{details}</div>
        </m.details>
      ) : (
        <>
          <m.div {...fade(lite, 0.2)}>{details}</m.div>
          <m.div {...fade(lite, 0.25)}>
            <p className="mb-3 text-sm font-medium text-ro-ink">
              {ar ? "هل البيانات أعلاه صحيحة؟" : "Are the details above correct?"}
            </p>
            <OrderResponse token={token} locale={locale} disabled={closed} />
          </m.div>
        </>
      )}
    </div>
  );
}
