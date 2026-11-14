"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { InboxEventPayload } from "@/lib/whatsapp/messaging/inbox-events";

type WithId = InboxEventPayload & { eventId: string; createdAt?: string };

export type InboxLiveHandlers = {
  onMessageNew?: (payload: WithId) => void;
  onMessageStatus?: (payload: WithId) => void;
  onConversationUpdated?: (payload: WithId) => void;
  onConnectionState?: (payload: WithId) => void;
};

/**
 * One shared EventSource for the whole tab (ref-counted). The inbox shell and
 * the open thread both subscribe; they must not each open their own stream
 * (server caps SSE slots per admin and a second stream doubles DB listeners).
 */
const subscribers = new Set<{ current: InboxLiveHandlers }>();
let es: EventSource | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let lastEventId: string | null = null;
let attempt = 0;
let started = false;

function dispatch(kind: keyof InboxLiveHandlers, payload: WithId) {
  for (const sub of subscribers) {
    try {
      sub.current[kind]?.(payload);
    } catch {
      /* one bad handler must not break the others */
    }
  }
}

function connect() {
  if (!started || typeof window === "undefined" || !window.EventSource) return;
  const qs = lastEventId ? `?after=${encodeURIComponent(lastEventId)}` : "";
  es = new EventSource(`/api/admin/inbox/events${qs}`);

  const wrap =
    (kind: keyof InboxLiveHandlers) => (ev: MessageEvent) => {
      try {
        const data = JSON.parse(String(ev.data)) as {
          id: string;
          payload: InboxEventPayload;
          createdAt?: string;
        };
        if (data.id?.trim()) lastEventId = data.id.trim();
        dispatch(kind, {
          ...data.payload,
          eventId: data.id,
          createdAt: data.createdAt,
        });
      } catch {
        /* ignore malformed */
      }
    };

  es.addEventListener("message.new", wrap("onMessageNew"));
  es.addEventListener("message.status", wrap("onMessageStatus"));
  es.addEventListener("conversation.updated", wrap("onConversationUpdated"));
  es.addEventListener("connection.state", wrap("onConnectionState"));

  es.onopen = () => {
    attempt = 0;
  };
  es.onerror = () => {
    es?.close();
    es = null;
    if (!started) return;
    attempt += 1;
    // Fast first retries: a dropped stream must not leave the inbox stale for 3s+.
    const delay = Math.min(500 * 2 ** Math.min(attempt - 1, 5), 15_000);
    retryTimer = setTimeout(connect, delay);
  };
}

function start() {
  if (started) return;
  started = true;
  connect();
}

function stop() {
  started = false;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  es?.close();
  es = null;
}

/** When the tab becomes visible again, reconnect immediately if the stream died. */
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && started && !es) {
      if (retryTimer) clearTimeout(retryTimer);
      attempt = 0;
      connect();
    }
  });
}

/**
 * Subscribe to admin inbox SSE. Soft-fails if EventSource unavailable.
 * Resumes from the last seen event id after a reconnect.
 */
export function useInboxEvents(handlers: InboxLiveHandlers, enabled = true) {
  const router = useRouter();
  const handlersRef = useRef<InboxLiveHandlers>(handlers);
  handlersRef.current = {
    ...handlers,
    onConversationUpdated: (p) => {
      handlers.onConversationUpdated?.(p);
      router.refresh();
    },
    onConnectionState: (p) => {
      handlers.onConnectionState?.(p);
      router.refresh();
    },
  };

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.EventSource) {
      return;
    }
    const sub = handlersRef;
    subscribers.add(sub);
    start();
    return () => {
      subscribers.delete(sub);
      if (subscribers.size === 0) stop();
    };
  }, [enabled]);
}
