import Link from "next/link";
import { LogOut, MessageSquare, UserRound } from "lucide-react";
import { adminLogoutAction } from "@/app/admin-logout-action";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import {
  AdminMobileNav,
  AdminSidebar,
  type AdminNavGroup,
} from "@/components/admin/nav";
import { Emblem } from "@/components/brand";
import { ChromeBadge } from "@/components/portal/chrome-badge";
import { OfflineBanner } from "@/components/system/offline-banner";
import { AppToast } from "@/components/system/app-toast";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { getAdminSessionChrome } from "@/lib/auth/admin-session";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionChrome();
  if (!session) redirect("/admin/login");

  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const promoFeatures = isPromoFeaturesEnabled();
  const unreadInbox = await prisma.whatsAppConversation.count({
    where: { unreadCount: { gt: 0 } },
  });

  const groups: AdminNavGroup[] = [
    {
      title: dict.common.navOps,
      items: [
        { href: "/admin", label: a.dashboard },
        { href: "/admin/inbox", label: a.inbox, badge: unreadInbox },
        { href: "/admin/requests", label: a.requests },
        { href: "/admin/deals", label: a.deals },
        { href: "/admin/wholesale", label: a.wholesale },
        { href: "/admin/brokerage", label: a.brokerage },
      ],
    },
    {
      title: dict.common.navCatalog,
      items: [
        { href: "/admin/products", label: a.products },
        { href: "/admin/categories", label: a.categories },
        { href: "/admin/offers", label: a.offers },
        ...(promoFeatures
          ? [{ href: "/admin/promos", label: a.promos }]
          : []),
      ],
    },
    {
      title: dict.common.navPeople,
      items: [
        { href: "/admin/customers", label: a.customers },
        { href: "/admin/traders", label: a.traders },
        {
          href: "/admin/team",
          label: locale === "ar" ? "الفريق" : "Team",
        },
        { href: "/admin/settings/security", label: a.settings },
      ],
    },
  ];

  const brand = `RARE OUD · ${a.dashboard}`;

  return (
    <AppToast dismissLabel={dict.common.toastDismiss}>
      <SonnerToaster />
      <div className="ro-portal ro-portal-admin relative flex min-h-screen text-ro-ink">
        <div className="ro-portal-atmosphere" aria-hidden />
        <div className="relative z-10 flex min-h-screen w-full">
          <AdminSidebar groups={groups} brand={brand} />
          <div className="flex min-w-0 flex-1 flex-col">
            <OfflineBanner />
            <header className="ro-portal-header sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-4">
              <div className="flex min-w-0 items-center gap-3">
                <AdminMobileNav
                  groups={groups}
                  menuLabel={dict.common.menu}
                  closeLabel={dict.common.close}
                />
                <Link
                  href="/admin"
                  className="flex items-center gap-2 lg:hidden"
                >
                  <Emblem variant="small" className="size-7" />
                  <span className="font-display text-sm font-bold tracking-[0.14em] text-ro-ink">
                    {brand}
                  </span>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm sm:gap-3">
                <Link
                  href="/admin/inbox"
                  className="ro-icon-btn relative"
                  aria-label={a.inbox}
                >
                  <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />
                  <ChromeBadge
                    value={unreadInbox}
                    className="absolute end-1 top-1 flex min-w-[1.05rem] items-center justify-center rounded-full bg-[var(--ro-plum-900)] px-1 text-[0.6rem] font-bold text-[var(--ro-sand-50)]"
                  />
                </Link>
                <AdminLocaleToggle
                  locale={locale}
                  label={dict.common.language}
                  tone="on-light"
                />
                <span className="hidden items-center gap-1.5 rounded-[var(--ro-r-sm)] border border-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-50)_90%,var(--ro-plum-50))] px-2.5 py-1.5 font-semibold text-ro-ink sm:inline-flex">
                  <UserRound className="size-3.5 text-[var(--ro-plum-800)]" aria-hidden />
                  <span className="max-w-[12rem] truncate text-xs sm:text-sm">
                    {session.email}
                  </span>
                </span>
                <form action={adminLogoutAction}>
                  <button
                    type="submit"
                    className="ro-icon-btn"
                    aria-label={a.logout}
                  >
                    <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
                    <span className="hidden sm:inline">{a.logout}</span>
                  </button>
                </form>
              </div>
            </header>
            <main
              id="main-content"
              className="ro-portal-main-enter mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 has-[[data-admin-inbox]]:max-w-none has-[[data-admin-inbox]]:px-3 has-[[data-admin-inbox]]:py-4 sm:px-6 lg:px-8"
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </AppToast>
  );
}
