/**
 * WhatsApp JID / phone normalization helpers.
 * Used by the Baileys adapter — no Baileys types exported.
 *
 * Note: modern WhatsApp often addresses chats as `@lid` (anonymous id).
 * Those digits are NOT phone numbers — never treat them as E.164.
 */

/** Digits-only E.164 (no +). Returns null if invalid length. */
export function toE164Digits(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function jidServer(jid: string): string {
  return (jid.split("@")[1] ?? "").trim().toLowerCase();
}

export function jidUser(jid: string): string {
  const user = jid.split("@")[0] ?? "";
  return (user.split(":")[0] ?? "").trim();
}

export function isLidJid(jid: string): boolean {
  return jidServer(jid) === "lid";
}

export function isPhoneUserJid(jid: string): boolean {
  const server = jidServer(jid);
  return server === "s.whatsapp.net" || server === "c.us";
}

/**
 * Normalize admin/outbound chat target to a WhatsApp user JID.
 * Accepts existing JIDs (`…@s.whatsapp.net`, `…@lid`) or E.164 digits / +prefixed.
 */
export function normalizeUserJid(waChatId: string): string | null {
  const raw = waChatId.trim();
  if (!raw) return null;

  if (raw.includes("@")) {
    const [user, domain] = raw.split("@");
    if (!user || !domain) return null;
    // Pass through known WhatsApp user / LID forms; reject groups
    if (domain === "g.us") return null;
    return `${user}@${domain}`;
  }

  const digits = toE164Digits(raw);
  if (!digits) return null;
  return `${digits}@s.whatsapp.net`;
}

/**
 * Extract E.164 digits from a remote JID when it is a real phone JID.
 * Returns null for `@lid` and other non-phone forms (never invent a number).
 */
export function e164FromRemoteJid(remoteJid: string): string | null {
  if (!isPhoneUserJid(remoteJid)) return null;
  return toE164Digits(jidUser(remoteJid));
}

/** Prefer a PN hint (`sender_pn` / contact.jid) over a LID chat id. */
export function e164FromPnHint(pnJidOrDigits: string | null | undefined): string | null {
  if (!pnJidOrDigits?.trim()) return null;
  const raw = pnJidOrDigits.trim();
  if (raw.includes("@")) return e164FromRemoteJid(raw);
  return toE164Digits(raw);
}

/**
 * True when stored "phone" is actually the LID user part (legacy bug).
 * Used to clear bad participantE164 rows.
 */
export function isE164LikelyLidMirror(
  participantE164: string | null | undefined,
  waChatId: string
): boolean {
  if (!participantE164 || !isLidJid(waChatId)) return false;
  return participantE164.replace(/\D/g, "") === jidUser(waChatId);
}
