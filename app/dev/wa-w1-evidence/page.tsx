import { notFound } from "next/navigation";
import { WaW1EvidenceHarness } from "@/app/dev/wa-w1-evidence/harness";

export const metadata = { title: "dev: WA-W1 evidence harness" };

/**
 * Dev-only visual evidence for WA-W1 review.
 * Simulates worker status progression (flags off / no real send).
 */
export default function WaW1EvidencePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <WaW1EvidenceHarness />;
}
