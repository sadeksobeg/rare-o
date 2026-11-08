"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handshake, LayoutDashboard, Menu, MessageSquareText, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function RadMobileTabBar({
  labels,
  inboxCount,
  requestsCount,
  onMore,
}: {
  labels: { dashboard: string; inbox: string; requests: string; deals: string; more: string };
  inboxCount: number;
  requestsCount: number;
  onMore: () => void;
}) {
  const pathname = usePathname();
  const is = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="rad-tabbar" aria-label={labels.more}>
      <Link href="/admin" className={cn(is("/admin") && "rad-on")}>
        <LayoutDashboard width={20} height={20} strokeWidth={1.5} aria-hidden />
        {labels.dashboard}
      </Link>
      <Link href="/admin/inbox" className={cn(is("/admin/inbox") && "rad-on")}>
        <MessageSquareText width={20} height={20} strokeWidth={1.5} aria-hidden />
        {labels.inbox}
        {inboxCount > 0 ? <i className="rad-tb rad-num">{inboxCount}</i> : null}
      </Link>
      <Link href="/admin/requests" className={cn(is("/admin/requests") && "rad-on")}>
        <ShoppingBag width={20} height={20} strokeWidth={1.5} aria-hidden />
        {labels.requests}
        {requestsCount > 0 ? <i className="rad-tb rad-num">{requestsCount}</i> : null}
      </Link>
      <Link href="/admin/deals" className={cn(is("/admin/deals") && "rad-on")}>
        <Handshake width={20} height={20} strokeWidth={1.5} aria-hidden />
        {labels.deals}
      </Link>
      <button type="button" onClick={onMore}>
        <Menu width={20} height={20} strokeWidth={1.5} aria-hidden />
        {labels.more}
      </button>
    </nav>
  );
}
