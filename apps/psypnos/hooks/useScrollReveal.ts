'use client';

import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface ScrollRevealOptions {
  /** Fraction of the element that must be visible (0–1). Default: 0.2 */
  amount?: number;
}

/**
 * Hook for SSR-safe scroll-reveal animations.
 *
 * **Behaviour by phase:**
 * 1. SSR + first client render: `shouldShow = true` → content visible (no flash)
 * 2. After mount, element NOT in viewport: `shouldShow = false` (instant hide — user can't see it)
 * 3. Element scrolled into viewport: `shouldShow = true` (animated reveal)
 *
 * Use with Framer Motion:
 * ```tsx
 * const { ref, shouldShow, hasMounted } = useScrollReveal();
 * <motion.div
 *   ref={ref}
 *   initial={false}
 *   animate={{ opacity: shouldShow ? 1 : 0, y: shouldShow ? 0 : 24 }}
 *   transition={!hasMounted || !shouldShow ? { duration: 0 } : { duration: 0.6 }}
 * />
 * ```
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const { amount = 0.2 } = options;
  const [hasMounted, setHasMounted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef(null) as any;
  const isInView = useInView(ref, { once: true, amount });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // SSR + pre-mount: visible. After mount: controlled by IntersectionObserver.
  const shouldShow = !hasMounted || isInView;

  return { ref, shouldShow, hasMounted };
}
