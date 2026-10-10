"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Handshake,
  Home,
  Package,
  Sparkles,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TraderTab = {
  href: string;
  label: string;
  match: "exact" | "prefix";
  icon: "home" | "deals" | "wholesale" | "offers" | "profile";
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

export function TraderDesktopNav({ tabs }: { tabs: TraderTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Trader" className="hidden items-center gap-1 md:flex">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-3 py-2 text-sm transition-colors",
              active
                ? "font-semibold text-[var(--ro-plum-900)]"
                : "text-ro-muted hover:text-ro-ink"
            )}
          >
            {tab.label}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 bg-[var(--ro-plum-900)]"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function TraderBottomTabs({ tabs }: { tabs: TraderTab[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Trader"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ro-line bg-ro-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = icons[tab.icon];
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[10px]",
                  active
                    ? "font-semibold text-[var(--ro-plum-900)]"
                    : "text-ro-muted"
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute top-1 size-1 rounded-full bg-[var(--ro-plum-900)]"
                  />
                ) : null}
                <Icon className="size-5" aria-hidden />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
