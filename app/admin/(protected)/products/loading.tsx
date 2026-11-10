import { Skeleton } from "@/components/ui-kit";

export default function AdminProductsLoading() {
  return (
    <section
      data-admin-products=""
      className="space-y-5 pb-2"
      aria-busy="true"
      aria-label="…"
    >
      <div className="rad-phead">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="rad-card rad-cpad overflow-hidden">
        <div className="rad-ch !pb-3.5">
          <Skeleton className="h-9 w-full max-w-xl" style={{ borderRadius: 10 }} />
        </div>
        <div className="rad-tbar">
          <Skeleton className="h-9 w-full max-w-sm" style={{ borderRadius: 11 }} />
        </div>
        <div className="space-y-0 px-4 py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-[color:var(--rad-bd)] py-3"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Skeleton className="!h-14 !w-14" style={{ borderRadius: 10 }} />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="ms-auto h-6 w-16" style={{ borderRadius: 99 }} />
              <Skeleton className="hidden h-4 w-20 md:block" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
