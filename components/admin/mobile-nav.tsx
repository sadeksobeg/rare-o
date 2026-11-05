"use client";

import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { AdminMobileTabBar } from "@/components/admin/mobile-tab-bar";
import { NavList, type AdminNavGroup } from "@/components/admin/nav";
import { Emblem } from "@/components/brand";
import { usePortalTheme } from "@/components/portal/portal-theme";
import { cn } from "@/lib/utils";

export function AdminMobileChrome({
  groups,
  menuLabel,
  closeLabel,
  navLabel,
  brand = "RARE OUD",
  footer,
  tabLabels,
  inboxBadge = 0,
}: {
  groups: AdminNavGroup[];
  menuLabel: string;
  closeLabel: string;
  navLabel: string;
  brand?: string;
  footer?: ReactNode;
  tabLabels: {
    home: string;
    inbox: string;
    requests: string;
    products: string;
  };
  inboxBadge?: number;
}) {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<Element | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const titleId = useId();
  const { theme } = usePortalTheme();

  useEffect(() => {
    setHost(document.querySelector(".ro-portal") ?? document.body);
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!host) {
    return (
      <div className="lg:hidden">
        <button
          type="button"
          className="ro-icon-btn size-11 min-h-11 px-0"
          aria-label={menuLabel}
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          className="ro-icon-btn size-11 min-h-11 px-0"
          aria-label={menuLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      {isMobile
        ? createPortal(
            <AdminMobileTabBar
              labels={tabLabels}
              inboxBadge={inboxBadge}
              moreLabel={menuLabel}
              onMore={() => setOpen(true)}
            />,
            host
          )
        : null}

      {isMobile && open
        ? createPortal(
            <div
              className="ro-admin-mobile-drawer fixed inset-0 z-[200] lg:hidden"
              data-theme={theme}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <button
                type="button"
                className="ro-admin-mobile-drawer-scrim absolute inset-0"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
              />
              <aside
                className={cn(
                  "ro-admin-mobile-drawer-panel absolute inset-y-0 start-0 flex w-[min(20.5rem,88vw)] max-w-full flex-col"
                )}
              >
                <div className="flex items-center justify-between gap-3 border-b border-[color:var(--ro-border-subtle)] px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Emblem variant="small" className="size-8 shrink-0" />
                    <div className="min-w-0">
                      <p
                        id={titleId}
                        className="truncate text-xs font-semibold tracking-wide text-[color:var(--ro-text)]"
                      >
                        <bdi dir="ltr">{brand}</bdi>
                      </p>
                      <p className="text-[0.65rem] text-[color:var(--ro-text-muted)]">
                        {menuLabel}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-full border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-raised)] text-[color:var(--ro-text)]"
                    aria-label={closeLabel}
                    onClick={() => setOpen(false)}
                  >
                    <X className="size-5" strokeWidth={1.5} />
                  </button>
                </div>
                <nav
                  aria-label={navLabel}
                  className="flex-1 overflow-y-auto overscroll-contain px-2 py-3"
                >
                  <NavList
                    groups={groups}
                    surface="sheet"
                    onNavigate={() => setOpen(false)}
                  />
                </nav>
                {footer ? (
                  <div className="shrink-0 border-t border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] px-3 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
                    {footer}
                  </div>
                ) : null}
              </aside>
            </div>,
            host
          )
        : null}
    </>
  );
}
