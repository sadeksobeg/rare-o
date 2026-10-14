"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  const activeId = params?.id;
  const [tab, setTab] = useState<TabId>("all");
  const [q, setQ] = useState("");
  const i = dict.inbox;

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
        "flex min-h-0 min-w-0 flex-col border border-ro-border bg-ro-paper",
        // <1024: hide list when a thread is open (two-screen pattern)
        activeId ? "hidden lg:flex" : "flex",
        "lg:max-h-[calc(100vh-11rem)]"
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
          <p className="p-6 text-sm text-ro-muted">{i.empty}</p>
        ) : (
          <ul className="divide-y divide-ro-border">
            {filtered.map((c) => {
              const active = c.id === activeId;
              const unread = c.hasUnread && !active;
              const initial = (c.displayLabel.trim().charAt(0) || "?").toUpperCase();
              return (
                <li key={c.id}>
                  <Link
                    href={`/admin/inbox/${c.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex gap-3 border-s-2 p-3 transition-colors hover:bg-ro-sunken",
                      active
                        ? "border-s-[var(--ro-plum-900)] bg-[var(--ro-plum-50)]"
                        : "border-s-transparent"
                    )}
                  >
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                    >
                      {initial}
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "min-w-0 truncate text-sm",
                            unread ? "font-semibold" : "font-medium"
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
