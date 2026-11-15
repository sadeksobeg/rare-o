"use client";

import {
  adminConfirmWholesalePaymentAction,
  adminSendWholesaleInvoiceAction,
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
import type { WholesalePhase } from "@/lib/wholesale/constants";

const ERR_AR: Record<string, string> = {
  QUOTE_REQUIRED_BEFORE_CONFIRM: "قدّم عرض سعر أولاً قبل التأكيد",
  TRADER_MUST_ACCEPT: "التاجر هو من يقبل عرض السعر — لا يمكن التأكيد نيابةً عنه",
  INVOICE_REQUIRED: "أرسل الفاتورة للتاجر أولاً",
  SHIPPING_FIELDS_REQUIRED: "اسم شركة الشحن مطلوب",
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


export function AdminWholesaleControls({
  requestId,
  status: _status,
  requestMode,
  lines,
  quoteCurrencyDefault,
  labels,
  bare = false,
  phase,
  traderConfirmedVia,
  invoiceUrl,
  paidClaimed,
  shipping,
}: {
  requestId: string;
  status: string;
  requestMode: string;
  /** `productName` is already resolved for the viewer's locale. */
  lines: Array<{ id: string; productName: string; quantity: number; proposedUnit?: number | null; proposedCurrency?: string | null }>;
  quoteCurrencyDefault: string;
  labels: Dictionary["adminUi"];
  /** Skip outer border + heading when wrapped in ui-kit Card. */
  bare?: boolean;
  phase: WholesalePhase;
  traderConfirmedVia: string | null;
  /** Set once the invoice was issued (relative path of the printable invoice). */
  invoiceUrl: string | null;
  paidClaimed: boolean;
  shipping: { carrier: string | null; tracking: string | null } | null;
}) {
  const f = labels.form;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  /** Per line: enter the unit price (× quantity) or the line total. */
  const [modes, setModes] = useState<Record<string, "unit" | "total">>({});
  const [notify, setNotify] = useState(true);
  const [reQuote, setReQuote] = useState(false);
  const [quoteCur, setQuoteCur] = useState<string>(quoteCurrencyDefault);


  const unitOf = (l: { id: string; quantity: number }) => {
    const v = Number(prices[l.id] || 0);
    const unit = (modes[l.id] ?? "unit") === "unit" ? v : v / l.quantity;
    return Math.round(unit * 10000) / 10000;
  };
  const lineQuotesJson = JSON.stringify(lines.map((l) => ({ lineId: l.id, quotedUnitPrice: unitOf(l) })));
  const grandTotal = lines.reduce((sum, l) => sum + unitOf(l) * l.quantity, 0);

  function report(res: { ok: boolean; error?: string; data?: unknown }, okText: string) {
    if (!res.ok) {
      const code = res.error ?? "";
      setError(
        ERR_AR[code] ??
          (code.startsWith("NOT_READY") ? "هذه الخطوة غير متاحة بعد — أكمل المراحل السابقة أولاً" : code || "تعذّر التنفيذ")
      );
      return;
    }
    const n = (res.data as { notified?: string } | undefined)?.notified;
    let tail = "";
    if (n && n !== "skipped") {
      const [plat, wa] = n.split(":");
      const waOk = wa === "sent";
      const platOk = plat === "platform";
      tail = platOk && waOk
        ? " — وأُرسلت للتاجر عبر المنصة وواتساب"
        : platOk
          ? ` — وأُرسلت للتاجر عبر المنصة (تعذّر واتساب: ${WA_ERR_AR[wa ?? ""] ?? wa})`
          : waOk
            ? " — وأُرسلت للتاجر عبر واتساب"
            : " — تعذّر إرسال الرسالة للتاجر";
    }
    setMessage(okText + tail);
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
        value={quoteCur}
        onChange={(c) => setQuoteCur(c)}
        labels={{ currency: f.quoteCurrency, currencyUsd: f.currencyUsd, currencySyp: f.currencySyp }}
        className="max-w-xs"
      />
      <div className="space-y-3">
        {lines.map((l) => {
          const mode = modes[l.id] ?? "unit";
          const raw = prices[l.id] ?? "";
          const filled = raw !== "" && Number(raw) >= 0;
          const unit = unitOf(l);
          const cur = quoteCur;
          return (
            <div key={l.id} className="space-y-2 rounded-xl border border-ro-line p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <b className="text-sm">
                  {l.productName} × {l.quantity}
                </b>
                {l.proposedUnit != null ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--rad-ac,#a678d8)_16%,transparent)] px-2.5 py-0.5 text-xs font-semibold">
                    اقتراح التاجر: {l.proposedUnit} {l.proposedCurrency ?? ""} للوحدة
                  </span>
                ) : null}
              </div>
              <div role="group" aria-label="طريقة إدخال السعر" className="inline-flex rounded-full border border-ro-line p-0.5 text-xs">
                {(["unit", "total"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setModes((prev) => ({ ...prev, [l.id]: m }))}
                    className="rounded-full px-3 py-1 font-semibold"
                    style={{
                      background: mode === m ? "var(--rad-ac, #8a52c4)" : "transparent",
                      color: mode === m ? "#fff" : "inherit",
                    }}
                  >
                    {m === "unit" ? "سعر الوحدة" : "السعر الإجمالي"}
                  </button>
                ))}
              </div>
              <TextField
                name={`price-${l.id}`}
                type="number"
                min={0}
                step="0.01"
                required
                dir="ltr"
                label={mode === "unit" ? `سعر الوحدة (× ${l.quantity})` : `السعر الإجمالي لـ ${l.quantity} قطعة`}
                placeholder={mode === "unit" ? f.quotedUnitPrice : "0.00"}
                value={raw}
                onChange={(e) => setPrices((prev) => ({ ...prev, [l.id]: e.target.value }))}
                dense
                className="max-w-sm"
              />
              {filled ? (
                <p className="text-xs opacity-80" dir="ltr" style={{ textAlign: "start" }}>
                  {unit} {cur} / unit × {l.quantity} = <b>{Math.round(unit * l.quantity * 100) / 100} {cur}</b>
                </p>
              ) : null}
            </div>
          );
        })}
        {lines.length > 1 && grandTotal > 0 ? (
          <p className="text-sm font-semibold" dir="ltr" style={{ textAlign: "start" }}>
            Total: {Math.round(grandTotal * 100) / 100} {quoteCur}
          </p>
        ) : null}
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

  const closed = phase === "completed" || phase === "cancelled";
  const confirmedPhases = ["awaiting_trader", "payment", "shipping", "ready_to_complete"] as const;
  const inConfirmed = (confirmedPhases as readonly string[]).includes(phase);
  const rank = { awaiting_trader: 0, payment: 1, shipping: 2, ready_to_complete: 3 } as Record<string, number>;
  const steps = [
    { key: "awaiting_trader", label: "تأكيد التاجر" },
    { key: "payment", label: "الفاتورة والدفع" },
    { key: "shipping", label: "الشحن" },
    { key: "ready_to_complete", label: "الإتمام" },
  ];

  function sendInvoice() {
    const fd = new FormData();
    fd.set("requestId", requestId);
    startTransition(async () => {
      setError(null);
      setMessage(null);
      report(await adminSendWholesaleInvoiceAction(fd), "أُصدرت الفاتورة ووُضع رابطها في محادثة التاجر");
    });
  }

  function confirmPayment() {
    const fd = new FormData();
    fd.set("requestId", requestId);
    if (notify) fd.set("notifyTrader", "1");
    startTransition(async () => {
      setError(null);
      setMessage(null);
      report(await adminConfirmWholesalePaymentAction(fd), "تم تأكيد استلام الدفعة");
    });
  }

  return (
    <div className={bare ? "space-y-5" : "space-y-5 border border-ro-line p-4"}>
      {bare ? null : <h2 className="text-lg font-semibold">{f.adminOperations}</h2>}

      {inConfirmed ? (
        <ol className="grid grid-cols-4 gap-1.5 text-center text-[11.5px]" aria-label="مراحل ما بعد التأكيد">
          {steps.map((st) => {
            const done = rank[st.key]! < rank[phase]!;
            const cur = st.key === phase;
            return (
              <li
                key={st.key}
                className="rounded-lg border px-1.5 py-1.5 font-medium"
                style={{
                  borderColor: cur ? "var(--rad-ac, #a678d8)" : "var(--rad-bd)",
                  background: cur ? "color-mix(in srgb, var(--rad-ac, #a678d8) 14%, transparent)" : "transparent",
                  opacity: done || cur ? 1 : 0.55,
                }}
              >
                {done ? "✓ " : ""}
                {st.label}
              </li>
            );
          })}
        </ol>
      ) : null}

      {!closed ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4" />
          أبلِغ التاجر على واتساب مع كل خطوة (إضافة إلى رسائل المنصة وإشعار البوابة)
        </label>
      ) : null}

      {phase === "new" ? (
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

      {phase === "review" ? (
        <div className="space-y-4">
          {quoteForm}
          <div className="flex flex-wrap gap-2 border-t border-ro-line pt-4">
            {requestMode === "propose_price" ? (
              <button
                type="button"
                className="rad-btn rad-gh rad-sm"
                disabled={pending}
                onClick={() => move("confirmed", "تم قبول سعر التاجر المقترح — بانتظار تأكيد التاجر النهائي")}
              >
                قبول سعر التاجر المقترح
              </button>
            ) : null}
            {cancelBtn}
          </div>
        </div>
      ) : null}

      {phase === "quoted" ? (
        <div className="space-y-3">
          <p className="text-sm">
            <b>أُرسل عرض السعر — بانتظار رد التاجر.</b> لا يمكن تأكيد الطلب إلا بقبول التاجر. سيصلك إشعار فور قبوله أو رفضه.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rad-btn rad-gh rad-sm" disabled={pending} onClick={() => setReQuote((v) => !v)}>
              {reQuote ? "إخفاء تعديل العرض" : "تعديل عرض السعر"}
            </button>
            {cancelBtn}
          </div>
          {reQuote ? <div className="border-t border-ro-line pt-4">{quoteForm}</div> : null}
        </div>
      ) : null}

      {phase === "awaiting_trader" ? (
        <div className="space-y-3">
          <p className="text-sm">
            <b>بانتظار تأكيد التاجر النهائي.</b> سيختار التاجر التأكيد عبر المنصة أو عبر واتساب، وستصلك رسالة وإشعار فور ذلك. لا تتوفر الفاتورة والشحن قبل تأكيده.
          </p>
          <div className="flex flex-wrap gap-2">{cancelBtn}</div>
        </div>
      ) : null}

      {phase === "payment" ? (
        <div className="space-y-4">
          <p className="text-sm">
            <b>أكّد التاجر الطلب{traderConfirmedVia === "whatsapp" ? " عبر واتساب" : " عبر المنصة"}.</b> أرسل الفاتورة، وعند وصول الدفعة أكّد استلامها.
          </p>
          {paidClaimed ? (
            <p
              role="status"
              className="rounded-lg border border-[color:var(--rad-bd)] p-3 text-sm"
              style={{ background: "color-mix(in srgb, var(--rad-ok, #2e9d6a) 12%, transparent)" }}
            >
              ✓ التاجر أفاد بأنه أرسل الدفعة — تحقق من الاستلام ثم أكّد.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rad-btn rad-pri rad-sm" disabled={pending} onClick={sendInvoice}>
              {invoiceUrl ? "إعادة إرسال الفاتورة في المحادثة" : "إرسال الفاتورة للتاجر في المحادثة"}
            </button>
            {invoiceUrl ? (
              <a className="rad-btn rad-gh rad-sm" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                عرض الفاتورة / طباعة
              </a>
            ) : null}
          </div>
          <div className="space-y-2 border-t border-ro-line pt-4">
            <button
              type="button"
              className="rad-btn rad-pri rad-sm"
              disabled={pending || !invoiceUrl}
              title={invoiceUrl ? undefined : "أرسل الفاتورة أولاً"}
              onClick={confirmPayment}
            >
              تأكيد استلام الدفعة
            </button>
            {!invoiceUrl ? <p className="text-xs opacity-70">يُفعَّل بعد إرسال الفاتورة.</p> : null}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-ro-line pt-4">{cancelBtn}</div>
        </div>
      ) : null}

      {phase === "shipping" || phase === "ready_to_complete" ? (
        <div className="space-y-4">
          {phase === "shipping" ? (
            <>
              <p className="text-sm">
                <b>تم استلام الدفعة.</b> سجّل بيانات الشحن عند خروج الشحنة (رقم التتبع اختياري).
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
                <TextField name="trackingReference" label={`${f.trackingReference} (اختياري)`} dir="ltr" dense />
                <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending}>
                  {f.saveShipping}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm">
                <b>شُحن الطلب</b>
                {shipping?.carrier ? ` عبر ${shipping.carrier}` : ""}
                {shipping?.tracking ? ` — رقم التتبع ${shipping.tracking}` : ""}. أتمم الطلب عند تأكيد التسليم.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rad-btn rad-pri rad-sm" disabled={pending} onClick={() => move("completed", "اكتمل الطلب")}>
                  إتمام الطلب (تم التسليم)
                </button>
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2 border-t border-ro-line pt-4">
            {invoiceUrl ? (
              <a className="rad-btn rad-gh rad-sm" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                عرض الفاتورة
              </a>
            ) : null}
            {cancelBtn}
          </div>
        </div>
      ) : null}

      {closed ? (
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
