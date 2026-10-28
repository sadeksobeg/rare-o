import { hourInAppTimezone } from "@/lib/i18n/format";
import { fmt } from "@/lib/ui/trader-labels";

const SKIP_NAME = /^(rare|oud|admin|راير|عود|إدارة|ادمن)$/i;

export function greetingGivenName(
  name: string | null | undefined
): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const hit = parts.find((part) => !SKIP_NAME.test(part) && part.length >= 2);
  return hit ?? null;
}

export function greetingHeadline(
  name: string | null | undefined,
  phrases: {
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    greetingNamed: string;
  },
  at = new Date()
): string {
  const hour = hourInAppTimezone(at);
  const phrase =
    hour < 12
      ? phrases.greetingMorning
      : hour < 17
        ? phrases.greetingAfternoon
        : phrases.greetingEvening;
  const given = greetingGivenName(name);
  if (!given) return phrase;
  return fmt(phrases.greetingNamed, { greeting: phrase, name: given });
}
