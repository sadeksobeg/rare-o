"use client";

import { Check as CheckIcon } from "lucide-react";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, FileText, MessageCircle, Package, ShieldCheck, Truck } from "lucide-react";
import {
  traderClaimWholesalePaymentAction,
  traderConfirmWholesaleAction,
} from "@/app/wholesale-actions";
import type { WholesalePhase } from "@/lib/wholesale/constants";
import { cn } from "@/lib/utils";

const STEPS: { key: WholesalePhase; label: string; Icon: typeof ShieldCheck }[] = [
  { key: "awaiting_trader", label: "تأكيدك", Icon: ShieldCheck },
  { key: "payment", label: "الفاتورة والدفع", Icon: CreditCard },
  { key: "shipping", label: "تجهيز الشحن", Icon: Package },
  { key: "ready_to_complete", label: "الشحن والتسليم", Icon: Truck },
];
const RANK: Record<string, number> = { awaiting_trader: 0, payment: 1, shipping: 2, ready_to_complete: 3 };

/**
 * Trader-side phases after the order is confirmed: choose how to confirm (platform or WhatsApp),
 * receive the invoice, tell us about the payment, follow shipping. Each phase shows only its own action.
 */
export function TraderWholesalePhaseCard({
  requestId,
  phase,
  whatsAppDeepLink,
  invoiceUrl,
  paidClaimed,
  carrier,
  tracking,
}: {
  requestId: string;
  phase: WholesalePhase;
  whatsAppDeepLink: string | null;
  invoiceUrl: string | null;
  paidClaimed: boolean;
  carrier: string | null;
  tracking: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm(via: "platform" | "whatsapp") {
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("via", via);
    start(async () => {
      setError(null);
      const res = await traderConfirmWholesaleAction(fd);
      if (!res.ok) return void setError("تعذّر تسجيل التأكيد، أعد المحاولة");
      router.refresh();
    });
  }

  function claimPaid() {
    const fd = new FormData();
    fd.set("requestId", requestId);
    start(async () => {
      setError(null);
      const res = await traderClaimWholesalePaymentAction(fd);
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
      aria-label="الخطوة التالية في طلبك"
    >
      <ol className="mb-5 grid grid-cols-4 gap-1.5 text-center text-[11.5px] font-medium">
        {STEPS.map(({ key, label, Icon }) => {
          const r = RANK[key]!;
          const done = r < cur;
          const now = r === cur;
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

      {phase === "awaiting_trader" ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">أكّد طلبك لنتابع</h2>
            <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
              تمّ الاتفاق على السعر. اختر الطريقة التي تفضّلها لتأكيد الطلب نهائياً — بعدها نصدر الفاتورة ونبدأ التجهيز.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => confirm("platform")}
              className={tile}
              style={{ borderColor: "var(--rad-ac, #8a52c4)", background: "color-mix(in srgb, var(--rad-ac, #8a52c4) 12%, transparent)" }}
            >
              <ShieldCheck className="size-6 text-[var(--rad-ac,#8a52c4)]" aria-hidden />
              <b className="text-[15px] text-[color:var(--rad-tx)]">التأكيد عبر المنصة</b>
              <span className="text-xs text-[color:var(--rad-tx2)]">بنقرة واحدة، فوري وموثّق في سجل الطلب.</span>
            </button>
            {whatsAppDeepLink ? (
              <a
                href={whatsAppDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => confirm("whatsapp")}
                className={tile}
                style={{ borderColor: "var(--rad-bd)" }}
              >
                <MessageCircle className="size-6 text-[#25a366]" aria-hidden />
                <b className="text-[15px] text-[color:var(--rad-tx)]">التأكيد عبر واتساب</b>
                <span className="text-xs text-[color:var(--rad-tx2)]">يفتح واتساب برسالة جاهزة لفريق RARE OUD.</span>
              </a>
            ) : (
              <div className={cn(tile, "cursor-not-allowed opacity-50")} style={{ borderColor: "var(--rad-bd)" }}>
                <MessageCircle className="size-6" aria-hidden />
                <b className="text-[15px]">التأكيد عبر واتساب</b>
                <span className="text-xs">غير متاح حالياً — استخدم المنصة.</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {phase === "payment" ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">الفاتورة والدفع</h2>
            <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
              {invoiceUrl
                ? "فاتورتك جاهزة. أتمّ الدفع بحسب المتفق عليه ثم أعلمنا ليصلنا إشعار فوري."
                : "نجهّز فاتورتك الآن وسيصلك رابطها في الرسائل فور إصدارها."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {invoiceUrl ? (
              <a className="rad-btn rad-pri" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="size-4" aria-hidden /> عرض الفاتورة / تحميل PDF
              </a>
            ) : null}
            {invoiceUrl && !paidClaimed ? (
              <button type="button" className="rad-btn rad-gh" disabled={pending} onClick={claimPaid}>
                أرسلتُ الدفعة
              </button>
            ) : null}
          </div>
          {paidClaimed ? (
            <p role="status" className="text-sm font-medium text-[#2e9d6a]">
              <CheckIcon className="me-1 inline size-4 align-text-bottom" aria-hidden />وصلنا إشعارك بالدفع — بانتظار تأكيد الفريق لاستلام الدفعة.
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
          <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">شُحن طلبك</h2>
          <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
            {carrier ? `الناقل: ${carrier}` : ""}
            {tracking ? ` · رقم التتبع: ${tracking}` : ""}
          </p>
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
