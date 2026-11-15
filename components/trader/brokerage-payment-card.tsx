"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, FileText, MessageCircle, ShieldCheck } from "lucide-react";
import { traderClaimBrokeragePaymentAction } from "@/app/brokerage-actions";

/**
 * Payment is the LAST stage of a brokerage request: the piece is bought, the invoice arrives,
 * the trader pays and tells us via the platform or WhatsApp, the admin confirms receipt.
 */
export function BrokeragePaymentCard({
  requestId,
  invoiceUrl,
  whatsAppDeepLink,
  claimed,
}: {
  requestId: string;
  invoiceUrl: string | null;
  whatsAppDeepLink: string | null;
  claimed: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function claim(via: "platform" | "whatsapp") {
    const fd = new FormData();
    fd.set("id", requestId);
    fd.set("via", via);
    start(async () => {
      setError(null);
      const res = await traderClaimBrokeragePaymentAction(fd);
      if (!res.ok) return void setError("تعذّر الإرسال، أعد المحاولة");
      router.refresh();
    });
  }

  const tile =
    "flex flex-col items-start gap-2 rounded-2xl border p-4 text-start transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60";

  return (
    <section
      className="rounded-3xl border p-5 sm:p-6"
      style={{
        borderColor: "color-mix(in srgb, var(--rad-ac, #8a52c4) 40%, var(--rad-bd))",
        background: "linear-gradient(160deg, color-mix(in srgb, var(--rad-ac, #8a52c4) 10%, var(--rad-surface, transparent)), var(--rad-surface, transparent))",
      }}
      aria-label="الدفع"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--rad-tx)]">
        <CreditCard className="size-5 text-[var(--rad-ac,#8a52c4)]" aria-hidden /> تمّ شراء قطعتك — الدفع هو الخطوة الأخيرة
      </h2>
      <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
        {invoiceUrl
          ? "فاتورتك جاهزة. أتمّ الدفع بحسب المتفق عليه ثم أعلمنا بإحدى الطريقتين لنؤكد الاستلام ونبدأ الشحن."
          : "نجهّز فاتورتك الآن وسيصلك رابطها في الرسائل فور إصدارها."}
      </p>
      {invoiceUrl ? (
        <a className="rad-btn rad-pri mt-4 inline-flex" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
          <FileText className="size-4" aria-hidden /> عرض الفاتورة / تحميل PDF
        </a>
      ) : null}
      {invoiceUrl && !claimed ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-[#2e9d6a]">
          <CheckCircle2 className="size-4" aria-hidden /> وصلنا إشعارك بالدفع — بانتظار تأكيد الفريق لاستلام الدفعة.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-[color:var(--ro-danger-700)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
