import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import type { StatusTone } from "@/lib/ui/status";

/**
 * A18 — InboxConnectionBanner.
 * Dict-only labels; never surface detailSafe / worker / env strings.
 */
export function InboxConnectionBanner({
  health,
  dict,
}: {
  health: InboxHealthView;
  dict: Dictionary;
}) {
  const i = dict.inbox;
  const state = health.state;
  const sendingPaused = !health.outboundEnabled && state === "CONNECTED";

  if (state === "CONNECTED" && !sendingPaused) {
    return (
      <div
        role="status"
        data-inbox-banner="connected"
        className="h-1 w-full bg-[var(--ro-success-700)]"
        title={i.connected}
        aria-label={i.connected}
      />
    );
  }

  let tone: StatusTone = "info";
  let message = i.connecting;
  let action: React.ReactNode = null;

  if (sendingPaused) {
    tone = "attention";
    message = i.sendingPaused;
  } else if (state === "CONNECTING" || state === "RECONNECTING") {
    tone = "progress";
    message = state === "RECONNECTING" ? i.healthReconnecting : i.connecting;
  } else if (state === "AUTHENTICATION_REQUIRED") {
    tone = "attention";
    message = i.authRequired;
    action = (
      <Link
        href="/admin/inbox"
        className="text-sm font-semibold underline-offset-2 hover:underline"
      >
        {i.linkAccount}
      </Link>
    );
  } else if (state === "ERROR") {
    tone = "danger";
    message = i.error;
    action = (
      <Link
        href="/admin/inbox"
        className="text-sm font-semibold underline-offset-2 hover:underline"
      >
        {i.reconnect}
      </Link>
    );
  } else {
    // DISCONNECTED (default)
    tone = "danger";
    message = i.disconnected;
    action = (
      <Link
        href="/admin/inbox"
        className="text-sm font-semibold underline-offset-2 hover:underline"
      >
        {i.reconnect}
      </Link>
    );
  }

  return (
    <div data-inbox-banner={state}>
      <Banner tone={tone} action={action}>
        <span>{message}</span>
      </Banner>
    </div>
  );
}
