"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageBubble,
  MessageDaySeparator,
} from "@/components/admin/message-bubble";
import { InboxComposer } from "@/components/admin/inbox-composer";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type {
  InboxHealthView,
  InboxMessageItem,
} from "@/lib/whatsapp/messaging/inbox";

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

/**
 * Thread pane: sticky-bottom scroll when at bottom; otherwise "new messages" pill.
 */
export function MessageThread({
  conversationId,
  displayLabel,
  phoneHint,
  messages,
  health,
  dict,
  locale,
  headerExtra,
}: {
  conversationId: string;
  displayLabel: string;
  phoneHint?: string | null;
  messages: InboxMessageItem[];
  health: InboxHealthView;
  dict: Dictionary;
  locale: string;
  headerExtra?: React.ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const prevCount = useRef(messages.length);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      const bottom = dist < 48;
      setAtBottom(bottom);
      if (bottom) setShowNew(false);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (messages.length > prevCount.current) {
      if (atBottom) {
        el.scrollTop = el.scrollHeight;
      } else {
        setShowNew(true);
      }
    } else if (atBottom) {
      el.scrollTop = el.scrollHeight;
    }
    prevCount.current = messages.length;
  }, [messages, atBottom]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversationId]);

  const items: React.ReactNode[] = [];
  let lastDay: string | null = null;
  for (const m of messages) {
    const iso = m.waTimestamp ?? m.createdAt;
    const day = dayKey(iso, locale);
    if (day !== lastDay) {
      items.push(<MessageDaySeparator key={`day-${day}-${m.id}`} label={day} />);
      lastDay = day;
    }
    items.push(
      <MessageBubble
        key={m.id}
        message={m}
        dict={dict}
        timeLabel={timeLabel(iso, locale)}
      />
    );
  }

  return (
    <div
      data-inbox-pane="thread"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[color-mix(in_srgb,var(--ro-sand-100)_70%,var(--ro-sand-50))]"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ro-border bg-ro-paper px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            <bdi>{displayLabel}</bdi>
          </h2>
          {phoneHint ? (
            <p className="truncate text-sm text-ro-muted">
              <bdi>{phoneHint}</bdi>
            </p>
          ) : null}
        </div>
        {headerExtra}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollerRef}
          className="absolute inset-0 space-y-3 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
        >
          {messages.length === 0 ? (
            <p className="py-8 text-center text-base text-ro-muted">
              {dict.inbox.emptyThread}
            </p>
          ) : (
            items
          )}
        </div>
        {showNew ? (
          <button
            type="button"
            className="absolute bottom-3 start-1/2 z-10 -translate-x-1/2 rounded-full bg-[var(--ro-plum-900)] px-3 py-1.5 text-xs font-semibold text-[var(--ro-sand-100)] shadow"
            onClick={() => {
              const el = scrollerRef.current;
              if (el) el.scrollTop = el.scrollHeight;
              setShowNew(false);
            }}
          >
            {dict.inbox.newMessages}
          </button>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-ro-border bg-ro-paper px-4 py-3 ps-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <InboxComposer
          conversationId={conversationId}
          outboundEnabled={health.outboundEnabled}
          connectionState={health.state}
          dict={dict}
        />
      </div>
    </div>
  );
}
