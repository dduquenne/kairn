'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { cn } from '../utils/cn';

/**
 * Props for the Marquee component
 */
export interface MarqueeProps {
  /** Content to scroll infinitely */
  children: ReactNode;
  /** Scroll direction */
  direction?: 'left' | 'right';
  /** Animation duration in seconds */
  speed?: number;
  /** Pause animation on hover */
  pauseOnHover?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom gradient fade color (default: 'night') */
  fadeColor?: string;
}

/**
 * Infinite marquee component with pause on hover and reduced motion support.
 *
 * Animates a wrapper containing two copies of content for seamless looping.
 * Uses CSS animation classes `animate-marquee-left` and `animate-marquee-right`
 * which must be defined in the consuming app's Tailwind config.
 *
 * @example
 * ```tsx
 * <Marquee direction="left" speed={35}>
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </Marquee>
 * ```
 */
export function Marquee({
  children,
  direction = 'left',
  speed = 25,
  pauseOnHover = true,
  className,
  fadeColor = 'night',
}: MarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className={cn('flex gap-4 overflow-x-auto px-6 sm:gap-6', className)}>{children}</div>
    );
  }

  const isRight = direction === 'right';

  return (
    <div
      className={cn('group relative flex overflow-hidden', className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Gradient fade edges — use inline styles because dynamic Tailwind classes are purged in production */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 sm:w-24"
        style={{
          background: `linear-gradient(to right, var(--marquee-fade, var(--color-${fadeColor}, #0d0d1a)) 0%, transparent 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 sm:w-24"
        style={{
          background: `linear-gradient(to left, var(--marquee-fade, var(--color-${fadeColor}, #0d0d1a)) 0%, transparent 100%)`,
        }}
      />

      {/* Animated wrapper containing two copies */}
      <div
        className={isRight ? 'animate-marquee-right' : 'animate-marquee-left'}
        style={{
          display: 'flex',
          animationDuration: `${speed}s`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {/* First copy */}
        <div className="flex shrink-0 gap-4 pr-4 sm:gap-6 sm:pr-6">{children}</div>
        {/* Second copy for seamless loop */}
        <div className="flex shrink-0 gap-4 pr-4 sm:gap-6 sm:pr-6" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
