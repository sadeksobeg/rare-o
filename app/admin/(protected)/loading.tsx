import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2 border-b border-ro-line pb-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
