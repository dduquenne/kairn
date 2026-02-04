/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

/**
 * Lazy Chart Wrapper
 * Phase 4: Frontend Optimization
 *
 * Lazy loads chart components using Intersection Observer.
 * Only renders the chart when it becomes visible in the viewport.
 */

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef, Suspense, memo } from "react";

interface LazyChartProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number; // 0-1, intersection ratio to trigger load
  rootMargin?: string; // CSS margin around root
  minHeight?: string | number;
}

// Loading skeleton for charts
const ChartSkeleton = memo(function ChartSkeleton({
  minHeight = 300,
}: {
  minHeight?: string | number;
}) {
  return (
    <div
      className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg"
      style={{ minHeight }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Chargement...</span>
        </div>
      </div>
    </div>
  );
});

export const LazyChart = memo(function LazyChart({
  children,
  fallback,
  className = "",
  threshold = 0.1,
  rootMargin = "100px",
  minHeight = 300,
}: LazyChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Check if IntersectionObserver is available
    if (!("IntersectionObserver" in window)) {
      // Fallback: load immediately
      setIsVisible(true);
      setHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
            // Unobserve after loading to prevent re-triggers
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
    >
      <AnimatePresence mode="wait">
        {isVisible ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={fallback || <ChartSkeleton minHeight={minHeight} />}>
              {children}
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fallback || <ChartSkeleton minHeight={minHeight} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Pre-built skeleton variants
export const LineChartSkeleton = memo(function LineChartSkeleton() {
  return (
    <div className="animate-pulse p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" style={{ minHeight: 300 }}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="flex items-end justify-between h-48 gap-2">
        {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8" />
        ))}
      </div>
    </div>
  );
});

export const BarChartSkeleton = memo(function BarChartSkeleton() {
  return (
    <div className="animate-pulse p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" style={{ minHeight: 300 }}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        {[70, 55, 85, 40, 65].map((width, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

// Deterministic opacity values for heatmap skeleton to avoid hydration mismatch
const HEATMAP_OPACITIES = [0.45, 0.72, 0.38, 0.91, 0.56, 0.83, 0.41, 0.67, 0.95, 0.52, 0.78, 0.34, 0.89, 0.61, 0.74];

export const HeatmapSkeleton = memo(function HeatmapSkeleton() {
  return (
    <div className="animate-pulse p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" style={{ minHeight: 300 }}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="grid grid-cols-5 gap-2">
        {HEATMAP_OPACITIES.map((opacity, i) => (
          <div
            key={i}
            className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
            style={{ opacity }}
          />
        ))}
      </div>
    </div>
  );
});

export default LazyChart;
