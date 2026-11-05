"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
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
 * Thread pane — WhatsApp Web / Front density; theme-native canvas.
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
      className="ro-inbox-thread flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--ro-bg-sunken)]"
    >
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel,var(--ro-bg-elevated))] px-3 sm:px-4">
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--ro-accent-well)] text-[color:var(--ro-accent-fg)]"
          aria-hidden
        >
          <UserRound className="size-3.5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[13px] font-semibold leading-tight text-[color:var(--ro-text)]">
            <bdi>{displayLabel}</bdi>
          </h2>
          {phoneHint ? (
            <p className="truncate text-[11px] text-[color:var(--ro-text-muted)]">
              <bdi dir="ltr">{phoneHint}</bdi>
            </p>
          ) : null}
        </div>
        {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollerRef}
          className="absolute inset-0 space-y-2 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3 sm:px-5"
        >
          {messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-[color:var(--ro-text-muted)]">
              {dict.inbox.emptyThread}
            </p>
          ) : (
            items
          )}
        </div>
        {showNew ? (
          <button
            type="button"
            className="absolute bottom-3 start-1/2 z-10 -translate-x-1/2 rounded-full bg-[color:var(--ro-plum-700)] px-3 py-1.5 text-xs font-semibold text-[var(--ro-sand-50)] shadow-[var(--ro-e3)]"
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

      <div className="relative z-20 shrink-0 border-t border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel,var(--ro-bg-elevated))] px-3 py-2 ps-[max(0.75rem,env(safe-area-inset-left))] pe-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
