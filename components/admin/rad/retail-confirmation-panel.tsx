"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminLogRetailConfirmationOpenedAction,
  adminPrepareRetailConfirmationAction,
  adminSendRetailConfirmationAction,
  adminUpdateRetailCustomerDataAction,
  type ConfirmationPrep,
} from "@/app/retail-confirm-actions";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";

const MISSING_AR: Record<string, string> = {
  name: "الاسم الثلاثي",
  phone: "رقم الهاتف",
  destination: "الوجهة",
};

const ERR_AR: Record<string, string> = {
  NO_CONVERSATION: "لا توجد محادثة واتساب مع هذا العميل — استعمل «فتح في واتساب»",
  WHATSAPP_DOWN: "واتساب غير متصل حالياً — استعمل «فتح في واتساب» أو أعد الاتصال",
  BLOCKED: "محادثة العميل محظورة",
  RATE_LIMITED: "تجاوزتَ حد الإرسال — انتظر قليلاً",
  REQUEST_CLOSED: "الطلب مُغلق",
  FAILED: "تعذّر الإرسال",
};

type Props = {
  requestId: string;
  closed: boolean;
  customer: { name: string; phone: string; destination: string; notes: string };
  response: "confirmed" | "changes_requested" | null;
  responseNote: string;
  respondedAtLabel: string | null;
};

/**
 * «تأكيد البيانات مع العميل» — the ready message (variables filled), sent
 * from the inbox or opened in WhatsApp; the customer answers on the order
 * page; the admin edits the request when changes are asked for.
 */
