/**
 * Admin inbox SSE — LISTEN rareoud_wa_inbox + Last-Event-ID resume.
 * Never streams phones, QR, or session material.
 */

import { Client } from "pg";

import { requireAdminSession } from "@/lib/auth/admin-session";
import {
  INBOX_NOTIFY_CHANNEL,
  listInboxEventsAfter,
  loadInboxEventById,
  type PublishedInboxEvent,
} from "@/lib/whatsapp/messaging/inbox-events";
import { mapAdminSessionErrorToSseStatus } from "@/lib/whatsapp/messaging/inbox-sse-auth";
import {
  releaseInboxSseSlot,
  tryAcquireInboxSseSlot,
} from "@/lib/whatsapp/messaging/sse-session-cap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** nginx / reverse-proxy idle; keep comment heartbeats under typical 60s timeouts. */
const HEARTBEAT_MS = 25_000;

function sseFormat(event: PublishedInboxEvent): string {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify({
    id: event.id,
    type: event.type,
    payload: event.payload,
    createdAt: event.createdAt,
  })}\n\n`;
}

export async function GET(req: Request): Promise<Response> {
  let sessionSub: string;
  try {
    const session = await requireAdminSession();
    sessionSub = session.sub;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const status = mapAdminSessionErrorToSseStatus(msg);
    return new Response(status === 403 ? "Forbidden" : "Unauthorized", {
      status,
    });
  }

  if (!tryAcquireInboxSseSlot(sessionSub)) {
    return new Response("Too Many Connections", { status: 429 });
  }

  const url = new URL(req.url);
  const afterParam =
    req.headers.get("Last-Event-ID")?.trim() ||
    url.searchParams.get("after")?.trim() ||
    null;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    releaseInboxSseSlot(sessionSub);
    return new Response("Database unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let client: Client | null = null;
  let slotReleased = false;

  const releaseSlotOnce = () => {
    if (slotReleased) return;
    slotReleased = true;
    releaseInboxSseSlot(sessionSub);
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      try {
        const missed = await listInboxEventsAfter(afterParam, 200);
        for (const ev of missed) {
          send(sseFormat(ev));
        }

        client = new Client({ connectionString: databaseUrl });
        await client.connect();
        await client.query(`LISTEN ${INBOX_NOTIFY_CHANNEL}`);

        client.on("notification", async (msg) => {
          if (closed) return;
          const eventId = msg.payload?.trim();
          if (!eventId) return;
          try {
            const ev = await loadInboxEventById(eventId);
            if (ev) send(sseFormat(ev));
          } catch {
            // ignore single-event load failures
          }
        });

        client.on("error", () => {
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              /* ignore */
            }
          }
          releaseSlotOnce();
        });

        heartbeat = setInterval(() => {
          send(`: ping ${Date.now()}\n\n`);
        }, HEARTBEAT_MS);

        send(`: connected\n\n`);
      } catch {
        closed = true;
        try {
          controller.error(new Error("SSE setup failed"));
        } catch {
          /* ignore */
        }
        if (client) {
          try {
            await client.end();
          } catch {
            /* ignore */
          }
        }
        releaseSlotOnce();
      }
    },
    async cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (client) {
        try {
          await client.end();
        } catch {
          /* ignore */
        }
      }
      releaseSlotOnce();
    },
  });

  req.signal.addEventListener("abort", () => {
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    void client?.end().catch(() => undefined);
    releaseSlotOnce();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
