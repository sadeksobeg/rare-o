"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, OctagonX, QrCode, Unlink, X } from "lucide-react";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import {
  adminSetOutboundGlobalRateAction,
  adminSetOutboundKillSwitchAction,
} from "@/app/whatsapp-actions";
import { ConfirmDialog } from "@/components/ui/dialog";
import { KillSwitchBannerText } from "@/components/admin/rad/inbox/kill-switch-banner-text";
import { cn } from "@/lib/utils";

function pillState(health: InboxHealthView): "connected" | "outbound-off" | "disconnected" | "reconnecting" {
  if (health.outboundKillSwitch) return "outbound-off";
  if (health.state === "CONNECTED") {
    return health.outboundEnabled ? "connected" : "outbound-off";
  }
  if (health.state === "RECONNECTING" || health.state === "CONNECTING") return "reconnecting";
  return "disconnected";
}

/**
 * Connection pill (opens the sheet) + the sheet itself. Pairing/reconnect/logout
 * buttons stay inert (no real linkCommand without separate owner approval).
 * Emergency outbound kill is live — DB flag, confirm dialog, reversible.
 */
export function RadConnectionSheet({
  health,
  ib,
  locale = "ar",
}: {
  health: InboxHealthView;
  ib: Dictionary["ib"];
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmKill, setConfirmKill] = useState(false);
  const [confirmResume, setConfirmResume] = useState(false);
  const [reason, setReason] = useState("");
  const [rateDraft, setRateDraft] = useState(String(health.outboundGlobalRatePerMin || 20));
  const router = useRouter();
  const triggerRef = useRef<Element | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const state = pillState(health);

  useEffect(() => {
    setRateDraft(String(health.outboundGlobalRatePerMin || 20));
  }, [health.outboundGlobalRatePerMin]);

  function applyKillSwitch(enabled: boolean) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("enabled", enabled ? "true" : "false");
      if (enabled && reason.trim()) fd.set("reason", reason.trim());
      const result = await adminSetOutboundKillSwitchAction(fd);
      if (!result.ok) {
        toast.error(ib.killSwitchError);
        return;
      }
      toast.success(enabled ? ib.killEngageDone : ib.killResumeDone);
      setConfirmKill(false);
      setConfirmResume(false);
      setReason("");
      router.refresh();
    });
  }

  function saveRate() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("perMin", rateDraft);
      const result = await adminSetOutboundGlobalRateAction(fd);
      if (!result.ok) {
        toast.error(ib.rateLimitSaveError);
        return;
      }
      toast.success(ib.rateLimitSaved);
      router.refresh();
    });
  }

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      const id = window.setTimeout(() => closeRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
    if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    triggerRef.current = null;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const label =
    health.outboundKillSwitch
      ? ib.killActivePill
      : state === "connected"
        ? ib.connConnected
        : state === "outbound-off"
          ? ib.connOutboundOff
          : state === "reconnecting"
            ? ib.connReconnecting
            : ib.connDisconnected;

  const heartbeatAgeS = health.lastHeartbeatAt
    ? Math.max(0, Math.round((Date.now() - new Date(health.lastHeartbeatAt).getTime()) / 1000))
    : null;

  return (
    <>
      <button
        type="button"
        className={cn("rad-conn", `s-${state}`)}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="rad-cd" aria-hidden />
        <span>{label}</span>
        <ChevronDown width={14} height={14} strokeWidth={1.5} aria-hidden />
      </button>

      <div className={cn("rad-sheet", open && "rad-on")} role="dialog" aria-modal="true" aria-labelledby="rad-sh-t">
        <div className="rad-scr" onClick={() => setOpen(false)} />
        <div className="rad-pn">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 id="rad-sh-t">{ib.connSheetTitle}</h2>
            <button ref={closeRef} type="button" className="rad-ib" aria-label={ib.connSheetClose} onClick={() => setOpen(false)}>
              <X width={18} height={18} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <div className={cn("rad-conn", `s-${state}`)} style={{ alignSelf: "flex-start", cursor: "default" }}>
            <span className="rad-cd" aria-hidden />
            {label}
          </div>
          <p>
            {health.outboundKillSwitch
              ? ib.killSheetBody
              : state === "connected"
                ? ib.connSheetConnectedBody
                : state === "outbound-off"
                  ? ib.connSheetOutboundOffBody
                  : state === "reconnecting"
                    ? ib.connSheetReconnectingBody
                    : ib.connSheetDisconnectedBody}
          </p>

          {health.outboundKillSwitch ? (
            <div className="rad-bn rad-err" role="alert" style={{ marginBlock: 8 }}>
              <OctagonX width={18} height={18} strokeWidth={1.5} aria-hidden />
              <KillSwitchBannerText
                ib={ib}
                locale={locale}
                by={health.outboundKillSwitchBy}
                at={health.outboundKillSwitchAt}
                reason={health.outboundKillSwitchReason}
              />
            </div>
          ) : null}

          {state === "connected" || state === "outbound-off" || state === "reconnecting" ? (
            <>
              <div className="rad-stl">
                <div>
                  <i>١</i>
                  {heartbeatAgeS === null
                    ? "—"
                    : ib.connSheetHeartbeatLabel.replace("{s}", String(heartbeatAgeS))}
                </div>
                <div>
                  <i>٢</i>
                  {ib.connSheetLinkedNumberLabel}
                </div>
              </div>
              <button type="button" className="rad-btn rad-gh" disabled title={ib.connSheetNoSendNotice}>
                <Unlink width={16} height={16} strokeWidth={1.5} aria-hidden />
                {ib.connSheetDisconnectButton}
              </button>

              {health.outboundKillSwitch ? (
                <button
                  type="button"
                  className="rad-btn rad-pri"
                  disabled={pending}
                  onClick={() => setConfirmResume(true)}
                >
                  <OctagonX width={16} height={16} strokeWidth={1.5} aria-hidden />
                  {ib.killResumeLabel}
                </button>
              ) : (
                <button
                  type="button"
                  className="rad-btn rad-dng"
                  disabled={pending}
                  onClick={() => setConfirmKill(true)}
                >
                  <OctagonX width={16} height={16} strokeWidth={1.5} aria-hidden />
                  {ib.killEngageLabel}
                </button>
              )}

              <div className="rad-fld" style={{ marginBlockStart: 12 }}>
                <label htmlFor="wa-global-rate">{ib.rateLimitLabel}</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    id="wa-global-rate"
                    type="number"
                    min={1}
                    max={120}
                    value={rateDraft}
                    onChange={(e) => setRateDraft(e.target.value)}
                    disabled={pending}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    className="rad-btn rad-gh"
                    disabled={pending}
                    onClick={saveRate}
                  >
                    {ib.rateLimitSave}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rad-stl">
                <div>
                  <i>١</i>
                  {ib.connSheetStep1}
                </div>
                <div>
                  <i>٢</i>
                  {ib.connSheetStep2}
                </div>
                <div>
                  <i>٣</i>
                  {ib.connSheetStep3}
                </div>
              </div>
              <div className="rad-fld">
                <label>{ib.connSheetPhoneLabel}</label>
                <input type="text" placeholder="+963 …" inputMode="tel" disabled />
              </div>
              <button type="button" className="rad-btn rad-pri" disabled title={ib.connSheetNoSendNotice}>
                <QrCode width={16} height={16} strokeWidth={1.5} aria-hidden />
                {ib.connSheetShowQrButton}
              </button>
            </>
          )}
          <p style={{ fontSize: 12.5, color: "var(--rad-tx3)" }}>{ib.connSheetNoSendNotice}</p>
        </div>
      </div>

      {confirmKill ? (
        <div
          className="rad-sheet rad-on"
          style={{ zIndex: 80 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rad-kill-t"
        >
          <div
            className="rad-scr"
            onClick={() => {
              setConfirmKill(false);
              setReason("");
            }}
          />
          <div className="rad-pn" style={{ maxWidth: 420 }}>
            <h2 id="rad-kill-t">{ib.killConfirmTitle}</h2>
            <p>{ib.killConfirmBody}</p>
            <div className="rad-fld">
              <label htmlFor="wa-kill-reason">{ib.killReasonLabel}</label>
              <textarea
                id="wa-kill-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={240}
                placeholder={ib.killReasonPlaceholder}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="rad-btn rad-gh"
                disabled={pending}
                onClick={() => {
                  setConfirmKill(false);
                  setReason("");
                }}
              >
                {ib.killCancel}
              </button>
              <button
                type="button"
                className="rad-btn rad-dng"
                disabled={pending}
                onClick={() => applyKillSwitch(true)}
              >
                {pending ? "…" : ib.killConfirmAction}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmResume}
        onClose={() => setConfirmResume(false)}
        onConfirm={() => applyKillSwitch(false)}
        title={ib.killResumeConfirmTitle}
        body={ib.killResumeConfirmBody}
        confirmLabel={ib.killResumeLabel}
        cancelLabel={ib.killCancel}
        pending={pending}
        destructive={false}
      />
    </>
  );
}
