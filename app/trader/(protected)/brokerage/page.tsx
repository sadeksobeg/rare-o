import Link from "next/link";
import { Compass, Plus } from "lucide-react";
import {
  brokerageStatusLabel,
} from "@/components/brokerage/labels";
import { BrokerageStatusBadge } from "@/components/brokerage/status-badge";
import { TraderPageHeader } from "@/components/trader/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listTraderBrokerage } from "@/lib/brokerage/service";
import { nextActor } from "@/lib/brokerage/status";
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
        <ul className="grid gap-3">
          {rows.map((r, i) => {
            const waiting = nextActor(r.status) === "trader";
            const age = formatAgeDays(r.createdAt, locale);
            return (
              <li
                key={r.id}
                className="min-w-0"
                style={{ animationDelay: `${Math.min(i, 7) * 45}ms` }}
              >
                <Link
                  href={`/trader/brokerage/${r.id}`}
                  className={`rad-card group flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-[14px] p-4 pe-5 ${
                    waiting
                      ? "border-[color:color-mix(in_srgb,var(--rad-warn)_50%,var(--rad-bd))] bg-[color:var(--rad-warns)]"
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
                      <span className="text-[0.7rem] text-[color:var(--rad-tx3)]">
                        {age}
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
                      <span className="rounded-full bg-[color:var(--rad-surface)] px-2.5 py-1 text-xs font-semibold text-[color:var(--rad-warn)]">
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
