import { AdminShell } from "@/components/admin/shell";
import { requireAdminSessionOrRedirect } from "@/lib/auth/admin-session";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every protected admin page shares this layout, so this is the one place
  // that guarantees MUST_CHANGE_PASSWORD / SESSION_INVALIDATED / UNAUTHORIZED
  // become a clean redirect instead of falling through to error.tsx. Pages
  // that also call requireAdminSession() themselves hit the same cached
  // result (React's cache()) — no extra DB round trip.
  await requireAdminSessionOrRedirect();
  return <AdminShell>{children}</AdminShell>;
}
