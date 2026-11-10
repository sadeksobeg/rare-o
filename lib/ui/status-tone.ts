import type { PillTone } from "@/components/ui-kit";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getStatusMeta } from "@/lib/ui/status";

export type AdminStatusDomain = "retail" | "deal" | "wholesale";

/** Single map: domain status → admin list/detail pill tone. */
export function adminPillToneForStatus(
  domain: AdminStatusDomain,
  status: string
): PillTone {
  return statusToneToPill(getStatusMeta(domain, status).tone);
}
