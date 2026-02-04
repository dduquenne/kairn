"use client";

import type { HTMLAttributes } from "react";

import { cn } from "../utils/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Animation style */
  animation?: "pulse" | "shimmer" | "none";
}

export function Skeleton({
  className,
  animation = "pulse",
  ...props
}: SkeletonProps) {
  const animationClass = animation === "pulse"
    ? "animate-pulse"
    : animation === "shimmer"
      ? "animate-shimmer"
      : "";

  return (
    <div
      className={cn(
        "rounded-md bg-muted/40",
        animationClass,
        className
      )}
      {...props}
    />
  );
}
