import { Skeleton } from "@/components/ui/skeleton";

/** SF-02 loading: filter bar + 8 product cards at 4:5. */
export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-48 max-w-full" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="sticky top-[65px] z-10 -mx-3 border-b border-ro-border bg-ro-canvas/95 px-3 sm:-mx-4 sm:px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-28" />
          <Skeleton className="ms-auto h-11 w-44" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-3 w-[45%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
