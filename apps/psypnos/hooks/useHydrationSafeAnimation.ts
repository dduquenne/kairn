"use client";

import { useEffect, useState } from "react";
import type { Transition, TargetAndTransition } from "framer-motion";

/**
 * Hook to handle Framer Motion animations safely during hydration.
 *
 * The problem: Framer Motion generates inline styles on the client that can
 * differ from the server-rendered HTML, causing hydration mismatches.
 *
 * The solution: This hook returns animation props that are static during
 * SSR and initial client render, then become animated after hydration.
 */
export function useHydrationSafeAnimation() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  /**
   * Get animation props that are safe for hydration.
   * During SSR and initial client render, returns static values.
   * After hydration, returns full animation values.
   */
  const getAnimationProps = (
    initial: TargetAndTransition,
    animate: TargetAndTransition,
    transition?: Transition
  ) => {
    if (!hasMounted) {
      // During SSR and initial hydration, use static final state
      return {
        initial: animate,
        animate: animate,
        transition: { duration: 0 },
      };
    }

    // After hydration, use full animation
    return {
      initial,
      animate,
      transition,
    };
  };

  /**
   * Shorthand for fade-in animation
   */
  const fadeIn = (delay = 0) =>
    getAnimationProps(
      { opacity: 0 },
      { opacity: 1 },
      { duration: 0.5, delay, ease: "easeOut" }
    );

  /**
   * Shorthand for slide-up animation
   */
  const slideUp = (delay = 0) =>
    getAnimationProps(
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0 },
      { duration: 0.5, delay, ease: "easeOut" }
    );

  /**
   * Shorthand for slide-in from left
   */
  const slideInLeft = (delay = 0) =>
    getAnimationProps(
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0 },
      { duration: 0.5, delay, ease: "easeOut" }
    );

  /**
   * Shorthand for scale-in animation
   */
  const scaleIn = (delay = 0) =>
    getAnimationProps(
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1 },
      { duration: 0.5, delay, ease: "easeOut" }
    );

  return {
    hasMounted,
    getAnimationProps,
    fadeIn,
    slideUp,
    slideInLeft,
    scaleIn,
  };
}

/**
 * Simple hook to check if component has mounted (useful for conditional rendering)
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
