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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseFormat(event: PublishedInboxEvent): string {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify({
    id: event.id,
    type: event.type,
    payload: event.payload,
    createdAt: event.createdAt,
  })}\n\n`;
}

export async function GET(req: Request): Promise<Response> {
  try {
    await requireAdminSession();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const afterParam =
    req.headers.get("Last-Event-ID")?.trim() ||
    url.searchParams.get("after")?.trim() ||
    null;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new Response("Database unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let client: Client | null = null;

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
          // Connection drop ends the stream; client reconnects via EventSource.
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              /* ignore */
            }
          }
        });

        heartbeat = setInterval(() => {
          send(`: ping ${Date.now()}\n\n`);
        }, 15_000);

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
    },
  });

  req.signal.addEventListener("abort", () => {
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    void client?.end().catch(() => undefined);
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
