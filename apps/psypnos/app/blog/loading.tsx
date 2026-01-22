export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night text-ivory">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16">
        {/* Header skeleton */}
        <div className="mb-12 animate-pulse">
          <div className="mb-4 h-12 w-48 rounded-lg bg-ivory/10" />
          <div className="h-6 w-96 rounded bg-ivory/5" />
        </div>

        {/* Grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-ivory/10 bg-night/50 p-6"
            >
              <div className="mb-4 h-6 w-24 rounded-full bg-ivory/10" />
              <div className="mb-3 h-8 w-full rounded bg-ivory/10" />
              <div className="mb-2 h-4 w-full rounded bg-ivory/5" />
              <div className="mb-4 h-4 w-3/4 rounded bg-ivory/5" />
              <div className="flex gap-4">
                <div className="h-4 w-24 rounded bg-ivory/5" />
                <div className="h-4 w-24 rounded bg-ivory/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
