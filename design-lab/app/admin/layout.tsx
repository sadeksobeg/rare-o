import { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AdminSidebar />
      </Suspense>
      <SidebarInset className="min-w-0">
        <AdminTopbar />
        {/* SidebarInset already renders the page's <main> landmark; a second
            one here would duplicate it (axe: landmark-no-duplicate-main). */}
        <div className="min-w-0 flex-1 overflow-x-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
