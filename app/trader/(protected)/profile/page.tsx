import {
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { TraderPreferencesForm } from "@/components/trader/preferences-form";
import { TraderPasswordSettings } from "@/components/trader/password-settings";
import { TraderSignOutOthers } from "@/components/trader/sign-out-others";
import { TraderPageHeader } from "@/components/trader/page-header";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { AppearanceCard } from "@/components/portal/appearance-card";
import { Pill } from "@/components/ui-kit/pill";
import { requireTraderSession } from "@/lib/auth/trader-session";
import { listLaunchCategories } from "@/lib/catalog/service";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import type { StatusTone } from "@/lib/ui/status";

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
    <div className="flex gap-4 border-b border-[color:var(--rad-bd)] px-5 py-4 last:border-b-0 sm:px-6">
      <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-[var(--rad-r-sm)] bg-[color:var(--rad-surface3)] text-[color:var(--rad-ac)]">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-semibold text-[color:var(--rad-tx3)]">
          {label}
        </p>
        <p className="text-base font-semibold text-[color:var(--rad-tx)]">
          {dir === "ltr" ? <bdi dir="ltr">{value}</bdi> : value}
        </p>
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
  const statusTone = (
    trader.status === "active" ? "success" : "closed"
  ) as StatusTone;
  const selectedSlugs = trader.interestCategorySlugs
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const currentLang = locale === "ar" ? "العربية" : "English";
  const otherLang = locale === "ar" ? "English" : "العربية";

  return (
    <section className="space-y-8 pb-[calc(68px+env(safe-area-inset-bottom,0px)+24px)] min-[901px]:pb-0">
      <TraderPageHeader
        title={t.profileTitle}
        description={t.profileNote}
        icon={<UserRound className="size-5" strokeWidth={1.5} />}
      />
      <AppearanceCard
        title={dict.common.themeGroup}
        description={t.profileAppearanceDesc}
        lightLabel={dict.common.themeLight}
        darkLabel={dict.common.themeDark}
      />
      <div className="rad-card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          <h2
            className="text-[15px] font-semibold text-[color:var(--rad-tx)]"
            style={{ fontFamily: "var(--rad-font, inherit)" }}
          >
            {dict.common.language}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--rad-tx2)]">
            {t.profileLanguageCurrent}:{" "}
            <strong className="text-[color:var(--rad-tx)]">{currentLang}</strong>
          </p>
          <p className="mt-0.5 text-xs text-[color:var(--rad-tx3)]">
            {t.profileLanguageSwitch} {otherLang}
          </p>
        </div>
        <AdminLocaleToggle
          locale={locale}
          label={`${t.profileLanguageSwitch} ${otherLang}`}
          tone="auto"
          className="rad-ib"
        />
      </div>
      <div className="rad-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 border-b border-[color:color-mix(in_srgb,var(--rad-ac)_35%,var(--rad-bd))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--rad-ac)_88%,#1a0f22)_0%,color-mix(in_srgb,var(--rad-ac)_55%,#0b080d)_100%)] px-5 py-7 text-[color:var(--rad-cream,#f4e7d8)] sm:px-6">
          <span
            aria-hidden
            className="flex size-[4.5rem] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--rad-cream,#f4e7d8)_18%,transparent)] text-[color:var(--rad-cream,#f4e7d8)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--rad-cream,#f4e7d8)_28%,transparent)]"
          >
            <UserRound className="size-8" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {trader.displayName}
            </p>
            <p className="text-sm text-[color:color-mix(in_srgb,var(--rad-cream,#f4e7d8)_78%,transparent)]">
              <bdi dir="ltr">{trader.email}</bdi>
            </p>
          </div>
          <span className="inline-flex rounded-full bg-[color-mix(in_srgb,#fff_92%,transparent)] px-0.5 py-0.5 shadow-[0_0_0_1px_color-mix(in_srgb,#fff_35%,transparent)]">
            <Pill tone={statusToneToPill(statusTone)}>{statusLabel}</Pill>
          </span>
        </div>

        <div>
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
        </div>
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

      <div className="rad-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--rad-tx)]">
            {dict.auth.activeSessions}
          </h2>
          <p className="text-sm text-[color:var(--rad-tx3)]">
            {dict.auth.activeSessionsDesc}
          </p>
        </div>
        <TraderSignOutOthers
          label={dict.auth.signOutOthers}
          title={dict.auth.signOutOthersTitle}
          description={dict.auth.signOutOthersDesc}
          confirmLabel={dict.auth.signOutOthers}
          cancelLabel={dict.common.cancel}
          successLabel={dict.auth.signedOutOthers}
        />
      </div>
    </section>
  );
}
