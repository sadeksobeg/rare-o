import Link from "next/link";
import { Compass, FileDown, Handshake, Package, Plus, ShoppingBag } from "lucide-react";
import { RadKpiCard } from "@/components/admin/rad/kpi-card";
import {
  RadActionQueue,
  type RadQueueRow,
  type RadQueueStatus,
} from "@/components/admin/rad/action-queue";
import { RadOrdersChart, type RadChartRange } from "@/components/admin/rad/orders-chart";
import { RadWhatsAppCard } from "@/components/admin/rad/whatsapp-card";
import { RadActivityTimeline } from "@/components/admin/rad/activity-timeline";
import type { getAdminHomeData, ActionQueueDomain } from "@/lib/admin/dashboard";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatDate, lastCalendarDayKeys } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";

export type AdminHomeData = Awaited<ReturnType<typeof getAdminHomeData>>;

function waStatus(dict: Dictionary, state: string) {
  switch (state) {
    case "CONNECTED":
      return { label: dict.inbox.healthConnected, connected: true };
    case "CONNECTING":
      return { label: dict.inbox.healthConnecting, connected: false };
    case "RECONNECTING":
      return { label: dict.inbox.healthReconnecting, connected: false };
    case "AUTHENTICATION_REQUIRED":
      return { label: dict.inbox.healthAuthRequired, connected: false };
    case "ERROR":
      return { label: dict.inbox.healthError, connected: false };
    case "DISCONNECTED":
    default:
      return { label: dict.inbox.healthDisconnected, connected: false };
  }
}

const QUEUE_STATUS: Record<ActionQueueDomain, RadQueueStatus> = {
  retail: "new",
  deal: "warn",
  wholesale: "info",
};

/**
 * AD-02 dashboard content — pure presentation over an already-fetched
 * AdminHomeData. Shared by the real page (real data) and /dev/pilot (a
 * synthetic rich-data fixture), so the two can never visually drift.
 */
