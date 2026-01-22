"use client";

import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

export interface ReadingProgressBarProps {
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for the progress bar */
  barClassName?: string;
  /** Progress bar height (default: h-1) */
  height?: string;
  /** Z-index (default: z-50) */
  zIndex?: string;
}

/**
 * Reading progress bar component
 * Displays a progress bar at the top of the page showing scroll progress
 *
 * @example
 * ```tsx
 * <ReadingProgressBar />
 * ```
 */
export function ReadingProgressBar({
  className,
  barClassName,
  height = "h-1",
  zIndex = "z-50",
}: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrolled = window.scrollY;
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progressPercentage =
        totalHeight > 0 ? (scrolled / totalHeight) * 100 : 0;
      setProgress(progressPercentage);
    };

    // Initial call
    updateProgress();

    // Update on scroll
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 bg-night/20",
        height,
        zIndex,
        className
      )}
    >
      <div
        className={cn(
          "h-full bg-gradient-to-r from-gold via-gold to-gold/80",
          "transition-all duration-150 ease-out",
          "shadow-lg shadow-gold/20",
          barClassName
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export interface ReadingProgressBadgeProps {
  /** Custom class name */
  className?: string;
  /** Title text */
  title?: string;
  /** Circle radius (default: 40) */
  radius?: number;
  /** Stroke width (default: 3) */
  strokeWidth?: number;
}

/**
 * Reading progress badge component
 * Displays a circular progress indicator showing scroll progress
 *
 * @example
 * ```tsx
 * <ReadingProgressBadge title="Reading Progress" />
 * ```
 */
export function ReadingProgressBadge({
  className,
  title = "Reading Progress",
  radius = 40,
  strokeWidth = 3,
}: ReadingProgressBadgeProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const circumference = 2 * Math.PI * radius;
  const svgSize = (radius + strokeWidth) * 2;

  useEffect(() => {
    // Mark as mounted on client
    setIsMounted(true);

    const updateProgress = () => {
      const scrolled = window.scrollY;
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progressPercentage =
        totalHeight > 0 ? (scrolled / totalHeight) * 100 : 0;
      setProgress(progressPercentage);
    };

    // Initial call
    updateProgress();

    // Update on scroll
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  // Placeholder during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div
        className={cn(
          "rounded-lg border border-gold/20 bg-night/50 p-6",
          className
        )}
      >
        <h3 className="mb-4 text-sm font-semibold text-ivory">{title}</h3>
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <span className="text-lg font-bold text-gold/40">--</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-gold/20 bg-night/50 p-6",
        className
      )}
    >
      <h3 className="mb-4 text-sm font-semibold text-ivory">{title}</h3>
      <div className="relative mx-auto w-24 h-24">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gold/20"
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - (progress ?? 0) / 100)}
            className="text-gold transition-all duration-150"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gold">
            {Math.round(progress ?? 0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Legacy component for backwards compatibility
 */
export function ReadingProgress() {
  return <ReadingProgressBar />;
}

