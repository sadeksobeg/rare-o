import { notFound } from "next/navigation";
import { WaW2EvidenceHarness } from "@/app/dev/wa-w2-evidence/harness";

export const metadata = { title: "dev: WA-W2 evidence harness" };

export default function WaW2EvidencePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <WaW2EvidenceHarness />;
}
