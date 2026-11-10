"use client";

import { useActionState, useMemo, useState } from "react";
import {
  adminBrokerageTransitionAction,
  adminConfirmBrokeragePaymentAction,
  adminSaveInspectionAction,
  adminSendQuoteAction,
} from "@/app/brokerage-actions";
import type { ActionResult } from "@/app/actions";
import { brokerageNextHint } from "@/components/brokerage/labels";
import { BrokeragePhotoField } from "@/components/brokerage/photo-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui-kit/field";
import { canAdminTransition } from "@/lib/brokerage/status";
import { formatAdminMoney, formatAdminNumber } from "@/lib/i18n/admin-format";
import type { Locale } from "@/lib/i18n/config";

const initial: ActionResult | null = null;

function TransitionButton({
  action,
  requestId,
  toStatus,
  label,
  pending,
  variant = "primary",
  hint,
  children,
}: {
  action: (payload: FormData) => void;
  requestId: string;
  toStatus: string;
  label: string;
  pending: boolean;
  variant?: "primary" | "secondary";
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={requestId} />
      <input type="hidden" name="toStatus" value={toStatus} />
      {children}
      {hint ? (
        <p className="text-xs leading-snug text-[var(--ro-ink-600)]">{hint}</p>
      ) : null}
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        variant={variant}
        className="min-h-11"
      >
        {label}
      </Button>
    </form>
  );
}

