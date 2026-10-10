/**
 * WhatsApp JID / phone normalization helpers.
 * Used by the Baileys adapter — no Baileys types exported.
 */

/** Digits-only E.164 (no +). Returns null if invalid length. */
export function toE164Digits(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/**
 * Normalize admin/outbound chat target to a WhatsApp user JID.
 * Accepts existing JIDs (`…@s.whatsapp.net`) or E.164 digits / +prefixed.
 */
export function normalizeUserJid(waChatId: string): string | null {
  const raw = waChatId.trim();
  if (!raw) return null;

  if (raw.includes("@")) {
    const [user, domain] = raw.split("@");
    if (!user || !domain) return null;
    // Pass through known WhatsApp user / LID forms; reject groups for Stage A text
    if (domain === "g.us") return null;
    return `${user}@${domain}`;
  }

  const digits = toE164Digits(raw);
  if (!digits) return null;
  return `${digits}@s.whatsapp.net`;
}

/** Extract E.164 digits from a remote JID when possible. */
export function e164FromRemoteJid(remoteJid: string): string | null {
  const user = remoteJid.split("@")[0] ?? "";
  // Strip device suffix if present (user:device)
  const base = user.split(":")[0] ?? "";
  return toE164Digits(base);
}
