"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  ChevronDown,
  CircleDot,
  MessageSquare,
} from "lucide-react";
import {
  adminMarkRetailHandoffOpenedAction,
  adminRetriggerRetailHandoffAction,
  adminTransitionRetailRequestAction,
} from "@/app/actions";
import { Modal, Textarea } from "@/components/ui-kit";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { RetailRequestStatus } from "@/lib/retail-request/constants";
import { cn } from "@/lib/utils";

/**
 * Detail-pattern status Menu + note Modal, wired to existing
 * `adminTransitionRetailRequestAction` (+ handoff helpers).
 */
export function RequestStatusMenu({
  requestId,
  nextStatuses,
  whatsAppDeepLink,
  canRetrigger,
  conversationHref,
  labels,
  openConversationLabel,
  changeStatusLabel,
  confirmLabel,
  cancelLabel,
  modalLead,
  canNotify = false,
  customerOptedIn = false,
}: {
  requestId: string;
  nextStatuses: RetailRequestStatus[];
  whatsAppDeepLink: string | null;
  canRetrigger: boolean;
  conversationHref?: string | null;
  labels: Dictionary["adminUi"];
  openConversationLabel: string;
  changeStatusLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  modalLead: string;
  /** A customer chat exists, so a WhatsApp update can be sent from here. */
  canNotify?: boolean;
  /** Customer ticked «WhatsApp updates» on the storefront → default on. */
  customerOptedIn?: boolean;
}) {
  const f = labels.form;
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<RetailRequestStatus | null>(null);
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(customerOptedIn);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(whatsAppDeepLink);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const applyTransition = () => {
    if (!pendingStatus) return;
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("toStatus", pendingStatus);
    if (note.trim()) fd.set("note", note.trim());
    const notifiable = ["in_follow_up", "completed", "cancelled"].includes(pendingStatus);
    if (notify && canNotify && notifiable) fd.set("notifyCustomer", "1");
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const res = await adminTransitionRetailRequestAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPendingStatus(null);
      setNote("");
      const outcome = (res as { data?: { notified?: string } }).data?.notified;
      setMessage(
        outcome === "sent"
          ? `${f.statusUpdated} — أُرسل التحديث للعميل عبر واتساب`
          : outcome && outcome !== "skipped"
            ? `${f.statusUpdated} — لم يُرسل التحديث (${outcome === "WHATSAPP_DOWN" ? "واتساب غير متصل" : outcome === "NO_CONVERSATION" ? "لا محادثة للعميل" : "تعذّر الإرسال"})`
            : f.statusUpdated
      );
      router.refresh();
    });
  };

  return (
    <>
      <div className="rad-pact" style={{ position: "relative" }} ref={menuRef}>
        {conversationHref ? (
          <a href={conversationHref} className="rad-btn rad-gh">
            <MessageSquare width={16} height={16} strokeWidth={1.5} aria-hidden />
            {openConversationLabel}
          </a>
        ) : null}

        {nextStatuses.length > 0 ? (
          <>
            <button
              type="button"
              className="rad-btn rad-pri"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <CircleDot width={16} height={16} strokeWidth={1.5} aria-hidden />
              {changeStatusLabel}
              <ChevronDown width={14} height={14} strokeWidth={1.5} aria-hidden />
            </button>
            <div
              className={cn("rad-menu", menuOpen && "rad-on")}
              role="menu"
              style={{ top: 46, insetInlineStart: 0 }}
            >
              {nextStatuses.map((s) => {
                const danger = s === "cancelled";
                const Icon = danger ? Ban : s === "completed" ? Check : CircleDot;
                return (
                  <button
                    key={s}
                    type="button"
                    role="menuitem"
                    className={danger ? "rad-dng" : undefined}
                    onClick={() => {
                      setMenuOpen(false);
                      setPendingStatus(s);
                      setNote("");
                      setError(null);
                    }}
                  >
                    <Icon width={16} height={16} strokeWidth={1.5} aria-hidden />
                    {labels.status.retail[s] ?? s}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        <details className="rad-adv" style={{ flexBasis: "100%" }}>
          <summary
            className="rad-btn rad-gh rad-sm"
            style={{ display: "inline-flex", cursor: "pointer", listStyle: "none" }}
          >
            خيارات متقدمة
          </summary>
          <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--rad-tx3)", margin: "10px 0" }}>
            رابط «فتح واتساب» الذي يراه العميل بعد تقديم الطلب يُبنى مرة واحدة عند الإنشاء. إن غيّرتَ رقم واتساب الأعمال أو عدّلتَ بيانات الطلب
            فاضغط «إعادة بناء رابط العميل» ليتجدّد الرابط والنص المخزّنان. لا يُرسل شيئاً لأحد.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {canRetrigger ? (
          <button
            type="button"
            className="rad-btn rad-gh rad-sm"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("requestId", requestId);
              startTransition(async () => {
                setError(null);
                const res = await adminRetriggerRetailHandoffAction(fd);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                const data = res.data as
                  | { whatsAppDeepLink?: string | null }
                  | undefined;
                if (data?.whatsAppDeepLink) setLink(data.whatsAppDeepLink);
                setMessage(f.handoffRegenerated);
                router.refresh();
              });
            }}
          >
            إعادة بناء رابط العميل
          </button>
        ) : null}

        {link ? (
          <button
            type="button"
            className="rad-btn rad-gh rad-sm"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("requestId", requestId);
              startTransition(async () => {
                setError(null);
                const res = await adminMarkRetailHandoffOpenedAction(fd);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                const data = res.data as
                  | { whatsAppDeepLink?: string | null }
                  | undefined;
                const openLink = data?.whatsAppDeepLink || link;
                setMessage(f.handoffMarkedOpened);
                router.refresh();
                if (openLink) {
                  window.open(openLink, "_blank", "noopener,noreferrer");
                }
              });
            }}
          >
            اختبار الرابط (يفتح واتساب)
          </button>
        ) : null}
          </div>
        </details>
      </div>

      {message ? (
        <p role="status" className="text-sm" style={{ color: "var(--rad-tx3)" }}>
          {message}
        </p>
      ) : null}
      {error && !pendingStatus ? (
        <p role="alert" className="text-sm" style={{ color: "var(--rad-err)" }}>
          {error}
        </p>
      ) : null}

      <Modal
        open={pendingStatus != null}
        onClose={() => {
          if (!pending) {
            setPendingStatus(null);
            setError(null);
          }
        }}
        title={
          pendingStatus
            ? `${changeStatusLabel}: ${labels.status.retail[pendingStatus] ?? pendingStatus}`
            : changeStatusLabel
        }
        actions={
          <>
            <button
              type="button"
              className="rad-btn rad-gh"
              disabled={pending}
              onClick={() => setPendingStatus(null)}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="rad-btn rad-pri"
              disabled={pending}
              onClick={applyTransition}
            >
              {confirmLabel}
            </button>
          </>
        }
      >
        <p>{modalLead}</p>
        <div className="rad-fx" style={{ marginTop: 16 }}>
          <label className="rad-lb" htmlFor={`note-${requestId}`}>
            {f.noteOptional}
          </label>
          <Textarea
            id={`note-${requestId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{ minHeight: 80 }}
          />
        </div>
        {pendingStatus &&
        ["in_follow_up", "completed", "cancelled"].includes(pendingStatus) ? (
          <label
            className="rad-fx"
            style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", opacity: canNotify ? 1 : 0.55 }}
          >
            <input
              type="checkbox"
              checked={notify && canNotify}
              disabled={!canNotify}
              onChange={(e) => setNotify(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span>
              إرسال تحديث للعميل عبر واتساب (مع رابط طلبه)
              {!canNotify ? " — لا توجد محادثة مرتبطة بالعميل" : customerOptedIn ? " — العميل وافق على التحديثات" : ""}
            </span>
          </label>
        ) : null}
        {error ? (
          <p role="alert" style={{ color: "var(--rad-err)", marginTop: 10 }}>
            {error}
          </p>
        ) : null}
      </Modal>
    </>
  );
}

export function DetailActionButtons({ children }: { children: ReactNode }) {
  return <div className="rad-pact">{children}</div>;
}