export function BrokerageAdminPanel({
  requestId,
  status,
  locale,
  hasInspection = false,
  inspectionPhotoCount = 0,
}: {
  requestId: string;
  status: string;
  locale: string;
  hasInspection?: boolean;
  inspectionPhotoCount?: number;
}) {
  const [goods, setGoods] = useState(2000);
  const [rate, setRate] = useState(1.5);
  const [shipping, setShipping] = useState(50);
  const [carrier, setCarrier] = useState("Aramex");
  const [tracking, setTracking] = useState("");
  const commission = useMemo(
    () => Math.round(goods * (rate / 100) * 100) / 100,
    [goods, rate]
  );
  const total = goods + commission + shipping;

  const [tState, tAction, tPending] = useActionState(
    adminBrokerageTransitionAction,
    initial
  );
  const [iState, iAction, iPending] = useActionState(
    adminSaveInspectionAction,
    initial
  );
  const [qState, qAction, qPending] = useActionState(
    adminSendQuoteAction,
    initial
  );
  const [payState, payAction, payPending] = useActionState(
    adminConfirmBrokeragePaymentAction,
    initial
  );

  const ar = locale === "ar";
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const money = (n: number) => formatAdminMoney(n, "USD", loc);
  const err = (s: ActionResult | null) =>
    s && !s.ok ? (
      <p className="text-sm text-[var(--ro-danger-700)]">{s.error}</p>
    ) : null;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[var(--ro-ink-600)]">
        {brokerageNextHint(status, locale, "admin")}
      </p>

      {status === "AWAITING_PAYMENT" ? (
        <div className="space-y-3 rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-plum-900)_22%,transparent)] bg-[color-mix(in_srgb,var(--ro-plum-100)_40%,var(--ro-sand-50))] p-4">
          <p className="text-sm font-semibold text-ro-ink">
            {ar ? "تأكيد استلام الدفع" : "Confirm payment received"}
          </p>
          <p className="text-xs text-ro-muted">
            {ar
              ? "بعد تحقق التحويل عبر واتساب، أكّد النجاح لفتح المعاينة وباقي المراحل."
              : "After verifying the WhatsApp transfer, confirm to unlock inspection and the rest."}
          </p>
          {err(payState)}
          <form action={payAction}>
            <input type="hidden" name="id" value={requestId} />
            <Button type="submit" size="sm" disabled={payPending} className="min-h-11">
              {ar ? "تأكيد نجاح الدفع" : "Confirm payment success"}
            </Button>
          </form>
        </div>
      ) : null}

      {status === "PAYMENT_CONFIRMED" ? (
        <div className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-3">
          <TransitionButton
            action={tAction}
            requestId={requestId}
            toStatus="ACCEPTED"
            pending={tPending}
            label={ar ? "قبول للمعاينة" : "Accept for inspection"}
            hint={
              ar
                ? "بعد تأكيد الدفع — ينقل الطلب لترتيب المعاينة."
                : "After payment — moves into the inspection phase."
            }
          />
          {err(tState)}
        </div>
      ) : null}

      {status === "SUBMITTED" ? (
        <div className="space-y-4">
          <div className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-3">
            <TransitionButton
              action={tAction}
              requestId={requestId}
              toStatus="AWAITING_PAYMENT"
              pending={tPending}
              label={ar ? "فتح مسار الدفع" : "Open payment path"}
              hint={
                ar
                  ? "ينقل الطلب إلى انتظار الدفع عبر واتساب."
                  : "Moves the request to awaiting WhatsApp payment."
              }
            />
          </div>
          {canAdminTransition(status, "NEEDS_INFO") ? (
            <div className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-3">
              <TransitionButton
                action={tAction}
                requestId={requestId}
                toStatus="NEEDS_INFO"
                pending={tPending}
                variant="secondary"
                label={ar ? "طلب معلومات من التاجر" : "Request info from trader"}
                hint={
                  ar
                    ? "يوقف المسار حتى يكمّل التاجر البيانات الناقصة."
                    : "Pauses the path until the trader supplies missing details."
                }
              />
            </div>
          ) : null}
          {canAdminTransition(status, "DECLINED") ? (
            <div className="rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-danger-700)_20%,transparent)] bg-[color-mix(in_srgb,var(--ro-danger-100)_35%,var(--ro-sand-50))] p-3">
              <TransitionButton
                action={tAction}
                requestId={requestId}
                toStatus="DECLINED"
                pending={tPending}
                variant="secondary"
                label={ar ? "رفض الطلب" : "Decline request"}
                hint={
                  ar
                    ? "ينهي الطلب نهائياً من جهة الإدارة."
                    : "Ends the request permanently on the admin side."
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {status === "NEEDS_INFO" ? (
        <div className="space-y-4">
          <div className="rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-amber-500)_40%,transparent)] bg-[color-mix(in_srgb,var(--ro-amber-100)_40%,var(--ro-sand-50))] p-4 text-sm text-[var(--ro-amber-800)]">
            {ar
              ? "بانتظار رد التاجر. بعد عودة الطلب بحالة «طلب جديد» يمكنك القبول من هناك، أو اتخذ قراراً الآن إن اكتملت الصورة."
              : "Waiting on the trader. After they resubmit as “New request” you can accept from there — or decide now if you already have enough."}
          </div>
          {canAdminTransition(status, "ACCEPTED") ? (
            <TransitionButton
              action={tAction}
              requestId={requestId}
              toStatus="ACCEPTED"
              pending={tPending}
              label={ar ? "قبول للمعاينة الآن" : "Accept for inspection now"}
            />
          ) : null}
          <div className="flex flex-wrap gap-3">
            {canAdminTransition(status, "DECLINED") ? (
              <TransitionButton
                action={tAction}
                requestId={requestId}
                toStatus="DECLINED"
                pending={tPending}
                variant="secondary"
                label={ar ? "رفض" : "Decline"}
              />
            ) : null}
            {canAdminTransition(status, "CANCELLED") ? (
              <TransitionButton
                action={tAction}
                requestId={requestId}
                toStatus="CANCELLED"
                pending={tPending}
                variant="secondary"
                label={ar ? "إلغاء" : "Cancel"}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {status === "ACCEPTED" ? (
        <div className="space-y-4">
          <div className="rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-plum-700)_25%,transparent)] bg-[color-mix(in_srgb,var(--ro-plum-50)_50%,var(--ro-sand-50))] p-4">
            <h3 className="font-display text-base font-semibold text-ro-ink">
              {ar ? "جدولة المعاينة" : "Schedule inspection"}
            </h3>
            <p className="mt-1 mb-3 text-xs text-[var(--ro-ink-600)]">
              {ar
                ? "الخطوة الأساسية الآن: تأكيد أن المعاينة مجدولة ثم المتابعة لتقرير النتيجة."
                : "Primary step: mark inspection as scheduled, then file the report."}
            </p>
            <TransitionButton
              action={tAction}
              requestId={requestId}
              toStatus="INSPECTION_SCHEDULED"
              pending={tPending}
              label={ar ? "تأكيد جدولة المعاينة" : "Confirm inspection scheduled"}
            />
          </div>
          {canAdminTransition(status, "DECLINED") ? (
            <TransitionButton
              action={tAction}
              requestId={requestId}
              toStatus="DECLINED"
              pending={tPending}
              variant="secondary"
              label={ar ? "رفض الطلب" : "Decline"}
            />
          ) : null}
        </div>
      ) : null}

      {status === "INSPECTION_SCHEDULED" ? (
        <form
          action={iAction}
          encType="multipart/form-data"
          className="space-y-3 rounded-[var(--ro-r-md)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4"
        >
          <h3 className="text-base font-semibold text-[color:var(--rad-tx,var(--ro-ink))]">
            {ar ? "تقرير المعاينة" : "Inspection report"}
          </h3>
          <p className="text-xs text-[color:var(--rad-tx3,var(--ro-ink-600))]">
            {ar
              ? "حفظ التقرير ينقل الطلب تلقائياً إلى «اكتملت المعاينة» ثم بناء العرض. أرفق صور المعاينة."
              : "Saving the report advances to “Inspected”, then you build the quote. Attach inspection photos."}
          </p>
          <input type="hidden" name="requestId" value={requestId} />
          <Field label={ar ? "التقدير" : "Grade"}>
            <Select name="grade" defaultValue="B">
              {["A", "B", "C", "D"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={ar ? "ملاحظات" : "Notes"}>
            <Textarea name="notesAr" required rows={3} />
          </Field>
          <Field label={ar ? "التوصية" : "Verdict"}>
            <Input name="verdictAr" required />
          </Field>
          <BrokeragePhotoField
            locale={locale}
            alreadyCount={inspectionPhotoCount}
          />
          <Button type="submit" disabled={iPending} className="min-h-11">
            {ar ? "حفظ التقرير وإكمال المعاينة" : "Save report & complete inspection"}
          </Button>
          {err(iState)}
        </form>
      ) : null}

      {status === "INSPECTED" ? (
        <div className="space-y-4">
          <form
            action={qAction}
            className="space-y-3 rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-plum-700)_30%,transparent)] bg-[color-mix(in_srgb,var(--ro-plum-50)_45%,var(--ro-sand-50))] p-4"
          >
            <h3 className="text-base font-semibold text-[color:var(--rad-tx,var(--ro-ink))]">
              {ar ? "بناء وإرسال عرض السعر" : "Build & send quote"}
            </h3>
            <p className="text-xs text-[color:var(--rad-tx3,var(--ro-ink-600))]">
              {ar
                ? "هذه الخطوة الأساسية بعد المعاينة. إرسال العرض ينقل الطلب لانتظار التاجر."
                : "This is the primary post-inspection step. Sending moves the request to the trader."}
            </p>
            <input type="hidden" name="requestId" value={requestId} />
            <Field label={ar ? "قيمة البضاعة (USD)" : "Goods value (USD)"}>
              <Input
                type="number"
                name="goodsValueUsd"
                value={goods}
                onChange={(e) => setGoods(Number(e.target.value))}
                dir="ltr"
                className="tabular-nums"
              />
            </Field>
            <Field
              label={
                ar
                  ? `العمولة ${formatAdminNumber(rate, loc, { maximumFractionDigits: 1 })}%`
                  : `Commission ${formatAdminNumber(rate, loc, { maximumFractionDigits: 1 })}%`
              }
            >
              <input
                type="range"
                name="commissionRate"
                min={1}
                max={2}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="mt-1 w-full accent-[color:var(--rad-ac,var(--ro-plum-900))]"
              />
            </Field>
            <Field label={ar ? "الشحن (USD)" : "Shipping (USD)"}>
              <Input
                type="number"
                name="shippingUsd"
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value))}
                dir="ltr"
                className="tabular-nums"
              />
            </Field>
            <p className="text-sm text-[color:var(--rad-tx3,var(--ro-ink-600))]">
              {ar ? "العمولة" : "Commission"}:{" "}
              <bdi dir="ltr">{money(commission)}</bdi> ·{" "}
              {ar ? "الإجمالي للتاجر" : "Trader total"}:{" "}
              <bdi dir="ltr">{money(total)}</bdi>
            </p>
            <Button type="submit" disabled={qPending} className="min-h-11">
              {ar ? "إرسال العرض للتاجر" : "Send quote to trader"}
            </Button>
            {err(qState)}
          </form>
          {!hasInspection ? (
            <p className="text-xs text-[var(--ro-ink-500)]">
              {ar
                ? "ملاحظة: لا يوجد تقرير معاينة مرتبط — راجع السجل إن لزم."
                : "Note: no inspection report on file — check the timeline if needed."}
            </p>
          ) : null}
          {canAdminTransition(status, "DECLINED") ? (
            <TransitionButton
              action={tAction}
              requestId={requestId}
              toStatus="DECLINED"
              pending={tPending}
              variant="secondary"
              label={ar ? "رفض بعد المعاينة" : "Decline after inspection"}
            />
          ) : null}
        </div>
      ) : null}

      {status === "QUOTE_SENT" ? (
        <div
          className="rounded-[14px] border p-4"
          style={{
            borderColor: "var(--rad-warn)",
            background: "var(--rad-warns)",
          }}
        >
          <h3
            className="font-display text-base font-semibold"
            style={{ color: "var(--rad-tx)" }}
          >
            {ar ? "بانتظار قرار التاجر" : "Waiting on trader"}
          </h3>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: "var(--rad-tx2)" }}
          >
            {ar
              ? "العرض أُرسل. لا تعدّل العرض من هنا — انتظر موافقة التاجر أو رفضه. بعدها تظهر خطوات الشراء والشحن."
              : "The quote is out. Do not rebuild it here — wait for approval or rejection. Purchase and shipping steps appear after."}
          </p>
          {canAdminTransition(status, "DECLINED") ? (
            <div className="mt-4">
              <TransitionButton
                action={tAction}
                requestId={requestId}
                toStatus="DECLINED"
                pending={tPending}
                variant="secondary"
                label={ar ? "سحب / رفض من الإدارة" : "Admin withdraw / decline"}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {status === "APPROVED" ? (
        <div
          className="rounded-[14px] border p-4"
          style={{
            borderColor: "var(--rad-ok)",
            background: "var(--rad-oks)",
          }}
        >
          <h3
            className="font-display text-base font-semibold"
            style={{ color: "var(--rad-tx)" }}
          >
            {ar ? "تنفيذ الشراء" : "Execute purchase"}
          </h3>
          <p
            className="mt-1 mb-3 text-xs"
            style={{ color: "var(--rad-tx2)" }}
          >
            {ar
              ? "التاجر وافق. اشترِ القطعة ثم سجّل إتمام الشراء."
              : "Trader approved. Buy the piece, then mark purchased."}
          </p>
          <TransitionButton
            action={tAction}
            requestId={requestId}
            toStatus="PURCHASED"
            pending={tPending}
            label={ar ? "تسجيل إتمام الشراء" : "Mark purchased"}
          />
          {canAdminTransition(status, "CANCELLED") ? (
            <div className="mt-3">
              <TransitionButton
                action={tAction}
                requestId={requestId}
                toStatus="CANCELLED"
                pending={tPending}
                variant="secondary"
                label={ar ? "إلغاء" : "Cancel"}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {status === "PURCHASED" ? (
        <div className="space-y-3 rounded-[var(--rad-r,14px)] border border-[color:var(--rad-bd,var(--ro-border-subtle))] bg-[color:var(--rad-surface2,var(--ro-sand-50))] p-4">
          <h3 className="text-base font-semibold text-[color:var(--rad-tx,var(--ro-ink))]">
            {ar ? "تسجيل الشحن" : "Record shipment"}
          </h3>
          <Field label={ar ? "الناقل" : "Carrier"}>
            <Input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              dir="ltr"
            />
          </Field>
          <Field label={ar ? "رقم التتبع" : "Tracking ref"}>
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="TRK-…"
              dir="ltr"
              className="rad-mono"
            />
          </Field>
          <TransitionButton
            action={tAction}
            requestId={requestId}
            toStatus="SHIPPED"
            pending={tPending || !tracking.trim()}
            label={ar ? "تأكيد الشحن" : "Confirm shipped"}
            hint={
              !tracking.trim()
                ? ar
                  ? "أدخل رقم التتبع قبل التأكيد."
                  : "Enter a tracking number before confirming."
                : undefined
            }
          >
            <input type="hidden" name="carrier" value={carrier.trim() || "Aramex"} />
            <input type="hidden" name="trackingRef" value={tracking.trim()} />
          </TransitionButton>
        </div>
      ) : null}

      {status === "SHIPPED" ? (
        <div className="rounded-[var(--rad-r,14px)] border border-[color:var(--rad-bd,var(--ro-border-subtle))] bg-[color:var(--rad-surface2,var(--ro-sand-50))] p-4">
          <h3 className="text-base font-semibold text-[color:var(--rad-tx,var(--ro-ink))]">
            {ar ? "تأكيد التسليم" : "Confirm delivery"}
          </h3>
          <p className="mt-1 mb-3 text-xs text-[color:var(--rad-tx3,var(--ro-ink-600))]">
            {ar
              ? "عند وصول الشحنة للتاجر سجّل التسليم."
              : "When the trader receives the parcel, mark delivered."}
          </p>
          <TransitionButton
            action={tAction}
            requestId={requestId}
            toStatus="DELIVERED"
            pending={tPending}
            label={ar ? "تأكيد التسليم" : "Mark delivered"}
          />
        </div>
      ) : null}

      {status === "DELIVERED" ? (
        <div className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4">
          <h3 className="font-display text-base font-semibold text-ro-ink">
            {ar ? "إغلاق الملف" : "Close file"}
          </h3>
          <p className="mt-1 mb-3 text-xs text-[var(--ro-ink-600)]">
            {ar
              ? "التسليم تم. أغلق الطلب لإتمام دورة الوساطة."
              : "Delivery done. Close the request to finish the lifecycle."}
          </p>
          <TransitionButton
            action={tAction}
            requestId={requestId}
            toStatus="CLOSED"
            pending={tPending}
            label={ar ? "إغلاق الطلب" : "Close request"}
          />
        </div>
      ) : null}

      {status === "CLOSED" ||
      status === "DECLINED" ||
      status === "REJECTED" ||
      status === "CANCELLED" ? (
        <div className="rounded-[var(--ro-r-md)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4 text-sm text-[var(--ro-ink-600)]">
          {ar
            ? "لا إجراءات إدارية متبقية لهذه الحالة."
            : "No further admin actions for this status."}
        </div>
      ) : null}

      {err(tState)}
    </div>
  );
}
