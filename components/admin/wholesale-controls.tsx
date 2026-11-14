"use client";

import {
  adminProvideWholesaleQuoteAction,
  adminTransitionWholesaleAction,
  adminUpdateWholesaleShippingAction,
} from "@/app/wholesale-actions";
import { CurrencySelect } from "@/components/ui/currency-select";
import { TextField, Textarea } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formErrorClass } from "@/lib/ui/form-classes";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const ERR_AR: Record<string, string> = {
  QUOTE_REQUIRED_BEFORE_CONFIRM: "قدّم عرض سعر أولاً قبل التأكيد",
  INVALID_TRANSITION: "هذا الانتقال غير متاح في المرحلة الحالية",
  REQUEST_NOT_FOUND: "الطلب غير موجود",
  INVALID_QUOTE_PRICE: "سعر غير صالح",
  LINE_QUOTES_REQUIRED: "أدخل سعراً لكل صنف",
};
const WA_ERR_AR: Record<string, string> = {
  NO_CONVERSATION: "لا توجد محادثة واتساب مع التاجر",
  WHATSAPP_DOWN: "واتساب غير متصل",
  BLOCKED: "محادثة التاجر محظورة",
  RATE_LIMITED: "حد الإرسال — حاول لاحقاً",
  FAILED: "تعذّر الإرسال",
};

type Stage = "submitted" | "under_review" | "quote_provided" | "confirmed" | "closed";

