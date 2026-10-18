import { Skeleton } from "@/components/ui/skeleton";

export default function TraderLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2 border-b border-ro-line pb-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
