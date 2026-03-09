/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { Suspense, lazy } from "react";

// Lazy load des graphiques pour réduire le bundle initial
const MobileLineChart = lazy(() =>
  import("./MobileLineChart").then(mod => ({ default: mod.MobileLineChart }))
);

const MobileBarChart = lazy(() =>
  import("./MobileBarChart").then(mod => ({ default: mod.MobileBarChart }))
);

// Skeleton loader pour les graphiques
function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="bg-gold/5 rounded-lg animate-pulse"
      style={{ height: `${height}px` }}
      role="status"
      aria-label="Chargement du graphique"
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-ivory/40">Chargement...</div>
      </div>
    </div>
  );
}

// Wrapper pour MobileLineChart avec lazy loading
export function LazyMobileLineChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height} />}>
      <MobileLineChart {...props} />
    </Suspense>
  );
}

// Wrapper pour MobileBarChart avec lazy loading
export function LazyMobileBarChart(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton height={props.height} />}>
      <MobileBarChart {...props} />
    </Suspense>
  );
}
