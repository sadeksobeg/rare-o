/**
 * Destinations a customer may actually pick: only countries / governorates the
 * admin has priced (at least one active rate). The other ~200 ISO countries are
 * not offered — they would only lead to «request a quote» dead ends.
 */
import { prisma } from "@/lib/db/prisma";
import type { DestinationOption } from "@/lib/shipping/destination-options";

let cache: { at: number; value: DestinationOption[] } | null = null;
const TTL_MS = 60_000;

export function clearDestinationsCacheForTests() {
  cache = null;
}

export async function listAvailableDestinations(): Promise<DestinationOption[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const rows = await prisma.shippingCountry.findMany({
    where: { active: true, rates: { some: { active: true } } },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    select: { code: true, nameAr: true, nameEn: true, region: true },
  });
  const syria = rows.filter((r) => r.region === "syria");
  const intl = rows
    .filter((r) => r.region !== "syria")
    .sort((a, b) => (a.nameEn || a.code).localeCompare(b.nameEn || b.code));
  const value: DestinationOption[] = [...syria, ...intl].map((r) => ({
    code: r.code,
    nameAr: r.nameAr,
    nameEn: r.nameEn || r.nameAr,
    flag: r.region === "syria" ? "SY" : r.code,
    kind: r.region === "syria" ? "syria" : "intl",
  }));
  cache = { at: Date.now(), value };
  return value;
}
