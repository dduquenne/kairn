"use client";

export function ChatbotSkeleton() {
  return (
    <section className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded bg-gold/10" />
          <div className="h-4 w-64 animate-pulse rounded bg-gold/5" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gold/10" />
      </div>

      {/* Toggle skeleton */}
      <div className="h-16 animate-pulse rounded-xl border border-gold/20 bg-night/60" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-gold/20 bg-night/60"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-gold/5" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-gold/5" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-gold/5" />
        </div>
        <div className="rounded-xl border border-gold/20 bg-night/60 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-1/4 rounded bg-gold/20" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded bg-gold/10" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
