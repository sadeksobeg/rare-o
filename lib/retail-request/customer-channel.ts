/**
 * Finding / using the WhatsApp chat of a retail request's customer.
 * Sending is only ever the result of an explicit admin action, through the
 * normal outbox (kill switch, rate limits, route resolver all apply).
 */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { normalizePhoneDigits } from "@/lib/validation/customer-identity";
import { enqueueOutboundText } from "@/lib/whatsapp/messaging/service";
import { getInboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import { isWhatsAppLive } from "@/lib/whatsapp/messaging/reply-route";

export type RetailCustomerChat = {
  id: string;
  waChatId: string;
  blocked: boolean;
};

export async function findRetailCustomerConversation(request: {
  id: string;
  customerId: string | null;
  customerPhone: string;
}): Promise<RetailCustomerChat | null> {
  const select = { id: true, waChatId: true, blockedAt: true } as const;
  const linked = await prisma.whatsAppConversation.findFirst({
    where: { linkType: "retail_request", linkId: request.id, traderId: null },
    select,
  });
  const byCustomer =
    linked ??
    (request.customerId
      ? await prisma.whatsAppConversation.findFirst({
          where: { customerId: request.customerId, traderId: null },
          orderBy: { lastMessageAt: "desc" },
          select,
        })
      : null);
  let row = byCustomer;
  if (!row) {
    const tail = normalizePhoneDigits(request.customerPhone).slice(-9);
    if (tail.length >= 8) {
      row = await prisma.whatsAppConversation.findFirst({
        where: { participantE164: { endsWith: tail }, traderId: null },
        orderBy: { lastMessageAt: "desc" },
        select,
      });
    }
  }
  return row ? { id: row.id, waChatId: row.waChatId, blocked: Boolean(row.blockedAt) } : null;
}

export type SendToCustomerResult =
  | { ok: true; conversationId: string; messageId: string }
  | { ok: false; error: "NO_CONVERSATION" | "WHATSAPP_DOWN" | "BLOCKED" | "RATE_LIMITED" | "FAILED" };

export async function sendRetailCustomerMessage(input: {
  request: { id: string; customerId: string | null; customerPhone: string };
  text: string;
  adminId: string;
}): Promise<SendToCustomerResult> {
  const chat = await findRetailCustomerConversation(input.request);
  if (!chat) return { ok: false, error: "NO_CONVERSATION" };
  if (chat.blocked) return { ok: false, error: "BLOCKED" };
  if (!isWhatsAppLive(await getInboxHealthView())) return { ok: false, error: "WHATSAPP_DOWN" };
  const res = await enqueueOutboundText({
    waChatId: chat.waChatId,
    text: input.text.slice(0, 3500),
    clientRequestId: randomUUID(),
    adminId: input.adminId,
    allowCreateConversation: false,
  });
  if (!res.ok) {
    if (res.code === "RATE_LIMITED" || res.code === "SAFETY_CIRCUIT" || res.code === "RECONNECT_COOLDOWN") {
      return { ok: false, error: "RATE_LIMITED" };
    }
    if (res.code === "OUTBOUND_DISABLED") return { ok: false, error: "WHATSAPP_DOWN" };
    return { ok: false, error: "FAILED" };
  }
  return { ok: true, conversationId: res.conversationId, messageId: res.messageId };
}
