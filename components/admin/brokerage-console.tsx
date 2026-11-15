"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminBrokerageTransitionAction,
  adminConfirmBrokeragePaymentAction,
  adminRequestBrokeragePhotosAction,
  adminSaveInspectionAction,
  adminSendBrokerageInvoiceAction,
} from "@/app/brokerage-actions";
import { PhotoUploader } from "@/components/brokerage/photo-uploader";
import { ConfirmDialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import {
  GRADE_META,
  INSPECTION_RESULT_META,
  emptyChecklist,
  parseChecklist,
  type InspectionResult,
  type InspectionRow,
} from "@/lib/brokerage/inspection";
import { canAdminTransition } from "@/lib/brokerage/status";
import { formErrorClass } from "@/lib/ui/form-classes";
import { cn } from "@/lib/utils";

const ERR: Record<string, string> = {
  INVALID_TRANSITION: "هذا الانتقال غير متاح في المرحلة الحالية",
  INSPECTION_REPORT_REQUIRED: "احفظ تقرير المعاينة أولاً",
  INSPECTION_DATE_REQUIRED: "حدّد موعد المعاينة",
  PAYMENT_REQUIRED: "لا شحن قبل تأكيد الدفع",
  PURCHASE_REQUIRED: "سجّل شراء القطعة أولاً",
  CARRIER_REQUIRED: "اسم شركة الشحن مطلوب",
  INVOICE_REQUIRED: "أرسل الفاتورة للتاجر أولاً",
  NOTE_REQUIRED: "اكتب ما تحتاجه من التاجر",
  PHOTOS_NOT_ALLOWED: "لا يمكن طلب صور في هذه المرحلة",
  NOT_FOUND: "الطلب غير موجود",
};
const WA: Record<string, string> = {
  NO_CONVERSATION: "لا توجد محادثة واتساب مع التاجر",
  WHATSAPP_DOWN: "واتساب غير متصل",
  BLOCKED: "محادثة التاجر محظورة",
  RATE_LIMITED: "حد الإرسال — حاول لاحقاً",
  FAILED: "تعذّر الإرسال",
};

type Res = { ok: boolean; error?: string; data?: unknown };

export function BrokerageConsole({
  requestId,
  status,
  invoiceUrl,
  paidClaimed,
  inspection,
  hasPurchased,
  paymentConfirmed,
}: {
  requestId: string;
  status: string;
  invoiceUrl: string | null;
  paidClaimed: { via: string | null } | null;
  inspection: { grade: string; notesAr: string; verdictAr: string; checklist: string } | null;
  hasPurchased: boolean;
  paymentConfirmed: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | { to: string; title: string; body: string; label: string; destructive: boolean; needsReason?: boolean }>(null);
  const [reason, setReason] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [photoOpen, setPhotoOpen] = useState(false);

  function report(res: Res, okText: string) {
    if (!res.ok) {
      const code = res.error ?? "";
      setError(ERR[code] ?? (code && code.length < 80 ? code : "تعذّر التنفيذ"));
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
            ? ` — وأُرسلت للتاجر عبر المنصة (تعذّر واتساب: ${WA[wa ?? ""] ?? wa})`
            : "";
    }
    toast.success(okText + tail);
    router.refresh();
  }

  function run(fn: () => Promise<Res>, okText: string) {
    start(async () => {
      setError(null);
      report(await fn(), okText);
    });
  }

  function move(to: string, okText: string, extra: Record<string, string> = {}) {
    const fd = new FormData();
    fd.set("id", requestId);
    fd.set("toStatus", to);
    for (const [k, v] of Object.entries(extra)) if (v) fd.set(k, v);
    run(() => adminBrokerageTransitionAction(null, fd), okText);
  }

  const terminal = ["CLOSED", "DECLINED", "REJECTED", "CANCELLED"].includes(status);
  const blockPhotos = terminal || status === "DELIVERED";

  const btn = (label: string, onClick: () => void, kind: "pri" | "gh" = "pri", disabled = false) => (
    <button type="button" className={`rad-btn rad-${kind} rad-sm`} disabled={pending || disabled} onClick={onClick}>
      {label}
    </button>
  );

  const declineBtn = (label = "رفض الطلب") =>
    canAdminTransition(status, "DECLINED")
      ? btn(label, () => setConfirm({ to: "DECLINED", title: "رفض هذا الطلب؟", body: "سيُبلَّغ التاجر بالرفض. اكتب السبب (اختياري).", label: "رفض", destructive: true, needsReason: true }), "gh")
      : null;
  const cancelBtn = canAdminTransition(status, "CANCELLED")
    ? btn("إلغاء الطلب", () => setConfirm({ to: "CANCELLED", title: "إلغاء هذا الطلب؟", body: "سيُبلَّغ التاجر بالإلغاء.", label: "إلغاء الطلب", destructive: true }), "gh")
    : null;

  return (
    <div className="space-y-5">
      {/* ---- stage-specific main action ---- */}
      {status === "SUBMITTED" || status === "NEEDS_INFO" ? (
        <div className="space-y-3">
          <p className="text-sm">
            <b>{status === "NEEDS_INFO" ? "بانتظار رد التاجر على طلب المعلومات." : "طلب جديد بانتظار قرارك."}</b>{" "}
            راجع التفاصيل والصور، ثم اقبل الطلب للمعاينة أو اطلب ما ينقص.
          </p>
          <div className="flex flex-wrap gap-2">
            {btn("قبول الطلب للمعاينة", () => move("ACCEPTED", "قُبل الطلب للمعاينة"))}
            {status === "SUBMITTED" ? btn("طلب معلومات إضافية", () => setConfirm({ to: "NEEDS_INFO", title: "طلب معلومات من التاجر", body: "اكتب ما تحتاجه — يصل للتاجر على المنصة وواتساب.", label: "إرسال الطلب", destructive: false, needsReason: true }), "gh") : null}
            {declineBtn()}
          </div>
        </div>
      ) : null}

      {status === "ACCEPTED" ? (
        <form
          className="space-y-3"
          action={(fd) => {
            fd.set("id", requestId);
            fd.set("toStatus", "INSPECTION_SCHEDULED");
            run(() => adminBrokerageTransitionAction(null, fd), "حُدّد موعد المعاينة");
          }}
        >
          <p className="text-sm">
            <b>قُبل الطلب.</b> حدّد موعد المعاينة ومكانها والمعاين.
          </p>
          <TextField name="inspectionAt" type="datetime-local" label="موعد المعاينة" required dense dir="ltr" />
          <TextField name="inspectionLocation" label="المكان" dense />
          <TextField name="inspectionAssignee" label="المعاين المسؤول" dense />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending}>
              حفظ الموعد وإبلاغ التاجر
            </button>
            {declineBtn()}
          </div>
        </form>
      ) : null}

      {status === "INSPECTION_SCHEDULED" || status === "INSPECTED" ? (
        <InspectionEditor
          requestId={requestId}
          initial={inspection}
          locked={false}
          onSaved={(res) => report(res, "حُفظ تقرير المعاينة")}
          pending={pending}
          start={start}
          setError={setError}
          saved={status === "INSPECTED"}
        />
      ) : null}

      {status === "INSPECTED" ? (
        <div className="space-y-3 border-t border-[color:var(--rad-bd)] pt-4">
          <p className="text-sm">
            <b>تقرير المعاينة محفوظ ومرئي للتاجر.</b> إن كانت القطعة مناسبة نفّذ الشراء وسجّله هنا.
          </p>
          <div className="flex flex-wrap gap-2">
            {btn("تسجيل شراء القطعة", () => move("PURCHASED", "سُجّل شراء القطعة"))}
            {declineBtn("رفض بعد المعاينة")}
          </div>
        </div>
      ) : null}

      {status === "PURCHASED" && !paymentConfirmed ? (
        <div className="space-y-3">
          <p className="text-sm">
            <b>تم شراء القطعة.</b> الخطوة الأخيرة قبل الشحن: الدفع. افتح مرحلة الدفع لتصدر الفاتورة.
          </p>
          {btn("فتح مرحلة الدفع", () => move("AWAITING_PAYMENT", "فُتحت مرحلة الدفع"))}
        </div>
      ) : null}

      {status === "AWAITING_PAYMENT" ? (
        <div className="space-y-4">
          <p className="text-sm">
            <b>مرحلة الدفع.</b> أرسل الفاتورة للتاجر، وعند وصول التحويل أكّد الاستلام.
          </p>
          {paidClaimed ? (
            <p
              role="status"
              className="rounded-lg border border-[color:var(--rad-bd)] p-3 text-sm"
              style={{ background: "color-mix(in srgb, var(--rad-ok, #2e9d6a) 12%, transparent)" }}
            >
              ✓ التاجر أبلغ بالدفع {paidClaimed.via === "whatsapp" ? "(عبر واتساب)" : "(عبر المنصة)"} — تحقق من الاستلام ثم أكّد.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {btn(invoiceUrl ? "إعادة إرسال الفاتورة في المحادثة" : "إرسال الفاتورة للتاجر في المحادثة", () => {
              const fd = new FormData();
              fd.set("id", requestId);
              run(() => adminSendBrokerageInvoiceAction(fd), "أُصدرت الفاتورة ووُضع رابطها في محادثة التاجر");
            })}
            {invoiceUrl ? (
              <a className="rad-btn rad-gh rad-sm" href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                عرض الفاتورة / طباعة
              </a>
            ) : null}
          </div>
          <div className="border-t border-[color:var(--rad-bd)] pt-4">
            {btn("تأكيد استلام الدفعة", () => setConfirm({ to: "__PAY__", title: "تأكيد استلام الدفعة؟", body: "تأكّد من وصول المبلغ قبل المتابعة. يُسجَّل الإجراء باسمك.", label: "تأكيد الاستلام", destructive: false }), "pri", !invoiceUrl)}
            {!invoiceUrl ? <p className="mt-1.5 text-xs opacity-70">يُفعَّل بعد إرسال الفاتورة.</p> : null}
          </div>
        </div>
      ) : null}

      {(status === "PAYMENT_CONFIRMED" && hasPurchased) || (status === "PURCHASED" && paymentConfirmed) ? (
        <form
          className="space-y-3"
          action={(fd) => {
            fd.set("id", requestId);
            fd.set("toStatus", "SHIPPED");
            run(() => adminBrokerageTransitionAction(null, fd), "سُجّل الشحن");
          }}
        >
          <p className="text-sm">
            <b>تم استلام الدفعة.</b> سجّل بيانات الشحن (رقم التتبع اختياري).
          </p>
          <TextField name="carrier" label="شركة الشحن" required dense />
          <TextField name="trackingRef" label="رقم التتبع (اختياري)" dense dir="ltr" />
          <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending}>
            حفظ الشحن وإبلاغ التاجر
          </button>
        </form>
      ) : null}

      {status === "SHIPPED" ? (
        <div className="space-y-3">
          <p className="text-sm">
            <b>الشحنة في الطريق.</b> أكّد التسليم عند وصولها للتاجر.
          </p>
          {btn("تأكيد التسليم", () => move("DELIVERED", "تم تأكيد التسليم"))}
        </div>
      ) : null}

      {status === "DELIVERED" ? (
        <div className="space-y-3">
          <p className="text-sm">
            <b>تم التسليم.</b> أغلق الطلب لإكماله.
          </p>
          {btn("إغلاق الطلب", () => move("CLOSED", "أُغلق الطلب"))}
        </div>
      ) : null}

      {/* legacy statuses keep their generic buttons */}
      {["APPROVED", "QUOTE_SENT"].includes(status) ? (
        <div className="flex flex-wrap gap-2">
          {canAdminTransition(status, "PURCHASED") ? btn("تسجيل الشراء", () => move("PURCHASED", "سُجّل الشراء")) : null}
          {declineBtn()}
        </div>
      ) : null}

      {terminal ? <p className="text-sm opacity-70">انتهى هذا الطلب.</p> : null}

      {/* ---- photo request (any open stage) ---- */}
      {!blockPhotos ? (
        <div className="space-y-3 border-t border-[color:var(--rad-bd)] pt-4">
          {photoOpen ? (
            <>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>ما الصور التي تحتاجها من التاجر؟</span>
                <textarea
                  rows={3}
                  value={photoNote}
                  onChange={(e) => setPhotoNote(e.target.value)}
                  placeholder="مثال: صورة للختم من الداخل، وصورتان للجسم من الجانبين"
                  className="w-full rounded-[10px] border border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface)] px-3 py-2.5 text-sm font-medium"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {btn("إرسال طلب الصور للتاجر", () => {
                  const fd = new FormData();
                  fd.set("id", requestId);
                  fd.set("note", photoNote);
                  start(async () => {
                    setError(null);
                    const res = await adminRequestBrokeragePhotosAction(fd);
                    if (res.ok) {
                      setPhotoNote("");
                      setPhotoOpen(false);
                    }
                    report(res, "طُلبت الصور من التاجر");
                  });
                })}
                {btn("إلغاء", () => setPhotoOpen(false), "gh")}
              </div>
            </>
          ) : (
            btn("📷 اطلب صوراً من التاجر", () => setPhotoOpen(true), "gh")
          )}
        </div>
      ) : null}

      {cancelBtn ? <div className="flex flex-wrap gap-2">{cancelBtn}</div> : null}

      {error ? (
        <p role="alert" className={formErrorClass}>
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm;
          if (!c) return;
          setConfirm(null);
          if (c.to === "__PAY__") {
            const fd = new FormData();
            fd.set("id", requestId);
            run(() => adminConfirmBrokeragePaymentAction(null, fd), "تم تأكيد استلام الدفعة");
          } else if (c.to === "NEEDS_INFO") {
            move("NEEDS_INFO", "طُلبت معلومات إضافية", { messageAr: reason });
          } else if (c.to === "DECLINED") {
            move("DECLINED", "رُفض الطلب", { declineReason: reason, messageAr: reason });
          } else {
            move(c.to, "تم");
          }
          setReason("");
        }}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        confirmLabel={confirm?.label ?? "تأكيد"}
        cancelLabel="رجوع"
        pending={pending}
        destructive={confirm?.destructive ?? false}
      >
        {confirm?.needsReason ? (
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-3 w-full rounded-[10px] border border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface)] px-3 py-2.5 text-sm"
            placeholder="السبب / التفاصيل"
          />
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

function InspectionEditor({
  requestId,
  initial,
  onSaved,
  pending,
  start,
  setError,
  saved,
}: {
  requestId: string;
  initial: { grade: string; notesAr: string; verdictAr: string; checklist: string } | null;
  locked: boolean;
  onSaved: (res: Res) => void;
  pending: boolean;
  start: (fn: () => Promise<void>) => void;
  setError: (v: string | null) => void;
  saved: boolean;
}) {
  const [rows, setRows] = useState<InspectionRow[]>(parseChecklist(initial?.checklist) ?? emptyChecklist());
  const [grade, setGrade] = useState(initial?.grade ?? "B");
  const [verdict, setVerdict] = useState(initial?.verdictAr ?? "");
  const [notes, setNotes] = useState(initial?.notesAr ?? "");
  const [resetKey, setResetKey] = useState(0);
  const [open, setOpen] = useState(!saved);

  function setRow(i: number, patch: Partial<InspectionRow>) {
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          تقرير المعاينة محفوظ — الدرجة <b>{grade}</b>.
        </p>
        <button type="button" className="rad-btn rad-gh rad-sm" onClick={() => setOpen(true)}>
          تعديل التقرير
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        fd.set("requestId", requestId);
        fd.set("grade", grade);
        fd.set("verdictAr", verdict);
        fd.set("notesAr", notes);
        fd.set("checklist", JSON.stringify(rows));
        start(async () => {
          setError(null);
          const res = await adminSaveInspectionAction(null, fd);
          if (res.ok) setResetKey((k) => k + 1);
          onSaved(res);
        });
      }}
    >
      <p className="text-sm">
        <b>تقرير المعاينة.</b> قيّم كل بند، ثم اكتب الحكم النهائي. يظهر للتاجر كجدول متحرك مع الصور.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--rad-bd)]">
        <table className="w-full min-w-[460px] border-collapse text-sm">
          <thead>
            <tr className="bg-[color:var(--rad-surface3)] text-[11.5px] font-semibold text-[color:var(--rad-tx3)]">
              <th className="px-3 py-2 text-start">البند</th>
              <th className="px-3 py-2 text-start">النتيجة</th>
              <th className="px-3 py-2 text-start">ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className="border-t border-[color:var(--rad-bd)] align-top">
                <td className="px-3 py-2 font-semibold">{r.label}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(INSPECTION_RESULT_META) as InspectionResult[]).map((k) => {
                      const meta = INSPECTION_RESULT_META[k];
                      const on = r.result === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setRow(i, { result: k })}
                          className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold transition-opacity", !on && "opacity-45")}
                          style={{ background: meta.bg, color: meta.color, outline: on ? `2px solid ${meta.color}` : "none" }}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.note}
                    onChange={(e) => setRow(i, { note: e.target.value })}
                    maxLength={200}
                    className="w-full rounded-lg border border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface)] px-2 py-1.5 text-[13px]"
                    placeholder="اختياري"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold">الدرجة النهائية</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GRADE_META).map(([g, meta]) => (
            <button
              key={g}
              type="button"
              aria-pressed={grade === g}
              onClick={() => setGrade(g)}
              className="rounded-xl px-4 py-2 text-sm font-extrabold transition-opacity"
              style={{
                background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
                color: meta.color,
                outline: grade === g ? `2px solid ${meta.color}` : "none",
                opacity: grade === g ? 1 : 0.5,
              }}
            >
              {g} · {meta.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block space-y-1.5 text-sm font-semibold">
        <span>الحكم النهائي (يظهر للتاجر)</span>
        <input
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          maxLength={200}
          required
          className="w-full rounded-[10px] border border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface)] px-3 py-2.5 text-sm font-medium"
        />
      </label>
      <label className="block space-y-1.5 text-sm font-semibold">
        <span>ملاحظات عامة</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-[10px] border border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface)] px-3 py-2.5 text-sm font-medium"
        />
      </label>
      <div>
        <p className="mb-1.5 text-sm font-semibold">صور المعاينة</p>
        <PhotoUploader resetKey={resetKey} />
      </div>
      <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending || !verdict.trim()}>
        حفظ تقرير المعاينة
      </button>
    </form>
  );
}
