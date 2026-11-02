"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { UserRound } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { spawnPressRipple } from "@/components/motion/press-ripple";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type InboxListRow = {
  id: string;
  displayLabel: string;
  preview: string;
  whenLabel: string;
  linkLabel: string;
  linked: boolean;
  hasUnread: boolean;
  unreadCount: number;
  /** Lowercase haystack for name/phone search */
  searchText: string;
};

type TabId = "all" | "unread" | "linked" | "unlinked";

/**
 * A13 — ConversationList with filter tabs + name/phone search.
 * Selected row: plum-50 + axis edge. Newest first (caller order).
 */
export function InboxConversationList({
  rows,
  dict,
}: {
  rows: InboxListRow[];
  dict: Dictionary;
}) {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const activeId = params?.id;
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabId>(
    initialTab === "unread" ||
      initialTab === "linked" ||
      initialTab === "unlinked"
      ? initialTab
      : "all"
  );
  const [q, setQ] = useState("");
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const seenRef = useRef<Set<string> | null>(null);
  const i = dict.inbox;

  useEffect(() => {
    const ids = rows.map((r) => r.id);
    if (!seenRef.current) {
      seenRef.current = new Set(ids);
      return;
    }
    const fresh = ids.filter((id) => !seenRef.current!.has(id));
    for (const id of ids) seenRef.current.add(id);
    if (fresh.length === 0) return;
    setFlashIds(new Set(fresh));
    const t = window.setTimeout(() => setFlashIds(new Set()), 450);
    return () => window.clearTimeout(t);
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "unread" && !(r.hasUnread && r.id !== activeId)) return false;
      if (tab === "linked" && !r.linked) return false;
      if (tab === "unlinked" && r.linked) return false;
      if (needle && !r.searchText.includes(needle)) return false;
      return true;
    });
  }, [rows, tab, q, activeId]);

  const tabCounts: Record<TabId, number> = {
    all: rows.length,
    unread: rows.filter((r) => r.hasUnread).length,
    linked: rows.filter((r) => r.linked).length,
    unlinked: rows.filter((r) => !r.linked).length,
  };
  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: i.tabAll },
    { id: "unread", label: i.tabUnread },
    { id: "linked", label: i.tabLinked },
    { id: "unlinked", label: i.tabUnlinked },
  ];

  return (
    <aside
      aria-label={i.conversations}
      data-inbox-pane="list"
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-1 flex-col border border-ro-border bg-ro-paper",
        // <1024: hide list when a thread is open (two-screen pattern)
        activeId ? "hidden lg:flex" : "flex"
      )}
    >
      <div className="shrink-0 space-y-2 border-b border-ro-border p-3">
        <div
          role="tablist"
          aria-label={i.conversations}
          className="flex gap-1 overflow-x-auto"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 px-2.5 py-1.5 text-xs font-semibold transition-colors",
                tab === t.id
                  ? "bg-[var(--ro-plum-900)] text-[var(--ro-sand-100)]"
                  : "text-ro-text-2 hover:bg-ro-sunken hover:text-ro-ink"
              )}
            >
              {t.label}
              <span className="ms-1 tabular-nums opacity-80">
                <CountUp value={tabCounts[t.id]} durationMs={200} />
              </span>
            </button>
          ))}
        </div>
        <label className="block">
          <span className="sr-only">{i.searchPlaceholder}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={i.searchPlaceholder}
            className="w-full border border-ro-border bg-ro-canvas px-3 py-2 text-sm"
          />
        </label>
        <p className="text-xs text-ro-muted" aria-live="polite">
          {filtered.length}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <DrawIn durationMs={800} className="size-16">
              <RosetteMark width={64} height={64} />
            </DrawIn>
            <p className="text-sm text-ro-muted">{i.empty}</p>
          </div>
        ) : (
          <ul className="divide-y divide-ro-border">
            {filtered.map((c) => {
              const active = c.id === activeId;
              const unread = c.hasUnread && !active;
              return (
                <li key={c.id}>
                  <Link
                    href={`/admin/inbox/${c.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "ro-press-ripple relative flex gap-3 border-s-2 p-3 transition-colors hover:bg-ro-sunken",
                      active
                        ? "border-s-[var(--ro-plum-900)] bg-[var(--ro-plum-50)]"
                        : "border-s-transparent",
                      unread && "bg-[color-mix(in_srgb,var(--ro-plum-50)_35%,transparent)]",
                      flashIds.has(c.id) && "ro-s10-flash"
                    )}
                    onPointerDown={(e) => {
                      spawnPressRipple(e.currentTarget, e.clientX, e.clientY);
                    }}
                  >
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]"
                    >
                      <UserRound className="size-4" strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "min-w-0 truncate text-sm",
                            unread ? "font-bold text-ro-ink" : "font-medium"
                          )}
                        >
                          <bdi>{c.displayLabel}</bdi>
                        </span>
                        <span className="shrink-0 text-[11px] text-ro-muted">
                          {c.whenLabel}
                        </span>
                      </span>
                      <span className="block truncate text-sm text-ro-muted">
                        <bdi>{c.preview}</bdi>
                      </span>
                      <span className="flex flex-wrap items-center gap-2 text-[11px] text-ro-muted">
                        {unread ? (
                          <span className="inline-flex items-center gap-1">
                            <span
                              aria-hidden
                              className="size-1.5 rounded-full bg-[var(--ro-plum-900)]"
                            />
                            {i.unread}
                            {c.unreadCount > 1 ? ` (${c.unreadCount})` : ""}
                          </span>
                        ) : null}
                        <span className="rounded-[var(--ro-r-sm)] border border-ro-border px-1.5 py-0.5">
                          {c.linkLabel}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
