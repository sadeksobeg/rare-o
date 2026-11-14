/**
 * Public contact details — phone from env; copy from dictionaries.
 */
export function getWhatsAppNumberE164(): string {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_E164 ||
    process.env.WHATSAPP_BUSINESS_E164 ||
    ""
  ).replace(/[^\d]/g, "");
}

/**
 * Same link, but pointing at the WhatsApp account linked in the admin inbox
 * (falls back to the env number). Use this in server components.
 */
export async function whatsAppGreetingLinkAsync(message: string): Promise<string | null> {
  const { resolveBusinessE164OrNull } = await import("@/lib/whatsapp/business-number");
  const n = (await resolveBusinessE164OrNull()) ?? getWhatsAppNumberE164();
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function whatsAppGreetingLink(message: string): string | null {
  const n = getWhatsAppNumberE164();
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
