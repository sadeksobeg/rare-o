import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="min-w-0">
        <AdminTopbar />
        <main className="min-w-0 flex-1 overflow-x-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
