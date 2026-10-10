import { TraderShell } from "@/components/trader/shell";

export default function TraderProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TraderShell>{children}</TraderShell>;
}
