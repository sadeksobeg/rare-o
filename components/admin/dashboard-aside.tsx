import { PressLink } from "@/components/portal/press-link";
import type { CatalogHealth, RetailPipeline } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatRelative } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { fmt } from "@/lib/ui/trader-labels";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import { cn } from "@/lib/utils";

const RING = 2 * Math.PI * 21;

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

function ringTone(state: string) {
  if (state === "CONNECTED") return "var(--ro-success-700)";
  if (state === "CONNECTING" || state === "RECONNECTING") {
    return "var(--ro-amber-500)";
  }
  return "var(--ro-danger-700)";
}

function ringOffset(state: string) {
  if (state === "CONNECTED") return 0;
  if (state === "CONNECTING" || state === "RECONNECTING") return RING * 0.45;
  if (state === "AUTHENTICATION_REQUIRED") return RING * 0.7;
  return RING * 0.92;
}

export function DashboardAside({
  health,
  lastWhatsAppAt,
  catalogHealth,
  pipeline,
  dict,
  locale,
  className,
}: {
  health: InboxHealthView;
  lastWhatsAppAt: Date | null;
  catalogHealth: CatalogHealth;
  pipeline: RetailPipeline;
  dict: Dictionary;
  locale: Locale;
  className?: string;
}) {
  const a = dict.admin;
  const stroke = ringTone(health.state);
  const photoPct =
    catalogHealth.published === 0
      ? 0
      : Math.round((catalogHealth.withPhoto / catalogHealth.published) * 100);
  const pipelineTotal =
    pipeline.ready_for_handoff +
    pipeline.in_follow_up +
    pipeline.handoff_opened +
    pipeline.completed;
  const share = (n: number) =>
    pipelineTotal === 0 ? 0 : Math.max(n === 0 ? 0 : 4, (n / pipelineTotal) * 100);

  const lastMessage = lastWhatsAppAt
    ? fmt(a.whatsappLastMessage, {
        relative: formatRelative(lastWhatsAppAt, locale),
      })
    : a.whatsappNoMessage;

  return (
    <aside className={cn("grid gap-2.5 content-start", className)}>
      <PressLink
        href="/admin/inbox"
        className="ro-portal-card flex items-center gap-3 border p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
      >
        <span className="relative inline-flex">
        <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
          <circle
            cx="26"
            cy="26"
            r="21"
            fill="none"
            stroke="var(--ro-sand-300)"
            strokeWidth="5"
          />
          <circle
            cx="26"
            cy="26"
            r="21"
            fill="none"
            stroke={stroke}
            strokeWidth="5"
            strokeDasharray={RING}
            strokeDashoffset={ringOffset(health.state)}
            transform="rotate(-90 26 26)"
            strokeLinecap="round"
          />
          <circle cx="26" cy="26" r="4" fill={stroke} />
        </svg>
          <span
            className={cn(
              "absolute end-0.5 top-0.5 size-2 rounded-full",
              health.state === "CONNECTED" && "ro-wa-live"
            )}
            style={{ background: stroke }}
            aria-hidden
          />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-ro-ink">
            {a.whatsappNoun} {healthLabel(dict, health.state)}
          </p>
          <p className="text-[11px] text-[var(--ro-ink-600)]">{lastMessage}</p>
        </div>
      </PressLink>

      <PressLink
        href="/admin/products"
        className="ro-portal-card space-y-1.5 border p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-ro-ink">{a.contentHealth}</p>
          <p className="text-[11px] text-[var(--ro-ink-600)]">
            {fmt(a.contentHealthRatio, {
              have: catalogHealth.withPhoto,
              total: catalogHealth.published,
            })}
          </p>
        </div>
        <div className="flex h-2 overflow-hidden rounded bg-[var(--ro-sand-300)]">
          <span
            className="h-full bg-[var(--ro-plum-900)]"
            style={{ width: `${photoPct}%` }}
          />
        </div>
        <p className="text-[11px] text-[var(--ro-ink-600)]">
          {catalogHealth.missingPhoto === 0
            ? a.contentHealthComplete
            : fmt(a.contentHealthMissing, { n: catalogHealth.missingPhoto })}
        </p>
      </PressLink>

      <PressLink
        href="/admin/requests"
        className="ro-portal-card space-y-1.5 border p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
      >
        <p className="font-medium text-ro-ink">{a.pipeline}</p>
        <div className="flex h-2 overflow-hidden rounded bg-[var(--ro-sand-300)]">
          {pipelineTotal === 0 ? (
            <span className="h-full w-full bg-[var(--ro-sand-300)]" />
          ) : (
            <>
              <span
                className="h-full bg-[var(--ro-amber-500)]"
                style={{ width: `${share(pipeline.ready_for_handoff)}%` }}
              />
              <span
                className="h-full bg-[var(--ro-plum-900)]"
                style={{ width: `${share(pipeline.in_follow_up)}%` }}
              />
              <span
                className="h-full bg-[var(--ro-progress-700)]"
                style={{ width: `${share(pipeline.handoff_opened)}%` }}
              />
              <span
                className="h-full bg-[var(--ro-success-700)]"
                style={{ width: `${share(pipeline.completed)}%` }}
              />
            </>
          )}
        </div>
        <p className="text-[11px] text-[var(--ro-ink-600)]">{a.pipelineLegend}</p>
      </PressLink>
    </aside>
  );
}
