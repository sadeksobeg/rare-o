import TraderShell from "@/components/trader/shell";
import { requireTraderSessionOrRedirect } from "@/lib/auth/trader-session";

export default async function TraderProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every protected trader page shares this layout, so this is the one place
  // that guarantees MUST_CHANGE_PASSWORD / SESSION_INVALIDATED / UNAUTHORIZED
  // become a clean redirect instead of falling through to error.tsx. Pages
  // that also call requireTraderSession() themselves hit the same cached
  // result (React's cache()) — no extra DB round trip.
  await requireTraderSessionOrRedirect();
  return <TraderShell>{children}</TraderShell>;
}
