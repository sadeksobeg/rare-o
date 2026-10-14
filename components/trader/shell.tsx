import Link from "next/link";
import { traderLogoutAction } from "@/app/deal-actions";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { BrandWallpaper } from "@/components/brand";
import { OfflineBanner } from "@/components/system/offline-banner";
import { AppToast } from "@/components/system/app-toast";
import {
  TraderBottomTabs,
  TraderDesktopNav,
  type TraderTab,
} from "@/components/trader/nav";
import { getTraderSession } from "@/lib/auth/trader-session";
import { getRequestDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export async function TraderShell({ children }: { children: React.ReactNode }) {
  const session = await getTraderSession();
  if (!session) redirect("/trader/login");

  const { locale, dict } = await getRequestDictionary();

  const tabs: TraderTab[] = [
    {
      href: "/trader",
      label: dict.trader.overview,
      match: "exact",
      icon: "home",
    },
    {
      href: "/trader/deals",
      label: dict.trader.deals,
      match: "prefix",
      icon: "deals",
    },
    {
      href: "/trader/wholesale",
      label: dict.trader.wholesale,
      match: "prefix",
      icon: "wholesale",
    },
    {
      href: "/trader/offers",
      label: dict.trader.offers,
      match: "prefix",
      icon: "offers",
    },
    {
      href: "/trader/profile",
      label: dict.trader.profile,
      match: "prefix",
      icon: "profile",
    },
  ];

  return (
    <AppToast dismissLabel={dict.common.toastDismiss}>
      <div className="relative min-h-screen overflow-x-clip bg-[var(--ro-sand-100)] text-ro-ink">
        <BrandWallpaper
          tone="cream"
          patternId="ro-trader-wallpaper"
          className="z-0 opacity-[0.55]"
        />
        <div className="relative z-10">
        <OfflineBanner />
        <header className="sticky top-0 z-30 border-b border-ro-line bg-ro-paper/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-4">
            <Link
              href="/trader"
              className="text-sm font-semibold tracking-[0.18em]"
            >
              RARE OUD · {dict.trader.brand}
            </Link>
            <TraderDesktopNav tabs={tabs} />
            <div className="flex items-center gap-3 text-sm">
              <AdminLocaleToggle locale={locale} label={dict.common.language} />
              <span className="hidden text-ro-muted sm:inline">
                {session.displayName}
              </span>
              <form action={traderLogoutAction}>
                <button
                  type="submit"
                  className="rounded-[var(--ro-r-sm)] border border-ro-line px-3 py-1.5 text-xs"
                >
                  {dict.trader.logout}
                </button>
              </form>
            </div>
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-[1120px] px-4 py-8 pb-24 md:pb-8"
        >
          {children}
        </main>
        <TraderBottomTabs tabs={tabs} />
        </div>
      </div>
    </AppToast>
  );
}
