/**
 * Single source of truth for where an admin reply goes. Pure — imported by
 * both the composer (to tell the admin up front) and the send action (to
 * actually route), so the UI can never promise a channel the server won't use.
 *
 *  - WhatsApp is live           → whatsapp
 *  - not live, trader account   → platform (the trader reads /trader/messages)
 *  - not live, no account       → none (nobody would ever read it)
 */
export type ReplyRoute =
  | { channel: "whatsapp" }
  | { channel: "platform"; reason: "wa_unavailable" | "platform_only" }
  | { channel: "none"; reason: "wa_unavailable_no_account" };

export type ReplyRouteInput = {
  /** CONNECTED, outbound enabled, kill switch off */
  whatsappLive: boolean;
  /** Conversation is owned by a trader account that can sign in */
  hasPlatformAccount: boolean;
  /** Synthetic `…@platform.local` thread — there is no WhatsApp JID to send to */
  platformOnly: boolean;
};

export function isPlatformOnlyChatId(waChatId: string): boolean {
  return waChatId.toLowerCase().endsWith("@platform.local");
}

export function isWhatsAppLive(health: {
  state: string;
  outboundEnabled: boolean;
  outboundKillSwitch: boolean;
}): boolean {
  return (
    health.state === "CONNECTED" &&
    health.outboundEnabled &&
    !health.outboundKillSwitch
  );
}

export function resolveReplyRoute(input: ReplyRouteInput): ReplyRoute {
  if (input.platformOnly) {
    return input.hasPlatformAccount
      ? { channel: "platform", reason: "platform_only" }
      : { channel: "none", reason: "wa_unavailable_no_account" };
  }
  if (input.whatsappLive) return { channel: "whatsapp" };
  if (input.hasPlatformAccount) {
    return { channel: "platform", reason: "wa_unavailable" };
  }
  return { channel: "none", reason: "wa_unavailable_no_account" };
}
