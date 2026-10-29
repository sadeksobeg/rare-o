import Link from "next/link";
import { Compass, Plus } from "lucide-react";
import { BrokerageHeroStrip } from "@/components/brokerage/hero-strip";
import {
  brokerageStatusLabel,
  daysSince,
} from "@/components/brokerage/labels";
import { BrokerageStatusBadge } from "@/components/brokerage/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
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
  const { locale } = await getRequestDictionary();
  const ar = locale === "ar";
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
        eyebrow={ar ? "بوابة التاجر" : "Trader portal"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Compass className="size-7 shrink-0 text-[var(--ro-plum-800)]" strokeWidth={1.5} />
            {ar ? "طلبات الوساطة" : "Brokerage requests"}
          </span>
        }
        subtitle={
          ar
            ? "نتابع القطعة، نعاينها، ونرسل عرضاً قبل أي شراء"
            : "We inspect the piece and send a quote before any purchase"
        }
        actions={
          <ButtonLink href="/trader/brokerage/new" className="min-h-11">
            <Plus className="size-4" strokeWidth={1.5} />
            {ar ? "طلب وساطة" : "New request"}
          </ButtonLink>
        }
        stats={[
          {
            label: ar ? "الكل" : "Total",
            value: rows.length,
          },
          {
            label: ar ? "قيد المتابعة" : "In progress",
            value: inFlight,
          },
          {
            label: ar ? "ينتظرك" : "Needs you",
            value: needsYou,
            hint: needsYou > 0 ? (ar ? "رد الآن" : "Respond now") : undefined,
          },
          {
            label: ar ? "مغلق" : "Closed",
            value: closed,
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          variant="first-use"
          title={ar ? "لا طلبات بعد" : "No requests yet"}
          body={
            ar
              ? "ابدأ أول وساطة — نعاين القطعة ونرسل عرضاً قبل الشراء"
              : "Start your first brokerage — we inspect and quote before purchase"
          }
          actionHref="/trader/brokerage/new"
          actionLabel={ar ? "طلب وساطة" : "New request"}
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
                  className={`ro-brokerage-card group flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4 pe-5 ${
                    waiting
                      ? "ro-brokerage-pulse border-[color-mix(in_srgb,var(--ro-amber-500)_45%,var(--ro-border-subtle))] bg-[color-mix(in_srgb,var(--ro-amber-100)_35%,var(--ro-sand-50))]"
                      : "hover:border-[var(--ro-plum-300)] hover:bg-[color-mix(in_srgb,var(--ro-plum-50)_50%,var(--ro-sand-50))]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="font-mono text-[0.7rem] text-[var(--ro-ink-500)]"
                        dir="ltr"
                      >
                        {r.reference}
                      </p>
                      <span className="text-[0.65rem] tabular-nums text-[var(--ro-ink-500)]">
                        {age}d
                      </span>
                    </div>
                    <p className="mt-1 truncate text-base font-medium text-ro-ink">
                      {localizedName(locale, r.descriptionAr, r.descriptionEn)}
                    </p>
                    {(r.cityAr || r.cityEn) && (
                      <p className="mt-0.5 text-xs text-[var(--ro-ink-500)]">
                        {localizedName(locale, r.cityAr, r.cityEn)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    {waiting ? (
                      <span className="text-xs font-semibold text-[var(--ro-amber-800)]">
                        {ar ? "ينتظرك" : "Needs you"}
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
