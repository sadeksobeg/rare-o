"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type InboxListRow = {
  id: string;
  displayLabel: string;
  preview: string;
  whenLabel: string;
  linkLabel: string;
  hasUnread: boolean;
  unreadCount: number;
};

/**
 * Conversation list pane (left pane of the desktop 3-pane inbox).
 * - Highlights the open conversation (route param) and treats it as read
 *   locally, since the layout is not re-rendered when the thread page marks
 *   the conversation read.
 * - On small screens the list is hidden while a thread is open (list | thread
 *   stacks as two separate screens); on lg+ it is always visible.
 */
export function InboxConversationList({
  rows,
  heading,
  unreadLabel,
  emptyLabel,
}: {
  rows: InboxListRow[];
  heading: string;
  unreadLabel: string;
  emptyLabel: string;
}) {
  const params = useParams<{ id?: string }>();
  const activeId = params?.id;

  return (
    <aside
      aria-label={heading}
      className={cn(
        "min-w-0 lg:block lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto",
        activeId ? "hidden" : "block"
      )}
    >
      {rows.length === 0 ? (
        <p className="border border-ro-line p-6 text-sm text-ro-muted">
          {emptyLabel}
        </p>
      ) : (
        <ul className="divide-y divide-ro-line border border-ro-line bg-ro-paper">
          {rows.map((c) => {
            const active = c.id === activeId;
            const unread = c.hasUnread && !active;
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/inbox/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block space-y-1 border-s-2 p-3 transition-colors hover:bg-ro-sunken",
                    active
                      ? "border-s-[var(--ro-plum-900)] bg-ro-surface"
                      : "border-s-transparent"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "min-w-0 truncate text-sm",
                        unread ? "font-semibold" : "font-medium"
                      )}
                      dir="auto"
                    >
                      {c.displayLabel}
                    </span>
                    <span className="shrink-0 text-xs text-ro-muted">
                      {c.whenLabel}
                    </span>
                  </div>
                  <p className="truncate text-sm text-ro-muted" dir="auto">
                    {c.preview}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ro-muted">
                    {unread ? (
                      <span className="rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-100)] px-2 py-0.5 text-[var(--ro-plum-900)]">
                        {unreadLabel}
                        {c.unreadCount > 1 ? ` (${c.unreadCount})` : ""}
                      </span>
                    ) : null}
                    <span>{c.linkLabel}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
