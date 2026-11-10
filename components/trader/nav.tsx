"use client";

import { usePathname } from "next/navigation";
import { LiveBadge } from "@/components/motion/live-badge";
import {
  Compass,
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
  icon: "home" | "deals" | "wholesale" | "brokerage" | "offers" | "profile";
  waiting?: number;
};

const icons = {
  home: Home,
  deals: Handshake,
  wholesale: Package,
  brokerage: Compass,
  offers: Sparkles,
  profile: UserRound,
};

function isActive(pathname: string, tab: TraderTab) {
  if (tab.match === "exact") return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function TraderDesktopNav({
  tabs,
  navLabel,
}: {
  tabs: TraderTab[];
  tone?: "on-light" | "on-dark";
  navLabel: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={navLabel} className="rad-tn hidden items-center gap-1 md:flex">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab);
        const Icon = icons[tab.icon];
        return (
          <PendingNavLink
            key={tab.href}
            href={tab.href}
            data-active={active ? "true" : undefined}
            className={cn("rad-tn-a", active && "rad-on")}
          >
            <Icon className="rad-ic" width={18} height={18} strokeWidth={1.5} aria-hidden />
            {tab.label}
            {tab.waiting && tab.waiting > 0 ? (
              <LiveBadge value={tab.waiting} className="rad-tn-badge" />
            ) : null}
          </PendingNavLink>
        );
      })}
    </nav>
  );
}

export function TraderBottomTabs({
  tabs,
  navLabel,
}: {
  tabs: TraderTab[];
  navLabel: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={navLabel} className="rad-tabbar md:hidden">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab);
        const Icon = icons[tab.icon];
        return (
          <PendingNavLink
            key={tab.href}
            href={tab.href}
            data-active={active ? "true" : undefined}
            className={cn(active && "rad-on")}
          >
            {tab.waiting && tab.waiting > 0 && !active ? (
              <LiveBadge value={tab.waiting} className="rad-tabbar-badge" />
            ) : null}
            <Icon width={20} height={20} strokeWidth={1.5} aria-hidden />
            <span>{tab.label}</span>
          </PendingNavLink>
        );
      })}
    </nav>
  );
}
