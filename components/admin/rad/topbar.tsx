"use client";

import {
  BellRing,
  ChevronLeft,
  Languages,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { setLocaleAction } from "@/app/locale-action";
import { usePortalTheme } from "@/components/portal/portal-theme";
import type { Locale } from "@/lib/i18n/config";

export function RadTopbar({
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
  onOpenPalette,
  onOpenMobileMenu,
}: {
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
  onOpenPalette: () => void;
  onOpenMobileMenu: () => void;
}) {
  const { theme, toggle } = usePortalTheme();
  const isDark = theme === "dark";
  const otherLocale = locale === "ar" ? "en" : "ar";

  return (
    <header className="rad-top">
      <button
        type="button"
        className="rad-ib rad-menu-btn"
        aria-label={menuLabel}
        onClick={onOpenMobileMenu}
      >
        <Menu className="rad-ic" width={18} height={18} strokeWidth={1.5} aria-hidden />
      </button>
      <div className="rad-crumb">
        {breadcrumbRoot}
        <ChevronLeft
          className="rad-ic"
          width={14}
          height={14}
          strokeWidth={1.5}
          aria-hidden
          style={{ transform: "scaleX(-1)" }}
        />
        <b>{pageTitle}</b>
      </div>
      <button
        type="button"
        className="rad-search"
        aria-label={searchLabel}
        onClick={onOpenPalette}
      >
        <Search className="rad-ic" width={16} height={16} strokeWidth={1.5} aria-hidden />
        <span>{searchPlaceholder}</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className="rad-tools">
        <Link
          href="/admin/notifications"
          className="rad-ib rad-hide-m"
          data-tip={notificationsLabel}
          aria-label={notificationsLabel}
        >
          <BellRing className="rad-ic" width={18} height={18} strokeWidth={1.5} aria-hidden />
          {notificationsCount > 0 ? (
            <i className="rad-dot rad-num">{notificationsCount}</i>
          ) : null}
        </Link>
        <Link
          href="/admin/inbox"
          className="rad-ib rad-hide-m"
          data-tip={inboxLabel}
          aria-label={inboxLabel}
        >
          <MessageSquareText className="rad-ic" width={18} height={18} strokeWidth={1.5} aria-hidden />
          {inboxCount > 0 ? <i className="rad-dot rad-num">{inboxCount}</i> : null}
        </Link>
        <span className="rad-sep" aria-hidden />
        <button
          type="button"
          className="rad-ib"
          data-tip={themeLabel}
          aria-label={themeLabel}
          aria-pressed={isDark}
          onClick={toggle}
        >
          {isDark ? (
            <Sun className="rad-ic" width={18} height={18} strokeWidth={1.5} aria-hidden />
          ) : (
            <Moon className="rad-ic" width={18} height={18} strokeWidth={1.5} aria-hidden />
          )}
        </button>
        <form action={setLocaleAction} className="rad-hide-m contents">
          <input type="hidden" name="locale" value={otherLocale} />
          <button
            type="submit"
            className="rad-ib"
            data-tip={languageLabel}
            aria-label={languageLabel}
          >
            <Languages className="rad-ic" width={18} height={18} strokeWidth={1.5} aria-hidden />
          </button>
        </form>
      </div>
    </header>
  );
}
