/**
 * WhatsApp ↔ Week 3 domain linking constants.
 * Strict allowlist — never accept arbitrary model names from the client.
 */

export const WHATSAPP_LINK_TYPES = [
  "none",
  "retail_request",
  "deal_proposal",
  "wholesale_request",
] as const;

export type WhatsAppLinkType = (typeof WHATSAPP_LINK_TYPES)[number];

/** Active business link targets only (excludes none). */
export const WHATSAPP_ACTIVE_LINK_TYPES = [
  "retail_request",
  "deal_proposal",
  "wholesale_request",
] as const;

export type WhatsAppActiveLinkType =
  (typeof WHATSAPP_ACTIVE_LINK_TYPES)[number];

export const WHATSAPP_LINK_AUDIT_ACTIONS = ["set", "change", "clear"] as const;
export type WhatsAppLinkAuditAction =
  (typeof WHATSAPP_LINK_AUDIT_ACTIONS)[number];

export function isWhatsAppLinkType(value: string): value is WhatsAppLinkType {
  return (WHATSAPP_LINK_TYPES as readonly string[]).includes(value);
}

export function isWhatsAppActiveLinkType(
  value: string
): value is WhatsAppActiveLinkType {
  return (WHATSAPP_ACTIVE_LINK_TYPES as readonly string[]).includes(value);
}