export function AdminWholesaleControls({
  requestId,
  status,
  requestMode,
  lines,
  quoteCurrencyDefault,
  labels,
  bare = false,
}: {
  requestId: string;
  status: string;
  requestMode: string;
  /** `productName` is already resolved for the viewer's locale. */
  lines: Array<{ id: string; productName: string; quantity: number }>;
  quoteCurrencyDefault: string;
  labels: Dictionary["adminUi"];
  /** Skip outer border + heading when wrapped in ui-kit Card. */
  bare?: boolean;
}) {
  const f = labels.form;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [notify, setNotify] = useState(true);
  const [reQuote, setReQuote] = useState(false);

  const stage: Stage =
    status === "submitted" || status === "under_review" || status === "quote_provided" || status === "confirmed"
      ? status
      : "closed";

  const lineQuotesJson = JSON.stringify(
    lines.map((l) => ({ lineId: l.id, quotedUnitPrice: Number(prices[l.id] || 0) }))
  );

  function report(res: { ok: boolean; error?: string; data?: unknown }, okText: string) {
    if (!res.ok) {
      setError(ERR_AR[res.error ?? ""] ?? res.error ?? "تعذّر التنفيذ");
      return;
    }
    const n = (res.data as { notified?: string } | undefined)?.notified;
    setMessage(
      n === "sent"
        ? `${okText} — وأُرسلت رسالة واتساب للتاجر`
        : n && n !== "skipped"
          ? `${okText} (لم تُرسل رسالة واتساب: ${WA_ERR_AR[n] ?? n})`
          : okText
    );
    router.refresh();
  }

  /** One-click status move (no select): the button says exactly what it does. */
  function move(toStatus: string, okText: string, note = "") {
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("toStatus", toStatus);
    fd.set("note", note);
    if (notify) fd.set("notifyTrader", "1");
    startTransition(async () => {
      setError(null);
      setMessage(null);
      report(await adminTransitionWholesaleAction(fd), okText);
    });
  }

  const quoteForm = (
    <form
      className="space-y-3"
      action={(fd) => {
        if (notify) fd.set("notifyTrader", "1");
        startTransition(async () => {
          setError(null);
          setMessage(null);
          const res = await adminProvideWholesaleQuoteAction(null, fd);
          if (res.ok) setReQuote(false);
          report(res, f.quoteSaved);
        });
      }}
    >
      <h3 className="text-base font-semibold">{f.provideQuote}</h3>
      <p className="text-sm text-ro-muted">{f.quoteHint}</p>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="lineQuotesJson" value={lineQuotesJson} />
      <CurrencySelect
        name="quoteCurrency"
        required
        defaultValue={quoteCurrencyDefault}
        labels={{ currency: f.quoteCurrency, currencyUsd: f.currencyUsd, currencySyp: f.currencySyp }}
        className="max-w-xs"
      />
      <div className="space-y-2">
        {lines.map((l) => (
          <TextField
            key={l.id}
            name={`price-${l.id}`}
            type="number"
            min={0}
            step="0.01"
            required
            dir="ltr"
            label={`${l.productName} × ${l.quantity}`}
            placeholder={f.quotedUnitPrice}
            value={prices[l.id] ?? ""}
            onChange={(e) => setPrices((prev) => ({ ...prev, [l.id]: e.target.value }))}
            dense
            className="max-w-sm"
          />
        ))}
      </div>
      <Textarea name="quoteMessage" label={f.quoteMessage} rows={3} dense />
      <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending}>
        {f.saveQuote}
      </button>
    </form>
  );

  const cancelBtn = (
    <button
      type="button"
      className="rad-btn rad-gh rad-sm"
      disabled={pending}
      onClick={() => {
        if (window.confirm("إلغاء هذا الطلب؟")) move("cancelled", "أُلغي الطلب");
      }}
    >
      إلغاء الطلب
    </button>
  );

  return (
    <div className={bare ? "space-y-5" : "space-y-5 border border-ro-line p-4"}>
      {bare ? null : <h2 className="text-lg font-semibold">{f.adminOperations}</h2>}

      {stage !== "closed" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4" />
          أبلِغ التاجر على واتساب مع كل خطوة (إضافة إلى إشعار البوابة)
        </label>
      ) : null}

      {stage === "submitted" ? (
        <div className="space-y-3">
          <p className="text-sm">الطلب جديد. ابدأ المراجعة ليظهر للتاجر أنه قيد الدراسة.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rad-btn rad-pri rad-sm" disabled={pending} onClick={() => move("under_review", "بدأت المراجعة")}>
              بدء المراجعة
            </button>
            {cancelBtn}
          </div>
        </div>
      ) : null}

      {stage === "under_review" ? (
        <div className="space-y-4">
          {quoteForm}
          <div className="flex flex-wrap gap-2 border-t border-ro-line pt-4">
            {requestMode === "propose_price" ? (
              <button
                type="button"
                className="rad-btn rad-gh rad-sm"
                disabled={pending}
                onClick={() => move("confirmed", "تم تأكيد الطلب بسعر التاجر المقترح")}
              >
                قبول سعر التاجر المقترح وتأكيد الطلب
              </button>
            ) : null}
            {cancelBtn}
          </div>
        </div>
      ) : null}

      {stage === "quote_provided" ? (
        <div className="space-y-3">
          <p className="text-sm">
            <b>أُرسل عرض السعر — بانتظار رد التاجر.</b> سيصلك إشعار فور قبوله أو رفضه.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rad-btn rad-gh rad-sm" disabled={pending} onClick={() => setReQuote((v) => !v)}>
              {reQuote ? "إخفاء تعديل العرض" : "تعديل عرض السعر"}
            </button>
            <button type="button" className="rad-btn rad-gh rad-sm" disabled={pending} onClick={() => move("confirmed", "تم تأكيد الطلب")}>
              تأكيد الطلب مباشرة (اتفاق خارج المنصة)
            </button>
            {cancelBtn}
          </div>
          {reQuote ? <div className="border-t border-ro-line pt-4">{quoteForm}</div> : null}
        </div>
      ) : null}

      {stage === "confirmed" ? (
        <div className="space-y-4">
          <p className="text-sm">
            <b>الطلب مؤكد.</b> سجّل الشحن عند خروج الشحنة، ثم أتمم الطلب عند التسليم.
          </p>
          <form
            className="space-y-3"
            action={(fd) => {
              if (notify) fd.set("notifyTrader", "1");
              startTransition(async () => {
                setError(null);
                setMessage(null);
                report(await adminUpdateWholesaleShippingAction(fd), f.shippingSaved);
              });
            }}
          >
            <h3 className="text-base font-semibold">{f.shippingTitle}</h3>
            <input type="hidden" name="requestId" value={requestId} />
            <TextField name="carrier" label={f.carrier} required dense />
            <TextField name="trackingReference" label={f.trackingReference} required dir="ltr" dense />
            <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending}>
              {f.saveShipping}
            </button>
          </form>
          <div className="flex flex-wrap gap-2 border-t border-ro-line pt-4">
            <button type="button" className="rad-btn rad-pri rad-sm" disabled={pending} onClick={() => move("completed", "اكتمل الطلب")}>
              إتمام الطلب (تم التسليم)
            </button>
            {cancelBtn}
          </div>
        </div>
      ) : null}

      {stage === "closed" ? (
        <p className="text-sm" style={{ color: "var(--rad-tx3)" }}>
          {f.terminalStatus}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="text-sm text-ro-muted">
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
