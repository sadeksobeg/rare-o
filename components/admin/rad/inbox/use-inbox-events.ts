"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { InboxEventPayload } from "@/lib/whatsapp/messaging/inbox-events";

export type InboxLiveHandlers = {
  onMessageNew?: (payload: InboxEventPayload & { eventId: string }) => void;
  onMessageStatus?: (payload: InboxEventPayload & { eventId: string }) => void;
  onConversationUpdated?: (payload: InboxEventPayload & { eventId: string }) => void;
  onConnectionState?: (payload: InboxEventPayload & { eventId: string }) => void;
};

/**
 * Subscribe to admin inbox SSE. Soft-fails if EventSource unavailable.
 * Tracks last event id and reconnects with `?after=` (Last-Event-ID resume).
 */
export function useInboxEvents(handlers: InboxLiveHandlers, enabled = true) {
  const router = useRouter();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.EventSource) {
      return;
    }

    let es: EventSource | null = null;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let lastEventId: string | null = null;
    let attempt = 0;

    const rememberId = (id: string | undefined) => {
      if (id && id.trim()) lastEventId = id.trim();
    };

    const connect = () => {
      if (closed) return;
      const qs = lastEventId
        ? `?after=${encodeURIComponent(lastEventId)}`
        : "";
      es = new EventSource(`/api/admin/inbox/events${qs}`);

      const wrap =
        (fn: ((p: InboxEventPayload & { eventId: string }) => void) | undefined) =>
        (ev: MessageEvent) => {
          try {
            const data = JSON.parse(String(ev.data)) as {
              id: string;
              payload: InboxEventPayload;
            };
            rememberId(data.id);
            fn?.({ ...data.payload, eventId: data.id });
          } catch {
            /* ignore malformed */
          }
        };

      es.addEventListener(
        "message.new",
        wrap((p) => handlersRef.current.onMessageNew?.(p))
      );
      es.addEventListener(
        "message.status",
        wrap((p) => handlersRef.current.onMessageStatus?.(p))
      );
      es.addEventListener(
        "conversation.updated",
        wrap((p) => {
          handlersRef.current.onConversationUpdated?.(p);
          router.refresh();
        })
      );
      es.addEventListener(
        "connection.state",
        wrap((p) => {
          handlersRef.current.onConnectionState?.(p);
          router.refresh();
        })
      );

      es.onopen = () => {
        attempt = 0;
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (closed) return;
        attempt += 1;
        const delay = Math.min(3_000 * 2 ** Math.min(attempt - 1, 3), 30_000);
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, [enabled, router]);
}
