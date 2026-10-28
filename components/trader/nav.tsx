"use client";

import { usePathname } from "next/navigation";
import { LiveBadge } from "@/components/motion/live-badge";
import {
  Handshake,
  Home,
  Package,
  Sparkles,
  UserRound,
} from "lucide-react";
import { PendingNavLink } from "@/components/ui/pending-nav-link";
import { cn } from "@/lib/utils";

export type TraderTab = {
  href: string;
  label: string;
  match: "exact" | "prefix";
  icon: "home" | "deals" | "wholesale" | "offers" | "profile";
  waiting?: number;
};

const icons = {
  home: Home,
  deals: Handshake,
  wholesale: Package,
  offers: Sparkles,
  profile: UserRound,
};

function isActive(pathname: string, tab: TraderTab) {
  if (tab.match === "exact") return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function TraderDesktopNav({
  tabs,
  tone = "on-light",
}: {
  tabs: TraderTab[];
  tone?: "on-light" | "on-dark";
}) {
  const pathname = usePathname();
  const onDark = tone === "on-dark";
  return (
    <nav aria-label="Trader" className="hidden items-center gap-0.5 md:flex">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab);
        const Icon = icons[tab.icon];
        return (
          <PendingNavLink
            key={tab.href}
            href={tab.href}
            data-active={active ? "true" : undefined}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-[color,transform,background-color] duration-[var(--ro-dur-fast)]",
              active
                ? onDark
                  ? "rounded-[var(--ro-r-sm)] bg-[color-mix(in_srgb,var(--ro-sand-100)_14%,transparent)] text-[var(--ro-sand-50)]"
                  : "text-[var(--ro-plum-900)]"
                : onDark
                  ? "text-[color-mix(in_srgb,var(--ro-sand-100)_68%,transparent)] hover:bg-[color-mix(in_srgb,var(--ro-sand-100)_8%,transparent)] hover:text-[var(--ro-sand-50)]"
                  : "text-ro-muted hover:text-[var(--ro-plum-800)]"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform duration-[var(--ro-dur-fast)]",
                active && "scale-110"
              )}
              strokeWidth={1.5}
              aria-hidden
            />
            {tab.label}
            {tab.waiting && tab.waiting > 0 ? (
              <LiveBadge
                value={tab.waiting}
                className="ms-0.5 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-[var(--ro-plum-300)] px-1 text-[0.65rem] font-bold text-[var(--ro-ink-950)]"
              />
            ) : null}
            {active && !onDark ? (
              <span
                aria-hidden
                className="ro-portal-tab-underline absolute inset-x-2 -bottom-px h-0.5 bg-[var(--ro-plum-900)]"
              />
            ) : null}
            {active && onDark ? (
              <span
                aria-hidden
                className="ro-portal-tab-underline absolute inset-x-3 -bottom-0.5 h-0.5 bg-[var(--ro-plum-300)]"
              />
            ) : null}
          </PendingNavLink>
        );
      })}
    </nav>
  );
}

export function TraderBottomTabs({ tabs }: { tabs: TraderTab[] }) {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => isActive(pathname, tab))
  );
  return (
    <nav
      aria-label="Trader"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color-mix(in_srgb,var(--ro-plum-900)_18%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-50)_96%,transparent)] pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_40px_-18px_rgba(50,16,79,0.32)] backdrop-blur-md md:hidden"
    >
      <ul className="relative grid h-16 grid-cols-5">
        <span
          aria-hidden
          className="ro-tab-pill"
          style={{
            width: "20%",
            insetInlineStart: `${activeIndex * 20}%`,
          }}
        />
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = icons[tab.icon];
          return (
            <li key={tab.href} className="relative z-[1]">
              <PendingNavLink
                href={tab.href}
                data-active={active ? "true" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[10px] transition-[color,transform] duration-[var(--ro-dur-fast)]",
                  active
                    ? "font-semibold text-[var(--ro-plum-900)]"
                    : "text-ro-muted"
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute top-1 size-1.5 rounded-full bg-[var(--ro-plum-900)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--ro-plum-900)_20%,transparent)]"
                  />
                ) : tab.waiting && tab.waiting > 0 ? (
                  <LiveBadge
                    value={tab.waiting}
                    className="absolute end-[calc(50%-0.85rem)] top-1 flex min-w-[1rem] items-center justify-center rounded-full bg-[var(--ro-plum-900)] px-1 text-[0.6rem] font-bold leading-none text-[var(--ro-sand-50)]"
                  />
                ) : null}
                <Icon
                  className={cn(
                    "size-5 transition-transform duration-[var(--ro-dur-fast)]",
                    active && "scale-110"
                  )}
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span>{tab.label}</span>
              </PendingNavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
