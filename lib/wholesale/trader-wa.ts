/**
 * Real WhatsApp message to a trader about their wholesale request.
 * Only ever the result of an explicit admin action; goes through the normal
 * outbox (kill switch, rate limits, route resolver all apply). The trader also
 * always gets the in-portal notification — this is the extra WhatsApp nudge.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { normalizePhoneDigits } from "@/lib/validation/customer-identity";
import { siteBaseUrl } from "@/lib/retail-request/order-page";
import { enqueueOutboundText } from "@/lib/whatsapp/messaging/service";
import { getInboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import { isWhatsAppLive } from "@/lib/whatsapp/messaging/reply-route";

export type TraderWaResult =
  | { ok: true }
  | { ok: false; error: "NO_CONVERSATION" | "WHATSAPP_DOWN" | "BLOCKED" | "RATE_LIMITED" | "FAILED" };

export function traderRequestUrl(requestId: string): string {
  return `${siteBaseUrl()}/trader/wholesale/${requestId}`;
}

export type WholesaleWaEvent = "quote" | "confirmed" | "completed" | "cancelled" | "shipped" | "review";

export function buildWholesaleTraderMessage(input: {
  event: WholesaleWaEvent;
  name: string;
  reference: string;
  link: string;
  shipping?: { carrier: string; tracking: string } | null;
}): string {
  const first = input.name.trim().split(/\s+/)[0] || input.name;
  const tail = `\nتفاصيل الطلب: ${input.link}`;
  switch (input.event) {
    case "review":
      return `أهلاً ${first}، بدأنا مراجعة طلب الجملة ${input.reference}.${tail}`;
    case "quote":
      return `أهلاً ${first}، جهّزنا عرض سعر لطلب الجملة ${input.reference}. يرجى مراجعته وقبوله أو رفضه من بوابتك.${tail}`;
    case "confirmed":
      return `أهلاً ${first}، تم تأكيد طلب الجملة ${input.reference}. سنتواصل معك لترتيب التفاصيل.${tail}`;
    case "shipped":
      return `أهلاً ${first}، شُحن طلب الجملة ${input.reference}${
        input.shipping ? ` عبر ${input.shipping.carrier} — رقم التتبع: ${input.shipping.tracking}` : ""
      }.${tail}`;
    case "completed":
      return `أهلاً ${first}، اكتمل طلب الجملة ${input.reference}. شكراً لتعاملك مع RARE OUD.${tail}`;
    case "cancelled":
      return `أهلاً ${first}، أُلغي طلب الجملة ${input.reference}. للاستفسار راسلنا هنا.${tail}`;
  }
}

async function findTraderChat(trader: { id: string; phone: string }) {
  const select = { id: true, waChatId: true, blockedAt: true } as const;
  const own = await prisma.whatsAppConversation.findFirst({
    where: { traderId: trader.id, NOT: { waChatId: { contains: "@platform.local" } } },
    orderBy: { lastMessageAt: "desc" },
    select,
  });
  if (own) return own;
  const tail = normalizePhoneDigits(trader.phone).slice(-9);
  if (tail.length < 8) return null;
  return prisma.whatsAppConversation.findFirst({
    where: {
      participantE164: { endsWith: tail },
      OR: [{ traderId: trader.id }, { traderId: null }],
      NOT: { waChatId: { contains: "@platform.local" } },
    },
    orderBy: { lastMessageAt: "desc" },
    select,
  });
}

export async function sendWholesaleTraderWhatsApp(input: {
  traderId: string;
  text: string;
  adminId: string;
}): Promise<TraderWaResult> {
  const trader = await prisma.traderAccount.findUnique({
    where: { id: input.traderId },
    select: { id: true, phone: true },
  });
  if (!trader) return { ok: false, error: "NO_CONVERSATION" };
  const chat = await findTraderChat(trader);
  if (!chat) return { ok: false, error: "NO_CONVERSATION" };
  if (chat.blockedAt) return { ok: false, error: "BLOCKED" };
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
  return { ok: true };
}
