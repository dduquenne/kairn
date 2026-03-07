'use client';

/** Loading skeleton for the chatbot admin page */
export function ChatbotSkeleton() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="bg-gold/10 h-7 w-40 animate-pulse rounded" />
          <div className="bg-gold/5 h-4 w-64 animate-pulse rounded" />
        </div>
        <div className="bg-gold/10 h-9 w-28 animate-pulse rounded-lg" />
      </div>
      <div className="border-gold/20 bg-night/60 h-16 animate-pulse rounded-xl border" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="border-gold/20 bg-night/60 h-20 animate-pulse rounded-xl border"
          />
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="bg-gold/5 h-10 flex-1 animate-pulse rounded-lg" />
          <div className="bg-gold/5 h-10 w-32 animate-pulse rounded-lg" />
          <div className="bg-gold/5 h-10 w-32 animate-pulse rounded-lg" />
        </div>
        <div className="border-gold/20 bg-night/60 rounded-xl border p-4">
          <div className="animate-pulse space-y-4">
            <div className="bg-gold/20 h-4 w-1/4 rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gold/10 h-12 rounded" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
