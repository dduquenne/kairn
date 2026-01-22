import { Skeleton } from "../../../components/ui/skeleton";

export function SectionSkeleton() {
  return (
    <section className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Title skeleton */}
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
          <Skeleton className="mx-auto h-20 w-full max-w-3xl bg-night/40" />
        </div>

        {/* Content skeleton */}
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-ivory/10 bg-night/40 p-8">
              <Skeleton className="h-48 w-full bg-night/60" />
              <div className="mt-6 space-y-3">
                <Skeleton className="h-6 w-full bg-night/60" />
                <Skeleton className="h-4 w-3/4 bg-night/60" />
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
          <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
          <Skeleton className="mx-auto h-20 w-full max-w-3xl bg-night/40" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-ivory/10 bg-night/40 p-6">
              <Skeleton className="mx-auto h-16 w-16 rounded-full bg-night/60" />
              <Skeleton className="mx-auto mt-4 h-6 w-32 bg-night/60" />
              <Skeleton className="mt-4 h-24 w-full bg-night/60" />
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
          <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center">
              <Skeleton className="mx-auto h-20 w-20 rounded-full bg-night/60" />
              <Skeleton className="mx-auto mt-4 h-6 w-48 bg-night/60" />
              <Skeleton className="mx-auto mt-2 h-16 w-full bg-night/60" />
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
            <Skeleton className="h-4 w-28 bg-night/40" />
            <Skeleton className="h-10 w-72 bg-night/40" />
            <Skeleton className="h-16 w-full bg-night/40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 w-full rounded-3xl bg-night/50" />
            <Skeleton className="h-32 w-full rounded-3xl bg-night/50" />
          </div>
          <Skeleton className="h-24 w-full rounded-3xl bg-night/50" />
          <Skeleton className="h-12 w-48 rounded-full bg-night/40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-3xl bg-night/50" />
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
          <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
          <Skeleton className="mx-auto h-20 w-full max-w-3xl bg-night/40" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-ivory/10 bg-night/40 p-6 text-center">
              <Skeleton className="mx-auto h-16 w-16 rounded-full bg-night/60" />
              <Skeleton className="mx-auto mt-4 h-6 w-32 bg-night/60" />
              <Skeleton className="mt-4 h-16 w-full bg-night/60" />
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
            <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
            <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
            <Skeleton className="mx-auto h-32 w-full max-w-3xl bg-night/40" />
          </div>
        </div>
      </section>
      <section className="px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-12 text-center">
          <div className="space-y-4">
            <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
            <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
            <Skeleton className="mx-auto h-32 w-full max-w-3xl bg-night/40" />
          </div>
        </div>
      </section>
    </>
  );
}

export function RespirationSectionSkeleton() {
  return (
    <section className="bg-gradient-to-br from-night via-night/95 to-night px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
          <Skeleton className="mx-auto h-20 w-full max-w-3xl bg-night/40" />
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full bg-night/60" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-full bg-night/60" />
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
          <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
          <Skeleton className="mx-auto h-16 w-full max-w-3xl bg-night/40" />
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-ivory/10 bg-night/50 p-8">
              <Skeleton className="h-8 w-full bg-night/60" />
              <Skeleton className="mt-4 h-20 w-full bg-night/60" />
              <div className="mt-6 space-y-2">
                <Skeleton className="h-4 w-full bg-night/60" />
                <Skeleton className="h-4 w-full bg-night/60" />
              </div>
              <Skeleton className="mx-auto mt-8 h-12 w-40 rounded-lg bg-night/60" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSectionSkeleton() {
  return (
    <section className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-ivory/10 bg-night/40 p-8">
              <Skeleton className="h-24 w-full bg-night/60" />
              <div className="mt-6 space-y-3">
                <Skeleton className="h-5 w-32 bg-night/60" />
                <Skeleton className="h-4 w-24 bg-night/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogSectionSkeleton() {
  return (
    <section className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-4 w-48 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
          <Skeleton className="mx-auto h-16 w-full max-w-3xl bg-night/40" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-ivory/10 bg-night/50 p-6">
              <Skeleton className="h-48 w-full rounded-lg bg-night/60" />
              <div className="mt-6 space-y-3">
                <Skeleton className="h-4 w-24 rounded-full bg-night/60" />
                <Skeleton className="h-6 w-full bg-night/60" />
                <Skeleton className="h-16 w-full bg-night/60" />
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-24 bg-night/60" />
                  <Skeleton className="h-3 w-20 bg-night/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-12 w-64 rounded-full bg-night/40" />
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
          <Skeleton className="mx-auto h-4 w-32 bg-night/40" />
          <Skeleton className="mx-auto h-10 w-96 bg-night/40" />
          <Skeleton className="mx-auto h-16 w-full max-w-3xl bg-night/40" />
        </div>
        <div className="rounded-3xl border border-ivory/10 bg-night/40 p-10">
          <Skeleton className="h-96 w-full bg-night/60" />
        </div>
      </div>
    </section>
  );
}
