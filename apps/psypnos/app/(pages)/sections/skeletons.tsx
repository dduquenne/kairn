import { Skeleton } from '../../../components/ui/skeleton';

export function SectionSkeleton() {
  return (
    <section className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Title skeleton */}
        <div className="space-y-4 text-center">
          <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
          <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
          <Skeleton className="bg-night/40 mx-auto h-20 w-full max-w-3xl" />
        </div>

        {/* Content skeleton */}
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-ivory/10 bg-night/40 rounded-3xl border p-8">
              <Skeleton className="bg-night/60 h-48 w-full" />
              <div className="mt-6 space-y-3">
                <Skeleton className="bg-night/60 h-6 w-full" />
                <Skeleton className="bg-night/60 h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ApproachSectionSkeleton() {
  return (
    <section className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
          <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
          <Skeleton className="bg-night/40 mx-auto h-20 w-full max-w-3xl" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border-ivory/10 bg-night/40 rounded-3xl border p-6">
              <Skeleton className="bg-night/60 mx-auto h-16 w-16 rounded-full" />
              <Skeleton className="bg-night/60 mx-auto mt-4 h-6 w-32" />
              <Skeleton className="bg-night/60 mt-4 h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function JourneySectionSkeleton() {
  return (
    <section className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
          <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center">
              <Skeleton className="bg-night/60 mx-auto h-20 w-20 rounded-full" />
              <Skeleton className="bg-night/60 mx-auto mt-4 h-6 w-48" />
              <Skeleton className="bg-night/60 mx-auto mt-2 h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSectionSkeleton() {
  return (
    <section className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-10 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="bg-night/40 h-4 w-28" />
            <Skeleton className="bg-night/40 h-10 w-72" />
            <Skeleton className="bg-night/40 h-16 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="bg-night/50 h-32 w-full rounded-3xl" />
            <Skeleton className="bg-night/50 h-32 w-full rounded-3xl" />
          </div>
          <Skeleton className="bg-night/50 h-24 w-full rounded-3xl" />
          <Skeleton className="bg-night/40 h-12 w-48 rounded-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="bg-night/50 h-28 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FormatsSectionSkeleton() {
  return (
    <section className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
          <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
          <Skeleton className="bg-night/40 mx-auto h-20 w-full max-w-3xl" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="border-ivory/10 bg-night/40 rounded-3xl border p-6 text-center"
            >
              <Skeleton className="bg-night/60 mx-auto h-16 w-16 rounded-full" />
              <Skeleton className="bg-night/60 mx-auto mt-4 h-6 w-32" />
              <Skeleton className="bg-night/60 mt-4 h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TherapySectionsSkeleton() {
  return (
    <>
      <section className="px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-12 text-center">
          <div className="space-y-4">
            <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
            <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
            <Skeleton className="bg-night/40 mx-auto h-32 w-full max-w-3xl" />
          </div>
        </div>
      </section>
      <section className="px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-12 text-center">
          <div className="space-y-4">
            <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
            <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
            <Skeleton className="bg-night/40 mx-auto h-32 w-full max-w-3xl" />
          </div>
        </div>
      </section>
    </>
  );
}

export function RespirationSectionSkeleton() {
  return (
    <section className="from-night via-night/95 to-night bg-gradient-to-br px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
          <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
          <Skeleton className="bg-night/40 mx-auto h-20 w-full max-w-3xl" />
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="bg-night/60 h-6 w-full" />
            ))}
          </div>
          <Skeleton className="bg-night/60 h-96 w-full rounded-full" />
        </div>
      </div>
    </section>
  );
}

export function SeminarsSectionSkeleton() {
  return (
    <section className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
          <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
          <Skeleton className="bg-night/40 mx-auto h-16 w-full max-w-3xl" />
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-ivory/10 bg-night/50 rounded-3xl border p-8">
              <Skeleton className="bg-night/60 h-8 w-full" />
              <Skeleton className="bg-night/60 mt-4 h-20 w-full" />
              <div className="mt-6 space-y-2">
                <Skeleton className="bg-night/60 h-4 w-full" />
                <Skeleton className="bg-night/60 h-4 w-full" />
              </div>
              <Skeleton className="bg-night/60 mx-auto mt-8 h-12 w-40 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSectionSkeleton() {
  return (
    <section className="bg-night/60 overflow-hidden py-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6 sm:px-10 lg:px-16">
        <div className="space-y-4">
          <Skeleton className="bg-night/40 h-4 w-24" />
          <Skeleton className="bg-night/40 h-8 w-80 max-w-full" />
        </div>
      </div>
      <div className="mt-12 space-y-4">
        {[1, 2].map(row => (
          <div key={row} className="flex gap-4 overflow-hidden px-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="border-ivory/[0.08] bg-ivory/[0.02] w-[320px] shrink-0 rounded-2xl border p-6 sm:w-[380px]"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="bg-night/40 h-4 w-full" />
                    <Skeleton className="bg-night/40 h-4 w-4/5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-ivory/10 h-px w-4" />
                    <Skeleton className="bg-night/40 h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="text-ivory/40 mt-8 text-center text-xs">Survolez pour mettre en pause</p>
    </section>
  );
}

export function BlogSectionSkeleton() {
  return (
    <section className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="bg-night/40 mx-auto h-4 w-48" />
          <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
          <Skeleton className="bg-night/40 mx-auto h-16 w-full max-w-3xl" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-ivory/10 bg-night/50 rounded-2xl border p-6">
              <Skeleton className="bg-night/60 h-48 w-full rounded-lg" />
              <div className="mt-6 space-y-3">
                <Skeleton className="bg-night/60 h-4 w-24 rounded-full" />
                <Skeleton className="bg-night/60 h-6 w-full" />
                <Skeleton className="bg-night/60 h-16 w-full" />
                <div className="flex gap-3">
                  <Skeleton className="bg-night/60 h-3 w-24" />
                  <Skeleton className="bg-night/60 h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <Skeleton className="bg-night/40 h-12 w-64 rounded-full" />
        </div>
      </div>
    </section>
  );
}

export function ContactSectionSkeleton() {
  return (
    <section className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="bg-night/40 mx-auto h-4 w-32" />
          <Skeleton className="bg-night/40 mx-auto h-10 w-96" />
          <Skeleton className="bg-night/40 mx-auto h-16 w-full max-w-3xl" />
        </div>
        <div className="border-ivory/10 bg-night/40 rounded-3xl border p-10">
          <Skeleton className="bg-night/60 h-96 w-full" />
        </div>
      </div>
    </section>
  );
}
