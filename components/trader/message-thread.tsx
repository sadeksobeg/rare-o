"use client";

import { useEffect, useRef } from "react";
import { TraderMessageBubble, TraderMessageDaySeparator } from "@/components/trader/message-bubble";
import { TraderMessageComposer } from "@/components/trader/message-composer";
import type { TraderDict } from "@/lib/ui/trader-labels";
import type { InboxMessageItem } from "@/lib/whatsapp/messaging/inbox";

function dayKey(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function timeLabel(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TraderMessageThread({
  messages,
  locale,
  t,
}: {
  messages: InboxMessageItem[];
  locale: string;
  t: TraderDict;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(messages.length);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el && messages.length !== prevCount.current) {
      el.scrollTop = el.scrollHeight;
    }
    prevCount.current = messages.length;
  }, [messages]);

  const items: React.ReactNode[] = [];
  let lastDay: string | null = null;
  for (const m of messages) {
    const iso = m.waTimestamp ?? m.createdAt;
    const day = dayKey(iso, locale);
    if (day !== lastDay) {
      items.push(<TraderMessageDaySeparator key={`day-${day}-${m.id}`} label={day} />);
      lastDay = day;
    }
    items.push(
      <TraderMessageBubble key={m.id} message={m} timeLabel={timeLabel(iso, locale)} t={t} />
    );
  }

  return (
    <div className="ro-portal-card flex h-[min(70vh,42rem)] flex-col overflow-hidden border">
      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="font-semibold text-ro-ink">{t.messagesEmpty}</p>
            <p className="max-w-xs text-sm text-ro-muted">{t.messagesEmptyBody}</p>
          </div>
        ) : (
          items
        )}
      </div>
      <div className="shrink-0 border-t border-ro-border bg-ro-sunken/40 p-2.5">
        <TraderMessageComposer t={t} />
      </div>
    </div>
  );
}
