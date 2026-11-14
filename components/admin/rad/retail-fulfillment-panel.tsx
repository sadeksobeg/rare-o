"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminPostRetailShipmentUpdateAction,
  adminSendRetailToShippingAction,
  adminSetRetailPaymentAction,
} from "@/app/retail-fulfillment-actions";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { SHIPMENT_STATUS_AR } from "@/lib/shipping/shipments-shared";

const ERR: Record<string, string> = {
  PAYMENT_REQUIRED: "حدّد طريقة الدفع أولاً",
  PAYMENT_NOT_CONFIRMED: "أكّد استلام الدفعة المسبقة قبل الإرسال للشحن",
  SHIPMENT_EXISTS: "توجد شحنة لهذا الطلب بالفعل",
  REQUEST_CLOSED: "الطلب مُغلق",
  INVALID_TRANSITION: "هذا الانتقال غير مسموح للشحنة",
  NOTHING_TO_POST: "اكتب ملاحظة أو غيّر الحالة",
  NO_CONVERSATION: "لا محادثة واتساب للعميل",
  WHATSAPP_DOWN: "واتساب غير متصل",
  BLOCKED: "محادثة العميل محظورة",
  RATE_LIMITED: "تجاوزتَ حد الإرسال",
};

type ShipmentView = {
  id: string;
  status: string;
  carrierLabel: string;
  trackingNumber: string | null;
  next: string[];
  recent: { status: string; note: string; at: string }[];
};

type Props = {
  requestId: string;
  closed: boolean;
  paymentMode: "prepaid" | "cod" | null;
  paymentConfirmed: boolean;
  etaLabel: string | null;
  methodLabel: string;
  shipment: ShipmentView | null;
  canNotify: boolean;
  optedIn: boolean;
  defaultPrice: string;
};

const QUICK: { label: string; to: string; note: string }[] = [
  { label: "جُهّزت وغُلّفت", to: "PACKED", note: "" },
  { label: "سُلّمت للناقل", to: "HANDED_OVER", note: "" },
  { label: "وصلت إلى المكان المتفق عليه", to: "ARRIVED", note: "وصلت الشحنة إلى المكان المتفق عليه — يرجى التواصل لاستلامها." },
  { label: "في الطريق", to: "IN_TRANSIT", note: "" },
  { label: "تم التسليم", to: "DELIVERED", note: "" },
];

/**
 * «الدفع والشحن» — agree the payment mode, send the request to shipping, post
 * shipment updates (status and/or a free note) and tell the customer on WhatsApp.
 */
