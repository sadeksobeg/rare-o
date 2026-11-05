"use client";

import {
  adminRequestWhatsAppPairingAction,
  adminWhatsAppLogoutAction,
  adminWhatsAppReconnectAction,
} from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/** Poll cadence while the worker is still working on a link command. */
const REFRESH_MS = 3_000;

type LinkUiState =
  | "not_linked"
  | "awaiting_code"
  | "connected"
  | "reconnect"
  | "error";

function deriveUiState(health: InboxHealthView): LinkUiState {
  if (health.state === "CONNECTED") return "connected";
  if (health.state === "ERROR") return "error";

  const hasDisplay = Boolean(health.pairingCode || health.qrDataUrl);
  const commandPending =
    health.linkCommand === "pair" || health.linkCommand === "qr";

  if (health.state === "AUTHENTICATION_REQUIRED") {
    return hasDisplay || commandPending ? "awaiting_code" : "not_linked";
  }
  if (health.state === "CONNECTING" && (hasDisplay || commandPending)) {
    return "awaiting_code";
  }
  return "reconnect";
}

/**
 * WhatsApp account linking panel.
 * Compact: dense card for inbox chrome. Hidden when fully connected (no codes).
 */
export function WhatsAppLinkAccount({
  health,
  dict,
  compact = false,
}: {
  health: InboxHealthView;
  dict: Dictionary;
  compact?: boolean;
}) {
  const i = dict.inbox;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [phone, setPhone] = useState(health.pairingPhone ?? "");
  const [wantQr, setWantQr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uiState = deriveUiState(health);
  const busy =
    health.linkCommand !== "none" ||
    uiState === "awaiting_code" ||
    uiState === "reconnect";

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(t);
  }, [busy, router]);

  // Fully connected with nothing to show — chrome owns status/logout.
  if (
    compact &&
    uiState === "connected" &&
    !health.pairingCode &&
    !health.qrDataUrl
  ) {
    return null;
  }

  function mapError(code: string): string {
    if (code === "UNAUTHORIZED") return i.linkErrorUnauthorized;
    return i.pairingError;
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const res = await action();
      if (!res.ok) {
        setError(mapError(res.error ?? ""));
        return;
      }
      router.refresh();
    });
  }

  const stateLabel =
    uiState === "connected"
      ? i.pairingConnected
      : uiState === "awaiting_code"
        ? i.pairingAwaiting
        : uiState === "reconnect"
          ? i.healthReconnecting
          : uiState === "error"
            ? i.pairingError
            : i.pairingNotLinked;

  const showForm = uiState !== "connected";
  const canSubmit = !pending && phone.replace(/\D/g, "").length >= 8;

  return (
    <section
      id="whatsapp-link-account"
      data-whatsapp-link-account={uiState}
      className={cn(
        "rounded-[14px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel,var(--ro-bg-elevated))] text-sm shadow-[var(--ro-e2)]",
        compact ? "space-y-2.5 p-3" : "space-y-3 p-4"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          className={cn(
            "font-semibold text-[color:var(--ro-text)]",
            compact ? "text-sm" : "text-lg"
          )}
        >
          {i.pairingTitle}
        </h2>
        <p
          role="status"
          data-link-state={uiState}
          className={cn(
            "text-xs font-medium",
            uiState === "error"
              ? "text-[color:var(--ro-danger-700)]"
              : "text-[color:var(--ro-text-muted)]"
          )}
        >
          {stateLabel}
        </p>
      </div>

      {showForm ? (
        <>
          {!compact ? (
            <p className="text-[color:var(--ro-text-muted)]">{i.pairingHint}</p>
          ) : (
            <p className="text-[11px] leading-snug text-[color:var(--ro-text-muted)]">
              {i.pairingHint}
            </p>
          )}
          <form
            className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => adminRequestWhatsAppPairingAction(phone, wantQr));
            }}
          >
            <label className="min-w-[12rem] flex-1 space-y-1">
              <span className="block text-[11px] font-medium text-[color:var(--ro-text-muted)]">
                {i.pairingPhone}
              </span>
              <input
                name="pairingPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                placeholder="963900000000"
                className="w-full rounded-[10px] border border-[color:var(--ro-border)] bg-[color:var(--ro-bg-sunken)] px-3 py-2 font-mono text-xs text-[color:var(--ro-text)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
                disabled={pending}
              />
            </label>
            <label className="flex min-h-9 items-center gap-2 pb-0.5 text-xs text-[color:var(--ro-text-2)]">
              <input
                type="checkbox"
                checked={wantQr}
                onChange={(e) => setWantQr(e.target.checked)}
                disabled={pending}
                className="size-4 accent-[var(--ro-plum-700)]"
              />
              <span>{i.pairingQrOptional}</span>
            </label>
            <button
              type="submit"
              disabled={!canSubmit}
              className="min-h-9 rounded-[10px] bg-[color:var(--ro-plum-700)] px-4 text-xs font-semibold text-[var(--ro-sand-50)] disabled:opacity-60"
            >
              {i.pairingSubmit}
            </button>
          </form>
        </>
      ) : null}

      {health.pairingCode ? (
        <div className="space-y-1">
          <span className="block text-[11px] text-[color:var(--ro-text-muted)]">
            {i.pairingCodeLabel}
          </span>
          <p
            data-pairing-code
            dir="ltr"
            className="select-all font-mono text-2xl tracking-[0.28em] text-[color:var(--ro-text)] sm:text-3xl"
          >
            {health.pairingCode}
          </p>
        </div>
      ) : null}

      {health.qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL
        <img
          data-pairing-qr
          src={health.qrDataUrl}
          alt={i.pairingQrOptional}
          width={160}
          height={160}
          className="rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-white p-2"
        />
      ) : null}

      {!compact &&
      (uiState === "connected" ||
        uiState === "reconnect" ||
        uiState === "error") ? (
        <div className="flex flex-wrap gap-2">
          {uiState !== "connected" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(adminWhatsAppReconnectAction)}
              className="min-h-9 rounded-[10px] border border-[color:var(--ro-border)] px-4 text-xs font-semibold disabled:opacity-60"
            >
              {i.reconnect}
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => run(adminWhatsAppLogoutAction)}
            className="min-h-9 rounded-[10px] border border-[color:var(--ro-border)] px-4 text-xs font-semibold disabled:opacity-60"
          >
            {i.pairingLogout}
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-[color:var(--ro-danger-700)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
