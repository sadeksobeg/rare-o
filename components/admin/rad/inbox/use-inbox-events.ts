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
 * Uses Last-Event-ID resume via the browser EventSource API.
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

    const connect = () => {
      if (closed) return;
      es = new EventSource("/api/admin/inbox/events");

      const wrap =
        (fn: ((p: InboxEventPayload & { eventId: string }) => void) | undefined) =>
        (ev: MessageEvent) => {
          try {
            const data = JSON.parse(String(ev.data)) as {
              id: string;
              payload: InboxEventPayload;
            };
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
          // List order/preview lives on the server RSC tree — light refresh.
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

      es.onerror = () => {
        es?.close();
        es = null;
        if (closed) return;
        retryTimer = setTimeout(connect, 3_000);
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
