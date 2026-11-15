import Link from "next/link";
import { Compass, Plus } from "lucide-react";
import {
  brokerageStatusLabel,
} from "@/components/brokerage/labels";
import { BrokerageStatusBadge } from "@/components/brokerage/status-badge";
import { TraderPageHeader } from "@/components/trader/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listTraderBrokerage } from "@/lib/brokerage/service";
import { BROKERAGE_LIFECYCLE, nextActor, type BrokerageStatus } from "@/lib/brokerage/status";
import { getTraderSession } from "@/lib/auth/trader-session";
import { formatAgeDays } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { localizedName } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TraderBrokeragePage() {
  const session = await getTraderSession();
  if (!session) redirect("/trader/login");
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const rows = await listTraderBrokerage(session.sub);

  const needsYou = rows.filter((r) => nextActor(r.status) === "trader").length;
  const open = rows.filter(
    (r) =>
      !["CLOSED", "DECLINED", "REJECTED", "CANCELLED"].includes(r.status)
  ).length;
  const closed = rows.length - open;

  return (
    <section className="space-y-6 pb-[calc(88px+env(safe-area-inset-bottom,0px)+48px)] min-[901px]:pb-0">
      <TraderPageHeader
        title={t.brokerageListTitle}
        description={t.brokerageListSubtitle}
        icon={<Compass className="size-5" strokeWidth={1.5} />}
        action={
          <Link
            href="/trader/brokerage/new"
            className="rad-btn rad-pri rad-sm !hidden min-[901px]:!inline-flex"
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            {t.brokerageNewCta}
          </Link>
        }
      />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <li className="rad-card px-4 py-3">
          <p className="text-[0.7rem] font-medium text-[color:var(--rad-tx3)]">
            {t.brokerageStatTotal}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--rad-tx)]">
            {rows.length}
          </p>
        </li>
        <li className="rad-card px-4 py-3">
          <p className="text-[0.7rem] font-medium text-[color:var(--rad-tx3)]">
            {t.brokerageStatInProgress}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--rad-tx)]">
            {open}
          </p>
          {needsYou > 0 ? (
            <p className="mt-1 inline-flex rounded-full bg-[color:var(--rad-warns)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--rad-warn)]">
              {t.brokerageStatNeedsYou} · {needsYou}
            </p>
          ) : null}
        </li>
        <li className="rad-card px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-[0.7rem] font-medium text-[color:var(--rad-tx3)]">
            {t.brokerageStatClosed}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--rad-tx)]">
            {closed}
          </p>
        </li>
      </ul>

      {rows.length === 0 ? (
        <EmptyState
          variant="first-use"
          title={t.brokerageEmptyTitle}
          body={t.brokerageEmptyBody}
          actionHref="/trader/brokerage/new"
          actionLabel={t.brokerageNewCta}
        />
      ) : (
        <ul className="grid gap-3.5">
          {rows.map((r, i) => {
            const waiting = nextActor(r.status) === "trader";
            const photosOpen = r.photoRequests.length > 0;
            const attention = waiting || photosOpen;
            const age = formatAgeDays(r.createdAt, locale);
            const idx = BROKERAGE_LIFECYCLE.indexOf(r.status as BrokerageStatus);
            const dead = ["DECLINED", "REJECTED", "CANCELLED"].includes(r.status);
            const pct = r.status === "CLOSED" ? 100 : idx >= 0 ? Math.round(((idx + 1) / BROKERAGE_LIFECYCLE.length) * 100) : 10;
            const accent = dead ? "#e06060" : r.status === "CLOSED" ? "#2e9d6a" : attention ? "#e0a030" : "var(--rad-ac, #8a52c4)";
            return (
              <li key={r.id} className="min-w-0" style={{ animationDelay: `${Math.min(i, 7) * 45}ms` }}>
                <Link
                  href={`/trader/brokerage/${r.id}`}
                  className="rad-card group relative block overflow-hidden rounded-[18px] p-4 ps-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderColor: attention ? "color-mix(in srgb, #e0a030 55%, var(--rad-bd))" : undefined }}
                >
                  <span aria-hidden className="absolute inset-y-0 start-0 w-1.5" style={{ background: accent }} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-[0.7rem] text-[color:var(--rad-tx3)]">
                        <bdi dir="ltr" className="font-mono">{r.reference}</bdi>
                        <span>·</span>
                        <span>{age}</span>
                      </p>
                      <p className="mt-1 line-clamp-2 text-[15.5px] font-semibold leading-snug text-[color:var(--rad-tx)]">
                        {localizedName(locale, r.descriptionAr, r.descriptionEn)}
                      </p>
                      {r.cityAr || r.cityEn ? (
                        <p className="mt-0.5 text-xs text-[color:var(--rad-tx3)]">{localizedName(locale, r.cityAr, r.cityEn)}</p>
                      ) : null}
                    </div>
                    <BrokerageStatusBadge status={r.status} label={brokerageStatusLabel(r.status, locale)} />
                  </div>
                  <div className="mt-3.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10" aria-hidden>
                      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: accent }} />
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-[color:var(--rad-tx3)]">{pct}%</span>
                  </div>
                  {attention ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {photosOpen ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(224,160,48,.2)] px-3 py-1 text-xs font-bold text-[#c98a1a]">
                          📷 مطلوب منك صور
                        </span>
                      ) : null}
                      {waiting ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(224,160,48,.2)] px-3 py-1 text-xs font-bold text-[#c98a1a]">
                          {r.status === "AWAITING_PAYMENT" ? "💳 بانتظار دفعك" : t.brokerageNeedsYouChip}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
