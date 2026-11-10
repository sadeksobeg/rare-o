import Link from "next/link";
import { Compass, Plus } from "lucide-react";
import { BrokerageHeroStrip } from "@/components/brokerage/hero-strip";
import {
  brokerageStatusLabel,
  daysSince,
} from "@/components/brokerage/labels";
import { BrokerageStatusBadge } from "@/components/brokerage/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listTraderBrokerage } from "@/lib/brokerage/service";
import { nextActor } from "@/lib/brokerage/status";
import { getTraderSession } from "@/lib/auth/trader-session";
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
  const inFlight = rows.filter(
    (r) =>
      !["CLOSED", "DECLINED", "REJECTED", "CANCELLED"].includes(r.status)
  ).length;
  const closed = rows.length - inFlight;

  return (
    <section className="space-y-6">
      <BrokerageHeroStrip
        eyebrow={t.brand}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Compass
              className="size-7 shrink-0 text-[color:var(--rad-ac)]"
              strokeWidth={1.5}
            />
            {t.brokerageListTitle}
          </span>
        }
        subtitle={t.brokerageListSubtitle}
        actions={
          <Link href="/trader/brokerage/new" className="rad-btn rad-pri min-h-11">
            <Plus className="size-4" strokeWidth={1.5} />
            {t.brokerageNewCta}
          </Link>
        }
        stats={[
          { label: t.brokerageStatTotal, value: rows.length },
          { label: t.brokerageStatInProgress, value: inFlight },
          {
            label: t.brokerageStatNeedsYou,
            value: needsYou,
            hint: needsYou > 0 ? t.brokerageStatNeedsYouHint : undefined,
          },
          { label: t.brokerageStatClosed, value: closed },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          variant="first-use"
          title={t.brokerageEmptyTitle}
          body={t.brokerageEmptyBody}
          actionHref="/trader/brokerage/new"
          actionLabel={t.brokerageNewCta}
        />
      ) : (
        <ul className="grid gap-3">
          {rows.map((r, i) => {
            const waiting = nextActor(r.status) === "trader";
            const age = daysSince(r.createdAt);
            return (
              <li
                key={r.id}
                className="ro-login-fade-up"
                style={{ animationDelay: `${Math.min(i, 7) * 45}ms` }}
              >
                <Link
                  href={`/trader/brokerage/${r.id}`}
                  className={`rad-card group flex min-h-14 flex-wrap items-center justify-between gap-3 p-4 pe-5 ${
                    waiting
                      ? "ro-brokerage-pulse border-[color-mix(in_srgb,var(--ro-amber-500)_45%,var(--rad-bd))] bg-[color-mix(in_srgb,var(--ro-amber-100)_20%,var(--rad-surface))]"
                      : "hover:border-[color:var(--rad-ac)]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="font-mono text-[0.7rem] text-[color:var(--rad-tx3)]"
                        dir="ltr"
                      >
                        <bdi dir="ltr">{r.reference}</bdi>
                      </p>
                      <span className="text-[0.65rem] tabular-nums text-[color:var(--rad-tx3)]">
                        <bdi dir="ltr">{age}d</bdi>
                      </span>
                    </div>
                    <p className="mt-1 truncate text-base font-medium text-[color:var(--rad-tx)]">
                      {localizedName(locale, r.descriptionAr, r.descriptionEn)}
                    </p>
                    {(r.cityAr || r.cityEn) && (
                      <p className="mt-0.5 text-xs text-[color:var(--rad-tx3)]">
                        {localizedName(locale, r.cityAr, r.cityEn)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    {waiting ? (
                      <span className="text-xs font-semibold text-[var(--ro-amber-800)]">
                        {t.brokerageNeedsYouChip}
                      </span>
                    ) : null}
                    <BrokerageStatusBadge
                      status={r.status}
                      label={brokerageStatusLabel(r.status, locale)}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
