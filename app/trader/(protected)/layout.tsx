import TraderShell from "@/components/trader/shell";

export default async function TraderProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TraderShell>{children}</TraderShell>;
}
