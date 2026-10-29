import { TraderTopbar } from "@/components/trader/trader-topbar";

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <TraderTopbar />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
