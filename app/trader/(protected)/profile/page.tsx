import {
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { TraderPreferencesForm } from "@/components/trader/preferences-form";
import { TraderPasswordSettings } from "@/components/trader/password-settings";
import { TraderPageHeader } from "@/components/trader/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listLaunchCategories } from "@/lib/catalog/service";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

function ProfileRow({
  icon: Icon,
  label,
  value,
  dir,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)] px-5 py-4 last:border-b-0 sm:px-6">
      <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-sand-50)_50%,transparent)]">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <dt className="text-xs font-semibold tracking-wide text-ro-muted">
          {label}
        </dt>
        <dd
          dir={dir}
          className={cn(
            "text-base font-semibold text-ro-ink",
            dir === "ltr" && "text-start"
          )}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}

export default async function TraderProfilePage() {
  const session = await requireTraderSession();
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;
  const [trader, categories] = await Promise.all([
    prisma.traderAccount.findUnique({ where: { id: session.sub } }),
    listLaunchCategories(),
  ]);
  if (!trader) return null;

  const statusLabel = t.accountStatus[trader.status] ?? trader.status;
  const statusTone = trader.status === "active" ? "success" : "closed";
  const selectedSlugs = trader.interestCategorySlugs
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className="ro-portal-stagger space-y-8">
      <TraderPageHeader
        title={t.profileTitle}
        description={t.profileNote}
        icon={<UserRound className="size-5" strokeWidth={2} />}
      />
      <div className="ro-portal-card overflow-hidden border">
        <div className="flex flex-wrap items-center gap-5 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)] bg-[linear-gradient(135deg,var(--ro-plum-900)_0%,var(--ro-ink-950)_100%)] px-5 py-7 text-[var(--ro-sand-100)] sm:px-6">
          <span
            aria-hidden
            className="flex size-[4.5rem] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ro-sand-100)_16%,transparent)] text-[var(--ro-sand-50)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--ro-sand-100)_28%,transparent),0_12px_40px_-16px_rgba(0,0,0,0.55)]"
          >
            <UserRound className="size-8" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {trader.displayName}
            </p>
            <p
              dir="ltr"
              className="text-sm text-[color-mix(in_srgb,var(--ro-sand-100)_72%,transparent)]"
            >
              {trader.email}
            </p>
          </div>
          <StatusChip tone={statusTone} label={statusLabel} />
        </div>

        <dl>
          <ProfileRow
            icon={UserRound}
            label={t.profileName}
            value={trader.displayName}
          />
          <ProfileRow
            icon={Mail}
            label={t.profileEmail}
            value={trader.email}
            dir="ltr"
          />
          <ProfileRow
            icon={Building2}
            label={t.profileCompany}
            value={trader.companyName || "—"}
          />
          <ProfileRow
            icon={Phone}
            label={t.profilePhone}
            value={trader.phone || "—"}
            dir="ltr"
          />
          <ProfileRow
            icon={ShieldCheck}
            label={t.profileStatus}
            value={statusLabel}
          />
        </dl>
      </div>

      <TraderPreferencesForm
        labels={t}
        selectedSlugs={selectedSlugs}
        interestNotes={trader.interestNotes}
        categories={categories.map((c) => ({
          slug: c.slug,
          name:
            locale === "ar"
              ? c.nameAr || c.nameEn || c.slug
              : c.nameEn || c.nameAr || c.slug,
        }))}
      />

      <TraderPasswordSettings
        forceDict={dict.forcePasswordChange}
        sectionDict={dict.changePassword}
      />
    </section>
  );
}
