import { Skeleton } from "@/components/ui-kit";

export default function AdminRequestsLoading() {
  return (
    <section
      data-admin-requests=""
      className="space-y-5 pb-2"
      aria-busy="true"
      aria-label="…"
    >
      <div className="rad-phead">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="rad-card rad-cpad overflow-hidden">
        <div className="rad-ch !pb-3.5">
          <Skeleton className="h-9 w-full max-w-xl" style={{ borderRadius: 10 }} />
        </div>
        <div className="rad-tbar">
          <Skeleton className="h-9 w-full max-w-sm" style={{ borderRadius: 11 }} />
          <Skeleton className="h-8 w-28" style={{ borderRadius: 99 }} />
        </div>
        <div className="px-4 py-2 space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-[color:var(--rad-bd)] py-3"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Skeleton className="h-4 w-16" />
              <Skeleton circle className="!w-9 !h-9" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ms-auto h-4 w-20" />
              <Skeleton className="h-6 w-16" style={{ borderRadius: 99 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
