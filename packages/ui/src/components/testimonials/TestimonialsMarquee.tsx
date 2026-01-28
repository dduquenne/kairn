'use client';

import type { ElementType } from 'react';

import { cn } from '../../utils/cn';

import { TestimonialCard } from './TestimonialCard';
import type { Testimonial } from './types';

export interface TestimonialsMarqueeProps {
  /** Testimonials to display */
  testimonials: Testimonial[];
  /** Section title (optional) */
  title?: string;
  /** Subtitle (optional) */
  subtitle?: string;
  /** Animation duration in seconds (default: 30) */
  animationDuration?: number;
  /** Pause on hover (default: true) */
  pauseOnHover?: boolean;
  /** Show pause hint text */
  showPauseHint?: boolean;
  /** Pause hint text */
  pauseHintText?: string;
  /** Custom class name */
  className?: string;
  /** Custom card class name */
  cardClassName?: string;
  /** Motion component for card animations */
  motionComponent?: ElementType;
  /** Custom colors */
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
    border?: string;
  };
}

/**
 * Testimonials marquee component with dual-direction infinite scroll
 *
 * @example
 * ```tsx
 * <TestimonialsMarquee
 *   testimonials={testimonials}
 *   title="What our clients say"
 *   pauseOnHover
 *   animationDuration={30}
 * />
 * ```
 */
export function TestimonialsMarquee({
  testimonials,
  title,
  subtitle,
  animationDuration = 30,
  pauseOnHover = true,
  showPauseHint = true,
  pauseHintText = 'Hover to pause',
  className,
  cardClassName,
  motionComponent: Motion,
  colors = {},
}: TestimonialsMarqueeProps) {
  const { primary = 'gold', text = 'ivory' } = colors;

  if (testimonials.length === 0) {
    return null;
  }

  // Split testimonials into two rows
  const midpoint = Math.ceil(testimonials.length / 2);
  const topRow = testimonials.slice(0, midpoint);
  const bottomRow = testimonials.slice(midpoint);

  // Double the items for seamless loop
  const topRowItems = [...topRow, ...topRow];
  const bottomRowItems = [...bottomRow, ...bottomRow];

  const CardWrapper = Motion ?? 'div';

  // Inline styles for animation (fallback if Tailwind animations not available)
  const marqueeLeftStyle = {
    animation: `marquee-left ${animationDuration}s linear infinite`,
  };

  const marqueeRightStyle = {
    animation: `marquee-right ${animationDuration}s linear infinite`,
  };

  return (
    <section className={cn('relative overflow-hidden py-12', className)}>
      {/* Title */}
      {(title || subtitle) && (
        <div className="mb-10 text-center">
          {title && (
            <h2 className={`font-display text-${primary} mb-3 text-3xl font-bold md:text-4xl`}>
              {title}
            </h2>
          )}
          {subtitle && <p className={`text-${text}/60 text-lg`}>{subtitle}</p>}
        </div>
      )}

      {/* Marquee container */}
      <div className="relative space-y-6">
        {/* Top row - scrolls left */}
        <div className="relative overflow-hidden">
          {/* Gradient fade edges */}
          <div className="from-background pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r to-transparent" />
          <div className="from-background pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l to-transparent" />

          <div
            className={cn(
              'flex w-max gap-6',
              pauseOnHover && 'hover:[animation-play-state:paused]'
            )}
            style={marqueeLeftStyle}
          >
            {topRowItems.map((testimonial, index) => (
              <div key={`top-${testimonial.id}-${index}`} className="w-80 flex-shrink-0 sm:w-96">
                <CardWrapper
                  initial={Motion ? { opacity: 0.9, scale: 0.98 } : undefined}
                  whileInView={Motion ? { opacity: 1, scale: 1 } : undefined}
                  transition={Motion ? { duration: 0.3 } : undefined}
                >
                  <TestimonialCard
                    quote={testimonial.quote}
                    author={testimonial.author}
                    role={testimonial.role}
                    image={testimonial.image}
                    rating={testimonial.rating}
                    className={cn('h-full', cardClassName)}
                    motionComponent={Motion}
                    animateOnScroll={false}
                  />
                </CardWrapper>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row - scrolls right */}
        {bottomRowItems.length > 0 && (
          <div className="relative overflow-hidden">
            {/* Gradient fade edges */}
            <div className="from-background pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r to-transparent" />
            <div className="from-background pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l to-transparent" />

            <div
              className={cn(
                'flex w-max gap-6',
                pauseOnHover && 'hover:[animation-play-state:paused]'
              )}
              style={marqueeRightStyle}
            >
              {bottomRowItems.map((testimonial, index) => (
                <div
                  key={`bottom-${testimonial.id}-${index}`}
                  className="w-80 flex-shrink-0 sm:w-96"
                >
                  <CardWrapper
                    initial={Motion ? { opacity: 0.9, scale: 0.98 } : undefined}
                    whileInView={Motion ? { opacity: 1, scale: 1 } : undefined}
                    transition={Motion ? { duration: 0.3 } : undefined}
                  >
                    <TestimonialCard
                      quote={testimonial.quote}
                      author={testimonial.author}
                      role={testimonial.role}
                      image={testimonial.image}
                      rating={testimonial.rating}
                      className={cn('h-full', cardClassName)}
                      motionComponent={Motion}
                      animateOnScroll={false}
                    />
                  </CardWrapper>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pause hint */}
      {showPauseHint && pauseOnHover && (
        <p className={`text-${text}/40 mt-6 text-center text-sm`}>{pauseHintText}</p>
      )}
    </section>
  );
}
