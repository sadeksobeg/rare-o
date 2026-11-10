import { RadShellClient } from "@/components/admin/rad/shell-client";
import type { RadNavGroup } from "@/components/admin/rad/sidebar";
import { PortalThemeProvider } from "@/components/portal/portal-theme";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { getRequestDictionary } from "@/lib/i18n/server";

/**
 * Dev-only admin chrome for /dev/ui-kit — no session, no DB counts.
 */
export async function DevUiKitShell({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const ad2 = dict.ad2;
  const promoFeatures = isPromoFeaturesEnabled();

  const groups: RadNavGroup[] = [
    {
      title: dict.common.navOps,
      items: [
        { href: "/admin", label: a.dashboard },
        { href: "/admin/inbox", label: a.inbox, badge: 0 },
        { href: "/admin/requests", label: a.requests, badge: 3 },
        { href: "/admin/deals", label: a.deals },
        { href: "/admin/wholesale", label: a.wholesale },
        { href: "/admin/brokerage", label: a.brokerage, badge: 2 },
      ],
    },
    {
      title: dict.common.navCatalog,
      items: [
        { href: "/admin/products", label: a.products },
        { href: "/admin/categories", label: a.categories },
        { href: "/admin/offers", label: a.offers },
        ...(promoFeatures ? [{ href: "/admin/promos", label: a.promos }] : []),
      ],
    },
    {
      title: dict.common.navPeople,
      items: [
        { href: "/admin/customers", label: a.customers },
        { href: "/admin/traders", label: a.traders },
        { href: "/admin/team", label: a.team },
      ],
    },
    {
      title: dict.common.navSystem,
      items: [
        { href: "/admin/notifications", label: dict.adminUi.notificationsTitle },
        { href: "/admin/settings", label: dict.adminUi.settingsHubTitle },
      ],
    },
  ];

  const pageLabels: Record<string, string> = {
    "/admin": a.dashboard,
    "/admin/inbox": a.inbox,
    "/admin/requests": a.requests,
    "/admin/deals": a.deals,
    "/admin/wholesale": a.wholesale,
    "/admin/brokerage": a.brokerage,
    "/admin/products": a.products,
    "/admin/categories": a.categories,
    "/admin/offers": a.offers,
    "/admin/customers": a.customers,
    "/admin/traders": a.traders,
    "/admin/team": a.team,
    "/admin/settings": dict.adminUi.settingsHubTitle,
    "/admin/notifications": dict.adminUi.notificationsTitle,
  };

  return (
    <PortalThemeProvider defaultTheme="dark" dataPortal="admin" className="contents ro-portal">
      <SonnerToaster />
      <RadShellClient
        groups={groups}
        brand="RARE OUD"
        brandSub={dict.common.adminBrandSub}
        userName={locale === "ar" ? "وضع العرض · Dev" : "Fixture · Dev"}
        userRole={ad2.userRole}
        navLabel={dict.common.navLabelAdmin}
        collapseLabel={ad2.collapseMenu}
        expandLabel={ad2.expandMenu}
        breadcrumbRoot={ad2.breadcrumbAdmin}
        pageTitle="UI Kit"
        searchPlaceholder={ad2.searchPlaceholder}
        searchLabel={dict.admin.commandSearch}
        notificationsLabel={ad2.notifications}
        notificationsCount={0}
        inboxLabel={a.inbox}
        inboxCount={0}
        themeLabel={dict.common.themeLight}
        languageLabel={dict.common.language}
        locale={locale}
        menuLabel={ad2.menuLabel}
        paletteProps={{
          placeholder: ad2.paletteSearchPlaceholder,
          emptyTemplate: ad2.paletteEmpty,
          navGroupLabel: ad2.paletteNavGroup,
          actionsGroupLabel: ad2.paletteActionsGroup,
          navHint: ad2.paletteNav,
          openHint: ad2.paletteOpen,
          closeHint: ad2.paletteClose,
          pageLabels,
          actions: [],
        }}
        mobileTabLabels={{
          dashboard: a.dashboard,
          inbox: a.inbox,
          requests: a.requests,
          deals: a.deals,
          more: ad2.moreTab,
        }}
        mobileRequestsCount={0}
      >
        {children}
      </RadShellClient>
    </PortalThemeProvider>
  );
}
