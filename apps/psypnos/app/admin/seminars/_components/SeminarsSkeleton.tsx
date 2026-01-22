"use client";

import { Skeleton } from "../../../../components/ui/skeleton";

export function SeminarsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-48 bg-night/40" />
      <div className="overflow-hidden rounded-xl border border-night/40 bg-night/60 p-6">
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid grid-cols-5 items-center gap-4">
              <Skeleton className="h-6 w-full bg-night/40" />
              <Skeleton className="h-6 w-full bg-night/40" />
              <Skeleton className="h-6 w-full bg-night/40" />
              <Skeleton className="h-6 w-full bg-night/40" />
              <Skeleton className="h-6 w-full bg-night/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
