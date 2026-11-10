import type { PillTone } from "@/components/ui-kit";
import type { StatusTone } from "@/lib/ui/status";

export function statusToneToPill(tone: StatusTone): PillTone {
  switch (tone) {
    case "info":
      return "new";
    case "progress":
      return "info";
    case "attention":
      return "warn";
    case "success":
      return "ok";
    case "danger":
      return "err";
    case "closed":
    case "neutral":
      return "no";
    default:
      return "no";
  }
}
