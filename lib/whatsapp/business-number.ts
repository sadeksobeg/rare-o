/**
 * The number customers/traders are sent to by every wa.me handoff.
 * Priority: the WhatsApp account actually linked in the admin inbox (recorded
 * by the worker on connect) → WHATSAPP_BUSINESS_E164 env. This keeps the
 * storefront pointing at the same number the admin replies from.
 */
import { prisma } from "@/lib/db/prisma";
import { WHATSAPP_CONNECTION_HEALTH_ID } from "@/lib/whatsapp/messaging/constants";

const TTL_MS = 60_000;
let cache: { value: string | null; at: number } | null = null;

function normalize(raw: string | null | undefined): string | null {
  const d = (raw ?? "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15 ? d : null;
}

export function envBusinessE164(): string | null {
  return normalize(process.env.WHATSAPP_BUSINESS_E164);
}

export function clearBusinessNumberCacheForTests() {
  cache = null;
}

/** Digits only (no +). Throws the same codes as the env-only helper when none is set. */
export async function resolveBusinessE164(): Promise<string> {
  const now = Date.now();
  if (!cache || now - cache.at > TTL_MS) {
    let linked: string | null = null;
    try {
      const row = await prisma.whatsAppConnectionHealth.findUnique({
        where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
        select: { connectedPhone: true },
      });
      linked = normalize(row?.connectedPhone);
    } catch {
      linked = null; // DB hiccup must never break a customer's request
    }
    cache = { value: linked, at: now };
  }
  const chosen = cache.value ?? envBusinessE164();
  if (!chosen) {
    const raw = process.env.WHATSAPP_BUSINESS_E164?.trim();
    throw new Error(raw ? "WHATSAPP_BUSINESS_E164_INVALID" : "WHATSAPP_BUSINESS_E164_MISSING");
  }
  return chosen;
}

/** Like resolveBusinessE164 but returns null instead of throwing (greeting links). */
export async function resolveBusinessE164OrNull(): Promise<string | null> {
  try {
    return await resolveBusinessE164();
  } catch {
    return null;
  }
}
