"use client";

import {
  adminRequestWhatsAppPairingAction,
  adminWhatsAppLogoutAction,
  adminWhatsAppReconnectAction,
} from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
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
  // CONNECTING | RECONNECTING | DISCONNECTED
  return "reconnect";
}

/**
 * WhatsApp account linking panel (admin /admin/inbox).
 * Dict-only labels; never renders detailSafe / worker / env strings.
 * Pairing code is primary; QR is optional.
 */
export function WhatsAppLinkAccount({
  health,
  dict,
}: {
  health: InboxHealthView;
  dict: Dictionary;
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
      className="space-y-3 border border-ro-line p-4 text-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg">{i.pairingTitle}</h2>
        <p
          role="status"
          data-link-state={uiState}
          className={
            uiState === "error" ? "text-ro-purple" : "text-ro-muted"
          }
        >
          {stateLabel}
        </p>
      </div>

      {showForm ? (
        <>
          <p className="text-ro-muted">{i.pairingHint}</p>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => adminRequestWhatsAppPairingAction(phone, wantQr));
            }}
          >
            <label className="min-w-[14rem] flex-1 space-y-1">
              <span className="block text-ro-muted">{i.pairingPhone}</span>
              <input
                name="pairingPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                placeholder="963900000000"
                className="w-full border border-ro-line bg-transparent px-3 py-2 font-mono text-xs"
                disabled={pending}
              />
            </label>
            <label className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={wantQr}
                onChange={(e) => setWantQr(e.target.checked)}
                disabled={pending}
              />
              <span>{i.pairingQrOptional}</span>
            </label>
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-ro-purple px-4 py-2 text-ro-ivory disabled:opacity-60"
            >
              {i.pairingSubmit}
            </button>
          </form>
        </>
      ) : null}

      {health.pairingCode ? (
        <div className="space-y-1">
          <span className="block text-ro-muted">{i.pairingCodeLabel}</span>
          <p
            data-pairing-code
            dir="ltr"
            className="select-all font-mono text-3xl tracking-[0.3em]"
          >
            {health.pairingCode}
          </p>
        </div>
      ) : null}

      {health.qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
        <img
          data-pairing-qr
          src={health.qrDataUrl}
          alt={i.pairingQrOptional}
          width={200}
          height={200}
          className="border border-ro-line bg-white p-2"
        />
      ) : null}

      {uiState === "connected" ||
      uiState === "reconnect" ||
      uiState === "error" ? (
        <div className="flex flex-wrap gap-2">
          {uiState !== "connected" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(adminWhatsAppReconnectAction)}
              className="border border-ro-line px-4 py-2 disabled:opacity-60"
            >
              {i.reconnect}
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => run(adminWhatsAppLogoutAction)}
            className="border border-ro-line px-4 py-2 disabled:opacity-60"
          >
            {i.pairingLogout}
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-ro-purple">
          {error}
        </p>
      ) : null}
    </section>
  );
}
