"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, FileText, MessageCircle, PartyPopper, ShieldCheck, Truck } from "lucide-react";
import { traderClaimDealPaymentAction } from "@/app/deal-actions";
import type { DealPhase } from "@/lib/deals/constants";
import { cn } from "@/lib/utils";

const STEPS: { key: DealPhase; label: string; Icon: typeof ShieldCheck }[] = [
  { key: "payment", label: "الفاتورة والدفع", Icon: CreditCard },
  { key: "shipping", label: "تجهيز الشحن", Icon: ShieldCheck },
  { key: "ready_to_complete", label: "الشحن والتسليم", Icon: Truck },
  { key: "completed", label: "اكتملت", Icon: PartyPopper },
];
const RANK: Record<string, number> = { payment: 0, shipping: 1, ready_to_complete: 2, completed: 3 };

/**
 * Trader side of a deal after the price is agreed: invoice, pay (tell us via the platform or WhatsApp),
 * then follow shipping. Each phase shows only its own action.
 */
export function TraderDealPhaseCard({
  dealId,
  phase,
  invoiceUrl,
  whatsAppDeepLink,
  claimed,
  carrier,
  tracking,
}: {
  dealId: string;
  phase: DealPhase;
  invoiceUrl: string | null;
  whatsAppDeepLink: string | null;
  claimed: boolean;
  carrier: string | null;
  tracking: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function claim(via: "platform" | "whatsapp") {
    const fd = new FormData();
    fd.set("dealId", dealId);
    fd.set("via", via);
    start(async () => {
      setError(null);
      const res = await traderClaimDealPaymentAction(fd);
      if (!res.ok) return void setError("تعذّر الإرسال، أعد المحاولة");
      router.refresh();
    });
  }

  const cur = RANK[phase] ?? 0;
  const tile =
    "group flex flex-col items-start gap-2 rounded-2xl border p-4 text-start transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60";

  return (
    <section
      className="rounded-3xl border p-5 sm:p-6"
      style={{
        borderColor: "color-mix(in srgb, var(--rad-ac, #8a52c4) 40%, var(--rad-bd))",
        background: "linear-gradient(160deg, color-mix(in srgb, var(--rad-ac, #8a52c4) 10%, var(--rad-surface, transparent)), var(--rad-surface, transparent))",
      }}
      aria-label="الخطوة التالية في صفقتك"
    >
      <ol className="mb-5 grid grid-cols-4 gap-1.5 text-center text-[11.5px] font-medium">
        {STEPS.map(({ key, label, Icon }) => {
          const r = RANK[key]!;
          const done = r < cur || phase === "completed";
          const now = r === cur && phase !== "completed";
          return (
            <li
              key={key}
              className={cn("flex flex-col items-center gap-1 rounded-xl border px-1 py-2", !done && !now && "opacity-50")}
              style={{
                borderColor: now ? "var(--rad-ac, #8a52c4)" : "var(--rad-bd)",
                background: now ? "color-mix(in srgb, var(--rad-ac, #8a52c4) 14%, transparent)" : "transparent",
              }}
            >
              {done ? <CheckCircle2 className="size-4 text-[#2e9d6a]" aria-hidden /> : <Icon className="size-4" aria-hidden />}
              {label}
            </li>
          );
        })}
      </ol>

      {phase === "payment" ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">تم الاتفاق على السعر — أتمّ الدفع</h2>
            <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
              {invoiceUrl
                ? "فاتورتك جاهزة. أتمّ الدفع بحسب المتفق عليه ثم أعلمنا بإحدى الطريقتين لنؤكد الاستلام فوراً."
                : "نجهّز فاتورتك الآن وسيصلك رابطها في الرسائل فور إصدارها."}
            </p>
          </div>
          {invoiceUrl ? (
            <a className="rad-btn rad-pri inline-flex" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="size-4" aria-hidden /> عرض الفاتورة / تحميل PDF
            </a>
          ) : null}
          {invoiceUrl && !claimed ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => claim("platform")}
                className={tile}
                style={{ borderColor: "var(--rad-ac, #8a52c4)", background: "color-mix(in srgb, var(--rad-ac, #8a52c4) 12%, transparent)" }}
              >
                <ShieldCheck className="size-6 text-[var(--rad-ac,#8a52c4)]" aria-hidden />
                <b className="text-[15px] text-[color:var(--rad-tx)]">أبلغ بالدفع عبر المنصة</b>
                <span className="text-xs text-[color:var(--rad-tx2)]">بنقرة واحدة، يصلنا إشعار فوري.</span>
              </button>
              {whatsAppDeepLink ? (
                <a
                  href={whatsAppDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => claim("whatsapp")}
                  className={tile}
                  style={{ borderColor: "var(--rad-bd)" }}
                >
                  <MessageCircle className="size-6 text-[#25a366]" aria-hidden />
                  <b className="text-[15px] text-[color:var(--rad-tx)]">أبلغ بالدفع عبر واتساب</b>
                  <span className="text-xs text-[color:var(--rad-tx2)]">يفتح واتساب برسالة جاهزة لفريق RARE OUD.</span>
                </a>
              ) : null}
            </div>
          ) : null}
          {claimed ? (
            <p role="status" className="text-sm font-medium text-[#2e9d6a]">
              ✓ وصلنا إشعارك بالدفع — بانتظار تأكيد الفريق لاستلام الدفعة.
            </p>
          ) : null}
        </div>
      ) : null}

      {phase === "shipping" ? (
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">استلمنا دفعتك — نجهّز الشحن</h2>
          <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">سنخبرك فور خروج الشحنة مع بيانات الناقل.</p>
          {invoiceUrl ? (
            <a className="rad-btn rad-gh mt-3 inline-flex" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="size-4" aria-hidden /> الفاتورة
            </a>
          ) : null}
        </div>
      ) : null}

      {phase === "ready_to_complete" ? (
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">
            {carrier === "تسليم مباشر" ? "سُلّمت صفقتك مباشرة" : "شُحنت صفقتك"}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
            {carrier && carrier !== "تسليم مباشر" ? `الناقل: ${carrier}` : ""}
            {tracking ? ` · رقم التتبع: ${tracking}` : ""}
          </p>
          {invoiceUrl ? (
            <a className="rad-btn rad-gh mt-3 inline-flex" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="size-4" aria-hidden /> الفاتورة
            </a>
          ) : null}
        </div>
      ) : null}

      {phase === "completed" ? (
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">اكتملت صفقتك — شكراً لتعاملك معنا</h2>
          {invoiceUrl ? (
            <a className="rad-btn rad-gh mt-3 inline-flex" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="size-4" aria-hidden /> الفاتورة
            </a>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-[color:var(--ro-danger-700)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
