/**
 * Pure string formatting only — no Node built-ins, no Prisma, safe to import
 * from client components. Kept separate from inbox.ts (which pulls in
 * node:crypto/fs/path via lib/whatsapp/media.ts) specifically so importing
 * this one function doesn't drag a server-only module graph into the
 * browser bundle.
 */
/**
 * Canonical mask: `+CCC D•• ••• XXX` (e.g. `+964 7•• ••• 654`).
 * Digits-only input preferred; already-masked strings are re-normalized.
 */
export function formatMaskedPhone(e164: string | null): string | null {
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 7) return digits ? `+${digits}` : null;
  const cc = digits.slice(0, 3);
  const first = digits.slice(3, 4);
  const last3 = digits.slice(-3);
  return `+${cc} ${first}•• ••• ${last3}`;
}