export function RetailConfirmationPanel({
  requestId,
  closed,
  customer,
  response,
  responseNote,
  respondedAtLabel,
}: Props) {
  const router = useRouter();
  const [prep, setPrep] = useState<ConfirmationPrep | null>(null);
  const [text, setText] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState(customer);
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await adminPrepareRetailConfirmationAction(requestId);
      if (cancelled) return;
      if (res.ok && res.data) {
        setPrep(res.data);
        setText(res.data.message);
      } else setLoadError(true);
    })();
    return () => {
      cancelled = true;
    };
    // re-prepare when the underlying data changes (after an edit → router.refresh → new props)
  }, [requestId, customer.name, customer.phone, customer.destination, customer.notes]);

  function sendFromInbox() {
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("text", text);
    start(async () => {
      const res = await adminSendRetailConfirmationAction(fd);
      if (!res.ok) {
        toast.error(ERR_AR[res.error] ?? "تعذّر الإرسال");
        return;
      }
      toast.success("أُرسلت رسالة التأكيد للعميل");
      router.refresh();
    });
  }

  function openInWhatsApp() {
    if (!prep) return;
    const url = `https://wa.me/${prep.customerWaLink.split("/")[3]?.split("?")[0]}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    void adminLogRetailConfirmationOpenedAction(requestId).then(() => router.refresh());
  }

  function saveEdit() {
    setEditError(null);
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("customerName", edit.name);
    fd.set("customerPhone", edit.phone);
    fd.set("destinationCountry", edit.destination);
    fd.set("customerNotes", edit.notes);
    start(async () => {
      const res = await adminUpdateRetailCustomerDataAction(fd);
      if (!res.ok) {
        setEditError(ERR_AR[res.error] ?? res.error);
        return;
      }
      setEditOpen(false);
      toast.success("حُدّثت بيانات الطلب — أعد إرسال التأكيد للعميل");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {response ? (
        <div
          role="status"
          className="rounded-lg border border-[color:var(--rad-bd)] p-3 text-sm"
          style={{
            background:
              response === "confirmed"
                ? "color-mix(in srgb, var(--rad-ok, #2e9d6a) 12%, transparent)"
                : "color-mix(in srgb, var(--rad-warn, #e0a030) 14%, transparent)",
          }}
        >
          <b>
            {response === "confirmed"
              ? "✓ العميل أكّد صحة البيانات"
              : "العميل طلب تعديلاً"}
          </b>
          {responseNote ? <p className="mt-1">«{responseNote}»</p> : null}
          {respondedAtLabel ? <p className="mt-1 text-xs opacity-70">{respondedAtLabel}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-[color:var(--rad-tx-2)]">
          لم يردّ العميل بعد على رسالة التأكيد.
        </p>
      )}

      {prep && prep.missing.length > 0 ? (
        <p role="alert" className="text-sm" style={{ color: "var(--rad-warn, #e0a030)" }}>
          ⚠️ ينقص أو يحتاج تصحيحاً: {prep.missing.map((m) => MISSING_AR[m] ?? m).join("، ")} — عدّل البيانات ثم أرسل التأكيد.
        </p>
      ) : null}

      {loadError ? (
        <p role="alert" className="text-sm">تعذّر تجهيز الرسالة.</p>
      ) : !prep ? (
        <p className="text-sm text-[color:var(--rad-tx-2)]">جارٍ تجهيز الرسالة…</p>
      ) : (
        <>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">الرسالة الجاهزة (يمكنك تعديلها قبل الإرسال)</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={11}
              dir="auto"
              className="w-full rounded-lg border border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] p-3 text-sm leading-relaxed"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rad-btn rad-pri rad-sm"
              disabled={pending || closed || !prep.canSendFromInbox}
              title={prep.canSendFromInbox ? undefined : ERR_AR[prep.inboxBlockedReason ?? "NO_CONVERSATION"]}
              onClick={sendFromInbox}
            >
              إرسال من صندوق واتساب
            </button>
            <button type="button" className="rad-btn rad-gh rad-sm" disabled={closed} onClick={openInWhatsApp}>
              فتح في واتساب
            </button>
            <button
              type="button"
              className="rad-btn rad-gh rad-sm"
              onClick={() => {
                void navigator.clipboard?.writeText(text);
                toast.success("نُسخ النص");
              }}
            >
              نسخ
            </button>
            <button
              type="button"
              className="rad-btn rad-gh rad-sm"
              disabled={closed}
              onClick={() => {
                setEdit(customer);
                setEditError(null);
                setEditOpen(true);
              }}
            >
              تعديل بيانات العميل
            </button>
          </div>
          {!prep.canSendFromInbox ? (
            <p className="text-xs text-[color:var(--rad-tx-2)]">
              {ERR_AR[prep.inboxBlockedReason ?? "NO_CONVERSATION"]}
            </p>
          ) : null}
          <p className="text-xs text-[color:var(--rad-tx-2)]">
            رابط صفحة الطلب للعميل: <bdi dir="ltr">{prep.orderUrl}</bdi>
          </p>
        </>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="تعديل بيانات العميل" size="md">
        <div className="space-y-3">
          <TextField
            name="customerName"
            label="الاسم الثلاثي"
            value={edit.name}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            dense
            maxLength={120}
          />
          <TextField
            name="customerPhone"
            label="الهاتف مع رمز الدولة"
            value={edit.phone}
            onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
            dense
            dir="ltr"
            maxLength={40}
          />
          <TextField
            name="destinationCountry"
            label="الوجهة"
            value={edit.destination}
            onChange={(e) => setEdit({ ...edit, destination: e.target.value })}
            dense
            maxLength={80}
          />
          <TextField
            name="customerNotes"
            label="ملاحظات العميل"
            value={edit.notes}
            onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
            dense
            maxLength={2000}
          />
          {editError ? (
            <p role="alert" className="text-sm" style={{ color: "var(--rad-err)" }}>
              {editError}
            </p>
          ) : null}
          <div className="rad-link-dialog-actions">
            <button type="button" className="rad-btn rad-gh rad-sm" onClick={() => setEditOpen(false)}>
              إلغاء
            </button>
            <button type="button" className="rad-btn rad-pri rad-sm" disabled={pending} onClick={saveEdit}>
              حفظ
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