export function RetailFulfillmentPanel(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"prepaid" | "cod" | null>(p.paymentMode);
  const [paid, setPaid] = useState(p.paymentConfirmed);
  const [shipOpen, setShipOpen] = useState(false);
  const [ship, setShip] = useState({ carrier: "", tracking: "", address: "", price: p.defaultPrice });
  const [shipError, setShipError] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState("");
  const [notify, setNotify] = useState(p.optedIn && p.canNotify);

  const paymentDirty = mode !== p.paymentMode || (mode === "prepaid" && paid !== p.paymentConfirmed);

  function savePayment() {
    if (!mode) return;
    const fd = new FormData();
    fd.set("requestId", p.requestId);
    fd.set("mode", mode);
    fd.set("confirmed", paid ? "1" : "0");
    start(async () => {
      const res = await adminSetRetailPaymentAction(fd);
      if (!res.ok) return void toast.error(ERR[res.error] ?? "تعذّر الحفظ");
      toast.success("حُفظت طريقة الدفع");
      router.refresh();
    });
  }

  function sendToShipping() {
    setShipError(null);
    const fd = new FormData();
    fd.set("requestId", p.requestId);
    fd.set("carrierLabel", ship.carrier);
    fd.set("trackingNumber", ship.tracking);
    fd.set("destAddress", ship.address);
    fd.set("priceCharged", ship.price);
    start(async () => {
      const res = await adminSendRetailToShippingAction(fd);
      if (!res.ok) return void setShipError(ERR[res.error] ?? "تعذّر الإنشاء");
      setShipOpen(false);
      toast.success("أُرسل الطلب للشحن");
      router.refresh();
    });
  }

  function postUpdate(override?: { to: string; note: string }) {
    if (!p.shipment) return;
    const fd = new FormData();
    fd.set("shipmentId", p.shipment.id);
    fd.set("to", override?.to ?? to);
    fd.set("note", override?.note ?? note);
    fd.set("trackingNumber", tracking);
    if (notify && p.canNotify) fd.set("notifyCustomer", "1");
    start(async () => {
      const res = await adminPostRetailShipmentUpdateAction(fd);
      if (!res.ok) return void toast.error(ERR[res.error] ?? "تعذّر النشر");
      const n = res.data?.notified;
      toast.success(
        n === "sent"
          ? "نُشر التحديث وأُرسل للعميل عبر واتساب"
          : n && n !== "skipped"
            ? `نُشر التحديث (لم يُرسل للعميل: ${ERR[n] ?? n})`
            : "نُشر التحديث — يظهر للعميل في صفحة طلبه"
      );
      setTo("");
      setNote("");
      setTracking("");
      router.refresh();
    });
  }

  const radio = (value: "prepaid" | "cod", title: string, hint: string) => (
    <label
      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"
      style={{
        borderColor: mode === value ? "var(--rad-ac, #a678d8)" : "var(--rad-bd)",
        background: mode === value ? "color-mix(in srgb, var(--rad-ac, #a678d8) 10%, transparent)" : "transparent",
      }}
    >
      <input
        type="radio"
        name="payment"
        checked={mode === value}
        disabled={p.closed}
        onChange={() => setMode(value)}
        className="mt-1 size-4"
      />
      <span>
        <b className="block">{title}</b>
        <span className="text-xs opacity-70">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-label="طريقة الدفع">
        <h4 className="text-sm font-semibold">طريقة الدفع المتفق عليها</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {radio("cod", "عند الاستلام", "يدفع العميل للمندوب عند التسليم")}
          {radio("prepaid", "دفع مسبق", "تؤكد استلام الدفعة قبل الشحن")}
        </div>
        {mode === "prepaid" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={paid} disabled={p.closed} onChange={(e) => setPaid(e.target.checked)} className="size-4" />
            تم استلام الدفعة
          </label>
        ) : null}
        {paymentDirty && mode ? (
          <button type="button" className="rad-btn rad-pri rad-sm" disabled={pending || p.closed} onClick={savePayment}>
            حفظ طريقة الدفع
          </button>
        ) : null}
      </section>

      <section className="space-y-3" aria-label="الشحن">
        <h4 className="text-sm font-semibold">الشحن</h4>
        <p className="text-sm opacity-80">
          {p.methodLabel || "طريقة الشحن غير محددة"}
          {p.etaLabel ? ` — الوصول المتوقع: ${p.etaLabel}` : " — المدة المتوقعة غير مضبوطة (اضبطها من إعدادات الشحن ← الطرق)"}
        </p>

        {!p.shipment ? (
          <>
            <button
              type="button"
              className="rad-btn rad-pri rad-sm"
              disabled={p.closed || !mode || (mode === "prepaid" && !p.paymentConfirmed) || paymentDirty}
              onClick={() => {
                setShipError(null);
                setShipOpen(true);
              }}
            >
              إرسال للشحن
            </button>
            {!mode ? <p className="text-xs opacity-70">حدّد طريقة الدفع أولاً.</p> : null}
            {mode === "prepaid" && !p.paymentConfirmed ? <p className="text-xs opacity-70">أكّد استلام الدفعة لتتمكن من الإرسال للشحن.</p> : null}
          </>
        ) : (
          <div className="space-y-4 rounded-lg border p-4" style={{ borderColor: "var(--rad-bd)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <b>{SHIPMENT_STATUS_AR[p.shipment.status] ?? p.shipment.status}</b>
              <span className="opacity-70">
                {p.shipment.carrierLabel || "—"}
                {p.shipment.trackingNumber ? (
                  <>
                    {" · "}
                    <bdi dir="ltr">{p.shipment.trackingNumber}</bdi>
                  </>
                ) : null}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK.filter((q) => q.to === p.shipment!.status || p.shipment!.next.includes(q.to)).map((q) => (
                <button
                  key={q.to}
                  type="button"
                  className="rad-btn rad-gh rad-sm"
                  disabled={pending}
                  onClick={() => postUpdate({ to: q.to, note: q.note })}
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>الحالة التالية</span>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-11 w-full rounded-md border bg-transparent px-3"
                  style={{ borderColor: "var(--rad-bd)" }}
                >
                  <option value="">بدون تغيير الحالة</option>
                  {p.shipment.next.map((s) => (
                    <option key={s} value={s}>
                      {SHIPMENT_STATUS_AR[s] ?? s}
                    </option>
                  ))}
                </select>
              </label>
              <TextField name="trackingNumber" label="رقم التتبع (اختياري)" value={tracking} onChange={(e) => setTracking(e.target.value)} dense dir="ltr" maxLength={64} />
            </div>
            <label className="block space-y-1 text-sm">
              <span>ملاحظة تظهر للعميل</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="مثال: وصلت الشحنة إلى المكان المتفق عليه"
                className="w-full rounded-md border bg-transparent p-3"
                style={{ borderColor: "var(--rad-bd)" }}
              />
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ opacity: p.canNotify ? 1 : 0.55 }}>
              <input type="checkbox" checked={notify && p.canNotify} disabled={!p.canNotify} onChange={(e) => setNotify(e.target.checked)} className="size-4" />
              إرسال التحديث للعميل عبر واتساب
              {!p.canNotify ? " — لا توجد محادثة للعميل" : p.optedIn ? " — العميل وافق على التحديثات" : ""}
            </label>
            <button type="button" className="rad-btn rad-pri rad-sm" disabled={pending || (!to && !note.trim() && !tracking.trim())} onClick={() => postUpdate()}>
              نشر التحديث
            </button>

            {p.shipment.recent.length > 0 ? (
              <ul className="space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: "var(--rad-bd)" }}>
                {p.shipment.recent.map((e, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      <b>{SHIPMENT_STATUS_AR[e.status] ?? e.status}</b>
                      {e.note ? ` — ${e.note}` : ""}
                    </span>
                    <bdi dir="ltr" className="opacity-60">
                      {e.at}
                    </bdi>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      <Dialog open={shipOpen} onClose={() => setShipOpen(false)} title="إرسال الطلب للشحن" size="md">
        <div className="space-y-3">
          <TextField name="carrierLabel" label="الناقل / شركة الشحن" value={ship.carrier} onChange={(e) => setShip({ ...ship, carrier: e.target.value })} dense maxLength={120} />
          <TextField name="trackingNumber" label="رقم التتبع (إن توفر)" value={ship.tracking} onChange={(e) => setShip({ ...ship, tracking: e.target.value })} dense dir="ltr" maxLength={64} />
          <TextField name="destAddress" label="عنوان التسليم / المكان المتفق عليه" value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} dense maxLength={300} />
          <TextField name="priceCharged" label="كلفة الشحن" value={ship.price} onChange={(e) => setShip({ ...ship, price: e.target.value })} dense dir="ltr" inputMode="decimal" />
          {shipError ? (
            <p role="alert" className="text-sm" style={{ color: "var(--rad-err)" }}>
              {shipError}
            </p>
          ) : null}
          <div className="rad-link-dialog-actions">
            <button type="button" className="rad-btn rad-gh rad-sm" onClick={() => setShipOpen(false)}>
              إلغاء
            </button>
            <button type="button" className="rad-btn rad-pri rad-sm" disabled={pending} onClick={sendToShipping}>
              إنشاء الشحنة
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
