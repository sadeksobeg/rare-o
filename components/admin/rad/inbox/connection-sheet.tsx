"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, OctagonX, QrCode, Unlink, X } from "lucide-react";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { adminSetOutboundKillSwitchAction } from "@/app/whatsapp-actions";
import { cn } from "@/lib/utils";

function pillState(health: InboxHealthView): "connected" | "outbound-off" | "disconnected" | "reconnecting" {
  if (health.state === "CONNECTED") {
    return health.outboundEnabled ? "connected" : "outbound-off";
  }
  if (health.state === "RECONNECTING" || health.state === "CONNECTING") return "reconnecting";
  return "disconnected";
}

/**
 * Connection pill (opens the sheet) + the sheet itself. Everything here is
 * READ-ONLY against real health data — no button in the sheet calls a
 * pairing/reconnect/logout action. Those exist in app/whatsapp-actions.ts
 * and work, but wiring them here would let a click from this screen queue a
 * real linkCommand the worker executes — exactly what the owner's brief and
 * CLAUDE.md explicitly prohibit without separate written approval. Buttons
 * are shown (so the layout and copy can be reviewed) but inert.
 */
export function RadConnectionSheet({ health, ib }: { health: InboxHealthView; ib: Dictionary["ib"] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const triggerRef = useRef<Element | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const state = pillState(health);

  function toggleKillSwitch(enabled: boolean) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("enabled", enabled ? "true" : "false");
      const result = await adminSetOutboundKillSwitchAction(fd);
      if (!result.ok) {
        toast.error(ib.connSheetNoSendNotice);
        return;
      }
      toast.success(
        enabled
          ? ib.connOutboundOff
          : ib.connConnected
      );
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
    state === "connected"
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
            {state === "connected"
              ? ib.connSheetConnectedBody
              : state === "outbound-off"
                ? ib.connSheetOutboundOffBody
                : state === "reconnecting"
                  ? ib.connSheetReconnectingBody
                  : ib.connSheetDisconnectedBody}
          </p>
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
              <button
                type="button"
                className="rad-btn rad-gh"
                disabled={pending}
                onClick={() => toggleKillSwitch(!health.outboundKillSwitch)}
              >
                <OctagonX width={16} height={16} strokeWidth={1.5} aria-hidden />
                {health.outboundKillSwitch ? ib.connConnected : ib.connOutboundOff}
              </button>
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
    </>
  );
}
