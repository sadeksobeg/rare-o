"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { RadSidebar, useRadSidebarCollapsed, type RadNavGroup } from "@/components/admin/rad/sidebar";
import { RadTopbar } from "@/components/admin/rad/topbar";
import type { RadPaletteAction } from "@/components/admin/rad/command-palette";
import { RadMobileTabBar } from "@/components/admin/rad/mobile-tabbar";
import type { Locale } from "@/lib/i18n/config";

const RadCommandPalette = dynamic(
  () =>
    import("@/components/admin/rad/command-palette").then((m) => m.RadCommandPalette),
  { ssr: false }
);

export function RadShellClient({
  groups,
  brand,
  brandSub,
  userName,
  userRole,
  navLabel,
  collapseLabel,
  expandLabel,
  breadcrumbRoot,
  pageTitle,
  searchPlaceholder,
  searchLabel,
  notificationsLabel,
  notificationsCount,
  inboxLabel,
  inboxCount,
  themeLabel,
  languageLabel,
  locale,
  menuLabel,
  paletteProps,
  mobileTabLabels,
  mobileRequestsCount,
  children,
}: {
  groups: RadNavGroup[];
  brand: string;
  brandSub: string;
  userName: string;
  userRole: string;
  navLabel: string;
  collapseLabel: string;
  expandLabel: string;
  breadcrumbRoot: string;
  pageTitle: string;
  searchPlaceholder: string;
  searchLabel: string;
  notificationsLabel: string;
  notificationsCount: number;
  inboxLabel: string;
  inboxCount: number;
  themeLabel: string;
  languageLabel: string;
  locale: Locale;
  menuLabel: string;
  paletteProps: {
    placeholder: string;
    emptyTemplate: string;
    navGroupLabel: string;
    actionsGroupLabel: string;
    navHint: string;
    openHint: string;
    closeHint: string;
    pageLabels: Record<string, string>;
    actions: RadPaletteAction[];
  };
  mobileTabLabels: { dashboard: string; inbox: string; requests: string; deals: string; more: string };
  mobileRequestsCount: number;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useRadSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMounted, setPaletteMounted] = useState(false);
  useEffect(() => {
    if (paletteOpen) setPaletteMounted(true);
  }, [paletteOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`rad-root rad-app${collapsed ? " rad-col" : ""}${mobileOpen ? " rad-open" : ""}`}>
      <RadSidebar
        groups={groups}
        brand={brand}
        brandSub={brandSub}
        userName={userName}
        userRole={userRole}
        navLabel={navLabel}
        collapseLabel={collapseLabel}
        expandLabel={expandLabel}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
      />
      <div
        className="rad-scrim"
        onClick={() => setMobileOpen(false)}
        role="presentation"
      />
      <div className="rad-main">
        <RadTopbar
          breadcrumbRoot={breadcrumbRoot}
          pageTitle={pageTitle}
          searchPlaceholder={searchPlaceholder}
          searchLabel={searchLabel}
          notificationsLabel={notificationsLabel}
          notificationsCount={notificationsCount}
          inboxLabel={inboxLabel}
          inboxCount={inboxCount}
          themeLabel={themeLabel}
          languageLabel={languageLabel}
          locale={locale}
          menuLabel={menuLabel}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main id="main-content" className="rad-page">
          {children}
        </main>
      </div>
      <RadMobileTabBar
        labels={mobileTabLabels}
        inboxCount={inboxCount}
        requestsCount={mobileRequestsCount}
        onMore={() => setMobileOpen(true)}
      />
      {paletteMounted ? (
        <RadCommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          placeholder={paletteProps.placeholder}
          emptyTemplate={paletteProps.emptyTemplate}
          navGroupLabel={paletteProps.navGroupLabel}
          actionsGroupLabel={paletteProps.actionsGroupLabel}
          navHint={paletteProps.navHint}
          openHint={paletteProps.openHint}
          closeHint={paletteProps.closeHint}
          pageLabels={paletteProps.pageLabels}
          actions={paletteProps.actions}
        />
      ) : null}
    </div>
  );
}
