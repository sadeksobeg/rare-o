import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getStatusMeta, type StatusTone } from "@/lib/ui/status";

export type StatusDomain = "retail" | "deal" | "wholesale" | "trader" | "offer";

/** Localised label for a raw status value; falls back to the raw value. */
export function getStatusLabel(
  dict: Dictionary,
  domain: StatusDomain,
  value: string
): string {
  return dict.adminUi.status[domain][value] ?? value;
}

/** Tone + localised label for a status chip. */
export function getStatusChipProps(
  dict: Dictionary,
  domain: StatusDomain,
  value: string
): { tone: StatusTone; label: string } {
  const label = getStatusLabel(dict, domain, value);
  if (domain === "trader") {
    return { tone: value === "active" ? "success" : "closed", label };
  }
  if (domain === "offer") {
    return {
      tone:
        value === "published"
          ? "success"
          : value === "unpublished"
            ? "closed"
            : "neutral",
      label,
    };
  }
  return { tone: getStatusMeta(domain, value).tone, label };
}
