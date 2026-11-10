import { prisma } from "@/lib/db/prisma";

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").replace(/^0{2,}/, "");
}

export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (!da || !db || da.length < 7 || db.length < 7) return false;
  return da === db || da.endsWith(db) || db.endsWith(da);
}

export type MatchedWhatsAppConversation = {
  id: string;
  displayName: string | null;
  participantE164: string | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string;
  unreadCount: number;
  linkType: string;
  customerId: string | null;
  traderId: string | null;
};

/** Conversations whose participantE164 matches the given phone (digits only). */
export async function findWhatsAppConversationsForPhone(
  phone: string
): Promise<MatchedWhatsAppConversation[]> {
  const digits = digitsOnly(phone);
  if (digits.length < 7) return [];
  const tail = digits.slice(-8);
  const candidates = await prisma.whatsAppConversation.findMany({
    where: { participantE164: { contains: tail } },
    orderBy: { lastMessageAt: "desc" },
    take: 20,
    select: {
      id: true,
      displayName: true,
      participantE164: true,
      lastMessageAt: true,
      lastMessagePreview: true,
      unreadCount: true,
      linkType: true,
      customerId: true,
      traderId: true,
    },
  });
  return candidates.filter((c) => phonesMatch(c.participantE164, phone));
}

/**
 * Bulk: which of the given entity phones have a matching WhatsApp conversation.
 * Keys are the original phone strings that matched.
 */
export async function phonesWithWhatsAppMatch(
  phones: readonly string[]
): Promise<Set<string>> {
  const unique = [...new Set(phones.map((p) => p.trim()).filter(Boolean))];
  if (unique.length === 0) return new Set();

  const digitMap = new Map<string, string>();
  for (const phone of unique) {
    const d = digitsOnly(phone);
    if (d.length >= 7) digitMap.set(phone, d);
  }
  if (digitMap.size === 0) return new Set();

  const tails = [
    ...new Set([...digitMap.values()].map((d) => d.slice(-8))),
  ];
  const candidates = await prisma.whatsAppConversation.findMany({
    where: {
      OR: tails.map((tail) => ({ participantE164: { contains: tail } })),
    },
    select: { participantE164: true },
    take: 400,
  });

  const matched = new Set<string>();
  for (const [phone, digits] of digitMap) {
    const hit = candidates.some((c) => {
      const p = digitsOnly(c.participantE164);
      if (!p) return false;
      return p === digits || p.endsWith(digits) || digits.endsWith(p);
    });
    if (hit) matched.add(phone);
  }
  return matched;
}
