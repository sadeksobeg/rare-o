"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
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
    <nav aria-label={navLabel} className="rad-tn">
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
    <nav aria-label={navLabel} className="rad-tabbar">
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

let audioCtx: AudioContext | null = null;
/** Soft two-note chime (WebAudio, no asset). Silent if the browser blocks audio. */
async function chime() {
  try {
    const AC = window.AudioContext;
    if (!AC) return;
    audioCtx = audioCtx ?? new AC();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    const t0 = audioCtx.currentTime;
    [660, 880].forEach((f, i) => {
      const o = audioCtx!.createOscillator();
      const g = audioCtx!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + i * 0.14);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + i * 0.14 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.14 + 0.3);
      o.connect(g).connect(audioCtx!.destination);
      o.start(t0 + i * 0.14);
      o.stop(t0 + i * 0.14 + 0.32);
    });
  } catch {
    /* sound is optional */
  }
}

const POLL_MS = 8000;

/**
 * Trader-wide live alerts: a new message from the team or a new notification shows a
 * toast + chime and refreshes the header badges — on every trader page, not just /trader/messages.
 */
export function TraderLiveAlerts({
  initialMessages,
  initialNotifications,
  locale,
}: {
  initialMessages: number;
  initialNotifications: number;
  locale: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const seen = useRef({ m: initialMessages, n: initialNotifications });
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const ar = locale === "ar";

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/api/trader/messages/cursor", { credentials: "same-origin", cache: "no-store" });
          if (res.ok) {
            const d = (await res.json()) as { unreadCount?: number; notificationsUnread?: number };
            const m = d.unreadCount ?? 0;
            const n = d.notificationsUnread ?? 0;
            const onMessages = pathRef.current.startsWith("/trader/messages");
            let changed = false;
            if (m > seen.current.m && !onMessages) {
              void chime();
              toast(ar ? "رسالة جديدة من فريق RARE OUD" : "New message from the RARE OUD team", {
                action: { label: ar ? "فتح" : "Open", onClick: () => router.push("/trader/messages") },
              });
              changed = true;
            }
            if (n > seen.current.n) {
              if (m <= seen.current.m) void chime();
              toast(ar ? "إشعار جديد" : "New notification", {
                action: { label: ar ? "عرض" : "View", onClick: () => router.push("/trader/notifications") },
              });
              changed = true;
            }
            if (m !== seen.current.m || n !== seen.current.n) changed = true;
            seen.current = { m, n };
            if (changed) router.refresh();
          }
        } catch {
          /* offline — next tick */
        }
      }
      timer = setTimeout(tick, POLL_MS);
    }

    timer = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router, ar]);

  return null;
}
