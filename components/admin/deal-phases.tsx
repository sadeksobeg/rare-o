"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminCompleteDealAction,
  adminConfirmDealPaymentAction,
  adminSendDealInvoiceAction,
  adminUpdateDealShippingAction,
} from "@/app/deal-actions";
import { ConfirmDialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import type { DealPhase } from "@/lib/deals/constants";
import { formErrorClass } from "@/lib/ui/form-classes";

const ERR_AR: Record<string, string> = {
  INVOICE_REQUIRED: "أرسل الفاتورة للتاجر أولاً",
  SHIPPING_FIELDS_REQUIRED: "اسم شركة الشحن مطلوب",
};
const WA_AR: Record<string, string> = {
  NO_CONVERSATION: "لا توجد محادثة واتساب مع التاجر",
  WHATSAPP_DOWN: "واتساب غير متصل",
  BLOCKED: "محادثة التاجر محظورة",
  RATE_LIMITED: "حد الإرسال — حاول لاحقاً",
  FAILED: "تعذّر الإرسال",
};

const STEPS: { key: DealPhase; label: string }[] = [
  { key: "payment", label: "الفاتورة والدفع" },
  { key: "shipping", label: "الشحن" },
  { key: "ready_to_complete", label: "الإتمام" },
];
const RANK: Record<string, number> = { payment: 0, shipping: 1, ready_to_complete: 2, completed: 3 };

/**
 * Deal follow-up after the price is agreed: invoice → payment → shipping → completion.
 * Only the step that applies is shown; each button is the single next action.
 */
export function AdminDealPhases({
  dealId,
  phase,
  invoiceUrl,
  paidClaim,
  shipping,
}: {
  dealId: string;
  phase: DealPhase;
  invoiceUrl: string | null;
  paidClaim: { via: string | null } | null;
  shipping: { carrier: string | null; tracking: string | null } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmPay, setConfirmPay] = useState(false);

  function report(res: { ok: boolean; error?: string; data?: unknown }, okText: string) {
    if (!res.ok) {
      const code = res.error ?? "";
      setError(ERR_AR[code] ?? (code.startsWith("NOT_READY") ? "هذه الخطوة غير متاحة بعد — أكمل المراحل السابقة" : code || "تعذّر التنفيذ"));
      return;
    }
    const n = (res.data as { notified?: string } | undefined)?.notified;
    let tail = "";
    if (n) {
      const [plat, wa] = n.split(":");
      tail =
        plat === "platform" && wa === "sent"
          ? " — وأُرسلت للتاجر عبر المنصة وواتساب"
          : plat === "platform"
            ? ` — وأُرسلت للتاجر عبر المنصة (تعذّر واتساب: ${WA_AR[wa ?? ""] ?? wa})`
            : wa === "sent"
              ? " — وأُرسلت للتاجر عبر واتساب"
              : " — تعذّر إرسال الرسالة للتاجر";
    }
    setMessage(okText + tail);
    router.refresh();
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>, okText: string) {
    start(async () => {
      setError(null);
      setMessage(null);
      report(await fn(), okText);
    });
  }
  const fdOf = (extra?: Record<string, string>) => {
    const fd = new FormData();
    fd.set("dealId", dealId);
    for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
    return fd;
  };

  const cur = RANK[phase] ?? 0;

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-3 gap-1.5 text-center text-[11.5px]" aria-label="مراحل ما بعد الاتفاق">
        {STEPS.map((st) => {
          const r = RANK[st.key]!;
          const done = r < cur;
          const now = st.key === phase;
          return (
            <li
              key={st.key}
              className="rounded-lg border px-1.5 py-1.5 font-medium"
              style={{
                borderColor: now ? "var(--rad-ac, #a678d8)" : "var(--rad-bd)",
                background: now ? "color-mix(in srgb, var(--rad-ac, #a678d8) 14%, transparent)" : "transparent",
                opacity: done || now ? 1 : 0.55,
              }}
            >
              {done || phase === "completed" ? "✓ " : ""}
              {st.label}
            </li>
          );
        })}
      </ol>

      {phase === "payment" ? (
        <div className="space-y-4">
          <p className="text-sm">
            <b>تم الاتفاق على السعر.</b> أرسل الفاتورة للتاجر، وعند وصول الدفعة أكّد استلامها.
          </p>
          {paidClaim ? (
            <p
              role="status"
              className="rounded-lg border border-[color:var(--rad-bd)] p-3 text-sm"
              style={{ background: "color-mix(in srgb, var(--rad-ok, #2e9d6a) 12%, transparent)" }}
            >
              ✓ التاجر أفاد بأنه دفع {paidClaim.via === "whatsapp" ? "(أبلغ عبر واتساب)" : "(أبلغ عبر المنصة)"} — تحقق من الاستلام ثم أكّد.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rad-btn rad-pri rad-sm"
              disabled={pending}
              onClick={() => run(() => adminSendDealInvoiceAction(fdOf()), "أُصدرت الفاتورة ووُضع رابطها في محادثة التاجر")}
            >
              {invoiceUrl ? "إعادة إرسال الفاتورة في المحادثة" : "إرسال الفاتورة للتاجر في المحادثة"}
            </button>
            {invoiceUrl ? (
              <a className="rad-btn rad-gh rad-sm" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                عرض الفاتورة / طباعة
              </a>
            ) : null}
          </div>
          <div className="space-y-2 border-t border-[color:var(--rad-bd)] pt-4">
            <button
              type="button"
              className="rad-btn rad-pri rad-sm"
              disabled={pending || !invoiceUrl}
              onClick={() => setConfirmPay(true)}
            >
              تأكيد استلام الدفعة
            </button>
            {!invoiceUrl ? <p className="text-xs opacity-70">يُفعَّل بعد إرسال الفاتورة.</p> : null}
          </div>
          <ConfirmDialog
            open={confirmPay}
            onClose={() => setConfirmPay(false)}
            onConfirm={() => {
              setConfirmPay(false);
              run(() => adminConfirmDealPaymentAction(null, fdOf()), "تم تأكيد استلام الدفعة");
            }}
            title="تأكيد استلام الدفعة؟"
            body="تأكّد من وصول المبلغ قبل المتابعة. يُسجَّل الإجراء باسمك ولا يمكن التراجع عنه."
            confirmLabel="تأكيد الاستلام"
            cancelLabel="إلغاء"
            pending={pending}
            destructive={false}
          />
        </div>
      ) : null}

      {phase === "shipping" ? (
        <div className="space-y-4">
          <p className="text-sm">
            <b>تم استلام الدفعة.</b> سجّل بيانات الشحن عند خروج الشحنة (رقم التتبع اختياري)، أو اختر «تسليم مباشر» إن لم يكن هناك شحن.
          </p>
          <form
            className="space-y-3"
            action={(fd) => {
              fd.set("dealId", dealId);
              run(() => adminUpdateDealShippingAction(fd), "تم تسجيل الشحن");
            }}
          >
            <TextField name="carrier" label="شركة الشحن" required dense />
            <TextField name="trackingReference" label="رقم التتبع (اختياري)" dir="ltr" dense />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending}>
                حفظ الشحن وإبلاغ التاجر
              </button>
              <button
                type="button"
                className="rad-btn rad-gh rad-sm"
                disabled={pending}
                onClick={() => run(() => adminUpdateDealShippingAction(fdOf({ carrier: "تسليم مباشر" })), "سُجّل التسليم المباشر")}
              >
                تسليم مباشر (بلا شحن)
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {phase === "ready_to_complete" ? (
        <div className="space-y-3">
          <p className="text-sm">
            <b>{shipping?.carrier === "تسليم مباشر" ? "سُلّمت الصفقة مباشرة" : "شُحنت الصفقة"}</b>
            {shipping?.carrier && shipping.carrier !== "تسليم مباشر" ? ` عبر ${shipping.carrier}` : ""}
            {shipping?.tracking ? ` — رقم التتبع ${shipping.tracking}` : ""}. أتمم الصفقة عند تأكيد التسليم.
          </p>
          <button
            type="button"
            className="rad-btn rad-pri rad-sm"
            disabled={pending}
            onClick={() => run(() => adminCompleteDealAction(fdOf()), "اكتملت الصفقة")}
          >
            إتمام الصفقة (تم التسليم)
          </button>
        </div>
      ) : null}

      {phase === "completed" ? (
        <p className="text-sm font-semibold" style={{ color: "var(--rad-ok, #2e9d6a)" }}>
          ✓ اكتملت الصفقة.
        </p>
      ) : null}

      {phase !== "payment" && invoiceUrl ? (
        <a className="rad-btn rad-gh rad-sm inline-flex" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
          عرض الفاتورة
        </a>
      ) : null}

      {message ? (
        <p role="status" className="text-sm opacity-80">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
