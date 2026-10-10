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

export function whatsAppGreetingLink(message: string): string | null {
  const n = getWhatsAppNumberE164();
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
