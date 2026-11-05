"use client";

import {
  adminWhatsAppLogoutAction,
  adminWhatsAppReconnectAction,
} from "@/app/whatsapp-actions";
import { WhatsAppLinkAccount } from "@/components/admin/whatsapp-link-account";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  LogOut,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

function healthMeta(
  dict: Dictionary,
  state: string
): { label: string; tone: "ok" | "warn" | "danger" | "progress" } {
  const i = dict.inbox;
  switch (state) {
    case "CONNECTED":
      return { label: i.healthConnected, tone: "ok" };
    case "CONNECTING":
      return { label: i.healthConnecting, tone: "progress" };
    case "RECONNECTING":
      return { label: i.healthReconnecting, tone: "progress" };
    case "AUTHENTICATION_REQUIRED":
      return { label: i.healthAuthRequired, tone: "warn" };
    case "ERROR":
      return { label: i.healthError, tone: "danger" };
    default:
      return { label: i.healthDisconnected, tone: "danger" };
  }
}

const toneDot: Record<string, string> = {
  ok: "bg-[var(--ro-success-700)]",
  warn: "bg-[var(--ro-amber-500)]",
  danger: "bg-[var(--ro-danger-700)]",
  progress: "bg-[var(--ro-plum-400)]",
};

const toneChip: Record<string, string> = {
  ok: "border-[color-mix(in_srgb,var(--ro-success-700)_28%,transparent)] bg-[color:var(--ro-success-100)] text-[color:var(--ro-success-700)]",
  warn: "border-[color-mix(in_srgb,var(--ro-amber-500)_30%,transparent)] bg-[color:var(--ro-warn-bg,var(--ro-amber-100))] text-[var(--ro-amber-800)]",
  danger:
    "border-[color-mix(in_srgb,var(--ro-danger-700)_28%,transparent)] bg-[color:var(--ro-danger-100)] text-[color:var(--ro-danger-700)]",
  progress:
    "border-[color-mix(in_srgb,var(--ro-plum-400)_30%,transparent)] bg-[color:var(--ro-accent-well)] text-[color:var(--ro-accent-fg)]",
};

/**
 * Intercom/Front-style inbox chrome: one compact toolbar + pairing only when needed.
 * Connected state never eats vertical space with a full account card.
 */
export function InboxWorkspaceHeader({
  health,
  dict,
  title,
}: {
  health: InboxHealthView;
  dict: Dictionary;
  title: string;
}) {
  const i = dict.inbox;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = healthMeta(dict, health.state);
  const sendingPaused = !health.outboundEnabled && health.state === "CONNECTED";
  const needsLinkPanel =
    health.state !== "CONNECTED" ||
    Boolean(health.pairingCode || health.qrDataUrl);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMenuOpen(false);
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="shrink-0 space-y-2">
      <header
        data-inbox-chrome
        className="flex h-12 min-h-12 items-center gap-3 border-b border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel,var(--ro-bg-elevated))] px-3 sm:px-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--ro-accent-well)] text-[color:var(--ro-accent-fg)]"
            aria-hidden
          >
            <MessageSquare className="size-4" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold leading-tight text-[color:var(--ro-text)]">
              {title}
            </h1>
          </div>
        </div>

        <div
          role="status"
          className={cn(
            "inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            toneChip[meta.tone]
          )}
          title={
            sendingPaused ? `${meta.label} · ${i.sendingPaused}` : meta.label
          }
        >
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              toneDot[meta.tone],
              meta.tone === "ok" && "ro-wa-live ro-wa-live--pulse",
              meta.tone === "progress" && "animate-pulse"
            )}
            aria-hidden
          />
          <span className="truncate">
            {sendingPaused ? i.sendingPaused : meta.label}
          </span>
        </div>

        {health.state !== "CONNECTED" ? (
          <Link
            href="#whatsapp-link-account"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] bg-[color:var(--ro-plum-700)] px-3 text-xs font-semibold text-[var(--ro-sand-50)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
          >
            <Link2 className="size-3.5" strokeWidth={1.5} aria-hidden />
            {i.linkAccount}
          </Link>
        ) : null}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="inline-flex size-9 min-h-9 items-center justify-center rounded-[10px] border border-[color:var(--ro-border-subtle)] text-[color:var(--ro-text-muted)] transition-[background-color,color] duration-[var(--ro-dur-fast)] hover:bg-[color:var(--ro-panel-hover)] hover:text-[color:var(--ro-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
            aria-label={i.connection}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            disabled={pending}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute end-0 top-[calc(100%+6px)] z-40 min-w-[11rem] overflow-hidden rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)] py-1 shadow-[var(--ro-e3)]"
            >
              {health.state !== "CONNECTED" ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full min-h-10 items-center gap-2 px-3 text-start text-sm text-[color:var(--ro-text)] hover:bg-[color:var(--ro-panel-hover)]"
                  disabled={pending}
                  onClick={() => run(adminWhatsAppReconnectAction)}
                >
                  <RefreshCw className="size-3.5" strokeWidth={1.5} aria-hidden />
                  {i.reconnect}
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="flex w-full min-h-10 items-center gap-2 px-3 text-start text-sm text-[color:var(--ro-text)] hover:bg-[color:var(--ro-panel-hover)]"
                disabled={pending}
                onClick={() => run(adminWhatsAppLogoutAction)}
              >
                <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden />
                {i.pairingLogout}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {sendingPaused ? (
        <p
          role="status"
          className="mx-3 rounded-[10px] border border-[color-mix(in_srgb,var(--ro-amber-500)_28%,transparent)] bg-[color:var(--ro-warn-bg,var(--ro-amber-100))] px-3 py-2 text-xs font-medium text-[var(--ro-amber-800)] sm:mx-4"
        >
          {i.sendingPaused}
        </p>
      ) : null}

      {needsLinkPanel ? (
        <div className="px-3 sm:px-4">
          <WhatsAppLinkAccount health={health} dict={dict} compact />
        </div>
      ) : null}
    </div>
  );
}
