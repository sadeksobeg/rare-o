import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";

function healthLabel(dict: Dictionary, state: string): string {
  switch (state) {
    case "CONNECTED":
      return dict.inbox.healthConnected;
    case "CONNECTING":
      return dict.inbox.healthConnecting;
    case "RECONNECTING":
      return dict.inbox.healthReconnecting;
    case "AUTHENTICATION_REQUIRED":
      return dict.inbox.healthAuthRequired;
    case "ERROR":
      return dict.inbox.healthError;
    case "DISCONNECTED":
    default:
      return dict.inbox.healthDisconnected;
  }
}

export function InboxHealthBanner({
  health,
  dict,
}: {
  health: InboxHealthView;
  dict: Dictionary;
}) {
  // Connection state only — never surface detailSafe / worker / env strings in UI.
  return (
    <div className="flex flex-wrap items-center gap-3 border border-ro-line bg-ro-surface px-4 py-3 text-sm">
      <span className="text-ro-muted">{dict.inbox.connection}:</span>
      <span className="font-medium">{healthLabel(dict, health.state)}</span>
      <span
        className={
          health.outboundEnabled
            ? "ms-auto text-ro-muted"
            : "ms-auto text-ro-purple"
        }
      >
        {health.outboundEnabled
          ? dict.inbox.outboundEnabled
          : dict.inbox.outboundDisabled}
      </span>
    </div>
  );
}