export function AdminDashboardContent({
  locale,
  dict,
  greeting,
  data,
}: {
  locale: Locale;
  dict: Dictionary;
  greeting: string;
  data: AdminHomeData;
}) {
  const ad2 = dict.ad2;
  const a = dict.admin;
  const today = formatDate(new Date(), locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const waiting =
    data.kpis.retailAwaitingAdmin +
    data.kpis.dealsAwaitingAdmin +
    data.kpis.wholesaleAwaitingAdmin;
  const pendingPhrase = plural(waiting, locale, {
    zero: ad2.pendingZero,
    one: ad2.pendingOne,
    two: ad2.pendingTwo,
    few: ad2.pendingFew,
    many: ad2.pendingMany,
    other: ad2.pendingOther,
  });

  const wa = waStatus(dict, data.health.state);
  const waUnreadPhrase = plural(data.manageHub.unreadConversations, locale, {
    zero: ad2.waUnreadZero,
    one: ad2.waUnreadOne,
    two: ad2.waUnreadTwo,
    few: ad2.waUnreadFew,
    many: ad2.waUnreadMany,
    other: ad2.waUnreadOther,
  });
  const waDescription = wa.connected
    ? waUnreadPhrase
    : `${ad2.waDescriptionZero} ${waUnreadPhrase}`;

  const queueRows: RadQueueRow[] = data.actionQueue.map((row) => ({
    id: row.id,
    domain: row.domain,
    title: row.domain === "retail" ? row.reference : row.title,
    subtitle:
      row.domain === "retail" && row.lineCount != null
        ? plural(row.lineCount, locale, {
            zero: ad2.rowRequestZero,
            one: ad2.rowRequestOne,
            two: ad2.rowRequestTwo,
            few: ad2.rowRequestFew,
            many: ad2.rowRequestMany,
            other: ad2.rowRequestOther,
          })
        : row.subtitle,
    href: row.href,
    ageAt: row.ageAt,
    status: QUEUE_STATUS[row.domain],
  }));

  const dateLabels = lastCalendarDayKeys(30);
  const statusLabels: Record<RadQueueStatus, string> = {
    new: ad2.statusNew,
    warn: ad2.statusAwaitingReply,
    info: ad2.statusInProgress,
    ok: ad2.statusReady,
  };

  return (
    <>
      <svg className="rad-rings" viewBox="0 0 400 400" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth={1}>
          <circle cx={200} cy={200} r={60} />
          <circle cx={200} cy={200} r={100} />
          <circle cx={200} cy={200} r={140} />
          <circle cx={200} cy={200} r={180} />
        </g>
      </svg>
      <div className="rad-phead rad-rise" style={{ "--rad-s": 0 } as React.CSSProperties}>
        <div>
          <h1>{greeting}</h1>
          <p>
            {today} · <b className="rad-num">{pendingPhrase}</b> {ad2.awaitingYouSuffix}
          </p>
        </div>
        <div className="rad-pact">
          <button type="button" className="rad-btn rad-gh">
            <FileDown width={16} height={16} strokeWidth={1.5} aria-hidden />
            {ad2.export}
          </button>
          <Link href="/admin/products/new" className="rad-btn rad-pri">
            <Plus width={16} height={16} strokeWidth={1.5} aria-hidden />
            {ad2.create}
          </Link>
        </div>
      </div>

      <section className="rad-kpis" aria-label={ad2.chartTitle}>
        <RadKpiCard
          icon={<ShoppingBag width={17} height={17} strokeWidth={1.5} aria-hidden />}
          tone="ac"
          label={ad2.kpiRetailNew}
          value={data.kpis.retailAwaitingAdmin}
          delta={
            data.series.retail.today !== data.series.retail.yesterday
              ? {
                  direction: data.series.retail.today > data.series.retail.yesterday ? "up" : "down",
                  label: `${data.series.retail.today > data.series.retail.yesterday ? "+" : ""}${data.series.retail.today - data.series.retail.yesterday}`,
                }
              : { direction: "flat", label: "0" }
          }
          deltaCaption={ad2.deltaVsLastWeek}
          idleLabel={a.kpiIdle}
          sparkline={data.series.retail.points}
          style={{ "--rad-s": 1 } as React.CSSProperties}
        />
        <RadKpiCard
          icon={<Handshake width={17} height={17} strokeWidth={1.5} aria-hidden />}
          tone="warn"
          label={a.kpiDeals}
          value={data.kpis.dealsAwaitingAdmin}
          delta={
            data.series.deals.today !== data.series.deals.yesterday
              ? {
                  direction: data.series.deals.today > data.series.deals.yesterday ? "up" : "down",
                  label: `${data.series.deals.today > data.series.deals.yesterday ? "+" : ""}${data.series.deals.today - data.series.deals.yesterday}`,
                }
              : { direction: "flat", label: "0" }
          }
          deltaCaption={ad2.deltaVsLastWeek}
          idleLabel={a.kpiIdle}
          sparkline={data.series.deals.points}
          style={{ "--rad-s": 2 } as React.CSSProperties}
        />
        <RadKpiCard
          icon={<Package width={17} height={17} strokeWidth={1.5} aria-hidden />}
          tone="info"
          label={ad2.kpiWholesale}
          value={data.kpis.wholesaleAwaitingAdmin}
          delta={
            data.series.wholesale.today !== data.series.wholesale.yesterday
              ? {
                  direction: data.series.wholesale.today > data.series.wholesale.yesterday ? "up" : "down",
                  label: `${data.series.wholesale.today > data.series.wholesale.yesterday ? "+" : ""}${data.series.wholesale.today - data.series.wholesale.yesterday}`,
                }
              : { direction: "flat", label: "0" }
          }
          deltaCaption={ad2.deltaVsLastWeek}
          idleLabel={a.kpiIdle}
          sparkline={data.series.wholesale.points}
          style={{ "--rad-s": 3 } as React.CSSProperties}
        />
        <RadKpiCard
          icon={<Compass width={17} height={17} strokeWidth={1.5} aria-hidden />}
          tone="ok"
          label={a.kpiBrokerage}
          value={data.kpis.activeBrokerage}
          delta={{ direction: "flat", label: "0" }}
          deltaCaption={ad2.deltaFlat}
          idleLabel={a.kpiIdle}
          style={{ "--rad-s": 4 } as React.CSSProperties}
        />
      </section>

      <div className="rad-grid">
        <RadActionQueue
          rows={queueRows}
          counts={{
            retail: data.kpis.retailAwaitingAdmin,
            deal: data.kpis.dealsAwaitingAdmin,
            wholesale: data.kpis.wholesaleAwaitingAdmin,
          }}
          title={ad2.needsAction}
          tabAllLabel={ad2.tabAll}
          tabLabels={{ retail: a.filterRetail, deal: a.filterDeals, wholesale: a.filterWholesale }}
          footerTemplate={ad2.listFooter}
          viewAllLabel={ad2.viewAll}
          viewAllHref="/admin/requests"
          emptyTitle={ad2.emptyQueueTitle}
          emptyBody={ad2.emptyQueueBody}
          openLabel={ad2.openRow}
          statusLabels={statusLabels}
          locale={locale}
        />

        <div className="rad-rail">
          <RadOrdersChart
            title={ad2.chartTitle}
            points30={data.requestsTrend.points}
            dateLabels={dateLabels}
            defaultRange={14 as RadChartRange}
            rangeDaysTemplate={ad2.rangeDays}
            captionForms={{
              zero: ad2.chartCaptionZero,
              one: ad2.chartCaptionOne,
              two: ad2.chartCaptionTwo,
              few: ad2.chartCaptionFew,
              many: ad2.chartCaptionMany,
              other: ad2.chartCaptionOther,
            }}
            locale={locale}
            tableCaption={ad2.chartTitle}
          />

          <RadWhatsAppCard
            title={ad2.waTitle}
            connected={wa.connected}
            statusLabel={wa.label}
            description={waDescription}
            openLabel={ad2.waOpenInbox}
            openHref="/admin/inbox"
          />

          <RadActivityTimeline
            title={ad2.activityTitle}
            items={data.activityFeed}
            dict={dict}
            locale={locale}
            emptyLabel={ad2.emptyQueueTitle}
          />
        </div>
      </div>
    </>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div aria-busy="true">
      <div className="rad-phead">
        <div>
          <div
            style={{
              height: 28,
              width: 180,
              borderRadius: 8,
              background: "var(--rad-surface3)",
            }}
          />
        </div>
      </div>
      <section className="rad-kpis">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rad-card rad-kpi" style={{ background: "var(--rad-surface)" }} />
        ))}
      </section>
      <div className="rad-grid">
        <div className="rad-card" style={{ minHeight: 420 }} />
        <div className="rad-rail">
          <div className="rad-card" style={{ height: 240 }} />
          <div className="rad-card" style={{ height: 160 }} />
          <div className="rad-card" style={{ height: 200 }} />
        </div>
      </div>
    </div>
  );
}
