/**
 * Tell a trader something in BOTH channels: the platform inbox (always works)
 * and real WhatsApp (best effort — outbox, kill switch and rate limits apply).
 * Only ever called from an explicit admin action; never throws.
 */
import { siteBaseUrl } from "@/lib/retail-request/order-page";
import { sendWholesaleTraderWhatsApp } from "@/lib/wholesale/trader-wa";
import {
  ensureTraderConversation,
  sendAdminPlatformMessage,
} from "@/lib/whatsapp/messaging/trader-channel";

export function traderPortalUrl(path: string): string {
  return `${siteBaseUrl()}${path}`;
}

export async function notifyTraderChannels(input: {
  traderId: string;
  adminId: string;
  text: string;
}): Promise<{ platform: boolean; whatsapp: "sent" | string }> {
  let platform = false;
  try {
    const conv = await ensureTraderConversation(input.traderId);
    platform = (await sendAdminPlatformMessage({ conversationId: conv.id, adminId: input.adminId, text: input.text })).ok;
  } catch {
    platform = false;
  }
  let whatsapp: "sent" | string = "FAILED";
  try {
    const res = await sendWholesaleTraderWhatsApp({
      traderId: input.traderId,
      adminId: input.adminId,
      text: input.text,
    });
    whatsapp = res.ok ? "sent" : res.error;
  } catch {
    whatsapp = "FAILED";
  }
  return { platform, whatsapp };
}
