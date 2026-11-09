"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link2, Search } from "lucide-react";
import type { InboxConversationListItem } from "@/lib/whatsapp/messaging/inbox";
import type { InboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatCompactChatTime } from "@/lib/i18n/format";
import { formatMaskedPhone } from "@/lib/whatsapp/messaging/phone-format";
import { avatarGradientClass, avatarInitial } from "@/components/admin/rad/inbox/avatar-color";
import { RadConnectionSheet } from "@/components/admin/rad/inbox/connection-sheet";
import { useInboxUi } from "@/components/admin/rad/inbox/inbox-shell";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "un" | "lk" | "nl";

export function RadConversationList({
  rows,
  health,
  dict,
  locale,
}: {
  rows: InboxConversationListItem[];
  health: InboxHealthView;
  dict: Dictionary;
  locale: Locale;
}) {
  const ib = dict.ib;
  const { searchRef } = useInboxUi();
  const pathname = usePathname();
  const activeId = pathname.match(/\/admin\/inbox\/([^/]+)/)?.[1] ?? null;
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: ib.filterAll, count: rows.length },
    { key: "un", label: ib.filterUnread, count: rows.filter((r) => r.hasUnread).length },
    { key: "lk", label: ib.filterLinked, count: rows.filter((r) => r.link.linked).length },
    { key: "nl", label: ib.filterUnlinked, count: rows.filter((r) => !r.link.linked).length },
  ];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "un" && !r.hasUnread) return false;
      if (filter === "lk" && !r.link.linked) return false;
      if (filter === "nl" && r.link.linked) return false;
      if (needle) {
        const haystack = `${r.name ?? ""} ${r.displayLabel} ${r.lastMessagePreview}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, filter, q]);

  return (
    <section className="rad-lc" aria-label={ib.searchLabel}>
      <div className="rad-lc-h">
        <div className="rad-lc-t">
          <h1>{dict.inbox.title}</h1>
          <RadConnectionSheet health={health} ib={ib} />
        </div>
        <label className="rad-sb2">
          <Search width={16} height={16} strokeWidth={1.5} aria-hidden />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ib.searchPlaceholder}
            aria-label={ib.searchLabel}
          />
          <kbd>/</kbd>
        </label>
        <div className="rad-fl" role="tablist">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={cn(filter === f.key && "rad-on")}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <em className="rad-num">{f.count}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="rad-cl" role="listbox" aria-label={ib.searchLabel}>
        {filtered.length === 0 ? (
          <div className="rad-ept" style={{ padding: "50px 20px", minHeight: 260 }}>
            <div>
              <b>{rows.length === 0 ? ib.emptyListTitle : ib.noResultsTitle}</b>
              <p>{rows.length === 0 ? ib.emptyListBody : ib.noResultsBody}</p>
            </div>
          </div>
        ) : (
          filtered.map((r, i) => {
            const title = r.name || formatMaskedPhone(r.participantE164) || r.displayLabel;
            return (
              <Link
                key={r.id}
                href={`/admin/inbox/${r.id}`}
                role="option"
                aria-selected={r.id === activeId}
                className={cn("rad-cv", r.id === activeId && "rad-sel", r.hasUnread && "rad-un")}
                style={{ "--rad-i": i } as React.CSSProperties}
              >
                <span className={cn("rad-avt", avatarGradientClass(r.id))}>
                  {avatarInitial(title)}
                  {r.link.linked ? (
                    <span className="rad-lk" aria-label={ib.filterLinked}>
                      <Link2 width={10} height={10} strokeWidth={2} aria-hidden />
                    </span>
                  ) : null}
                </span>
                <div className="rad-cb">
                  <div className="rad-cr">
                    <b>{r.name ? title : <bdi dir="ltr">{title}</bdi>}</b>
                    <time>{r.lastMessageAt ? formatCompactChatTime(r.lastMessageAt, locale) : ""}</time>
                  </div>
                  <div className="rad-cp">
                    <span>{r.lastMessagePreview}</span>
                    {r.hasUnread ? (
                      <i className="rad-ub" aria-label={`${r.unreadCount}`}>
                        {r.unreadCount}
                      </i>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
