import { Skeleton } from "@/components/ui-kit";

export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" data-rad-skeleton="">
      <div className="space-y-2 border-b border-[color:var(--rad-bd)] pb-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="h-24" style={{ borderRadius: 14 }} />
        <Skeleton className="h-24" style={{ borderRadius: 14 }} />
        <Skeleton className="h-24" style={{ borderRadius: 14 }} />
        <Skeleton className="h-24" style={{ borderRadius: 14 }} />
      </div>
      <Skeleton className="h-64 w-full" style={{ borderRadius: 14 }} />
    </div>
  );
}
