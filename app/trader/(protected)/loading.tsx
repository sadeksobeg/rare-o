import { Skeleton } from "@/components/ui/skeleton";

export default function TraderLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
