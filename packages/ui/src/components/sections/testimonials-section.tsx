'use client';

import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { Marquee } from '../marquee';
import { SectionTitle, type SectionTitleProps } from '../section-title';

/**
 * Testimonial data for the section
 */
export interface TestimonialSectionItem {
  /** Unique identifier */
  id: string;
  /** Testimonial quote text */
  quote: string;
  /** Author name */
  author: string;
}

/**
 * Props for the TestimonialsSection component
 */
export interface TestimonialsSectionProps {
  /** Testimonial data to display */
  testimonials: TestimonialSectionItem[];
  /** Whether data is still loading */
  isLoading?: boolean;
  /** Section title configuration */
  title?: SectionTitleProps;
  /** Custom card render function */
  renderCard?: (testimonial: TestimonialSectionItem) => ReactNode;
  /** Hint text shown below the marquee */
  hoverHint?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Analytics tracking section name */
  trackingName?: string;
  /** Additional CSS classes for the section */
  className?: string;
  /** Top row marquee speed in seconds */
  topRowSpeed?: number;
  /** Bottom row marquee speed in seconds */
  bottomRowSpeed?: number;
  /** Custom colors */
  colors?: {
    /** Card border color */
    cardBorder?: string;
    /** Card background */
    cardBg?: string;
    /** Card accent color */
    accent?: string;
    /** Quote text color */
    quoteText?: string;
    /** Author text color */
    authorText?: string;
  };
}

/**
 * Default compact testimonial card for the marquee
 */
function DefaultTestimonialCard({
  quote,
  author,
  colors = {},
}: {
  quote: string;
  author: string;
  colors?: TestimonialsSectionProps['colors'];
}) {
  const {
    cardBorder = 'border-ivory/[0.08]',
    cardBg = 'from-ivory/[0.04]',
    accent = 'from-gold/60',
    quoteText = 'text-ivory/75 group-hover:text-ivory/90',
    authorText = 'text-gold/80',
  } = colors;

  return (
    <article
      className={cn(
        'group relative flex w-[320px] shrink-0 flex-col gap-4 rounded-2xl border bg-gradient-to-br to-transparent p-6 backdrop-blur-sm transition-all duration-300 sm:w-[380px]',
        cardBorder,
        cardBg,
        `hover:bg-ivory/[0.06]`
      )}
    >
      {/* Subtle accent line */}
      <div
        className={cn('absolute left-6 top-0 h-px w-12 bg-gradient-to-r to-transparent', accent)}
      />

      {/* Quote */}
      <p className={cn('text-[15px] leading-relaxed transition-colors duration-300', quoteText)}>
        &ldquo;{quote}&rdquo;
      </p>

      {/* Author with decorative dash */}
      <div className="flex items-center gap-2">
        <span className="bg-gold/40 h-px w-4" />
        <span className={cn('text-sm font-medium', authorText)}>{author}</span>
      </div>
    </article>
  );
}

/**
 * Loading skeleton for the testimonials section
 */
function TestimonialsSkeleton() {
  return (
    <section className="bg-night/60 overflow-hidden py-12 sm:py-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6 sm:px-10 lg:px-16">
        <div className="space-y-4">
          <div className="bg-ivory/10 h-4 w-24 animate-pulse rounded" />
          <div className="bg-ivory/10 h-8 w-80 max-w-full animate-pulse rounded" />
        </div>
      </div>
      <div className="mt-12 space-y-4">
        {[1, 2].map(row => (
          <div key={row} className="flex gap-4 overflow-hidden px-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="border-ivory/[0.08] bg-ivory/[0.02] w-[320px] shrink-0 rounded-2xl border p-6 sm:w-[380px]"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="bg-ivory/10 h-4 w-full animate-pulse rounded" />
                    <div className="bg-ivory/10 h-4 w-4/5 animate-pulse rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-ivory/10 h-px w-4" />
                    <div className="bg-ivory/10 h-3 w-16 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="text-ivory/40 mt-8 text-center text-xs">Survolez pour mettre en pause</p>
    </section>
  );
}

/**
 * Testimonials section with dual-direction infinite marquee.
 * Two rows scrolling in opposite directions create visual interest.
 * Supports reduced motion for accessibility.
 *
 * @example
 * ```tsx
 * <TestimonialsSection
 *   testimonials={data}
 *   title={{
 *     eyebrow: "Témoignages",
 *     title: "Ce que disent nos clients",
 *   }}
 * />
 * ```
 */
export function TestimonialsSection({
  testimonials,
  isLoading = false,
  title = { eyebrow: 'Témoignages', title: 'Ce que disent nos clients' },
  renderCard,
  hoverHint = 'Survolez pour mettre en pause',
  emptyMessage = 'Aucun témoignage pour le moment.',
  trackingName = 'Témoignages',
  className,
  topRowSpeed = 35,
  bottomRowSpeed = 30,
  colors = {},
}: TestimonialsSectionProps) {
  if (isLoading) {
    return <TestimonialsSkeleton />;
  }

  // Split testimonials into two rows
  const shouldShowAllOnBothRows = testimonials.length <= 10;
  const topRow = shouldShowAllOnBothRows
    ? testimonials
    : testimonials.slice(0, Math.ceil(testimonials.length / 2));
  const bottomRow = shouldShowAllOnBothRows
    ? [...testimonials].reverse()
    : testimonials.slice(Math.ceil(testimonials.length / 2));

  // Empty state
  if (testimonials.length === 0) {
    return (
      <section className={cn('bg-night/60 px-6 py-12 sm:px-10 sm:py-20 lg:px-16', className)}>
        <div className="mx-auto max-w-6xl space-y-12">
          <SectionTitle {...title} />
          <div className="border-ivory/10 bg-ivory/[0.02] text-ivory/60 rounded-2xl border p-8 text-center text-sm">
            {emptyMessage}
          </div>
        </div>
      </section>
    );
  }

  const cardRenderer =
    renderCard ??
    ((t: TestimonialSectionItem) => (
      <DefaultTestimonialCard key={t.id} quote={t.quote} author={t.author} colors={colors} />
    ));

  return (
    <section
      className={cn('bg-night/60 overflow-hidden py-12 sm:py-20', className)}
      data-track-section={trackingName.toLowerCase().replace(/\s+/g, '-')}
      data-track-section-name={trackingName}
    >
      {/* Title */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <SectionTitle {...title} />
      </div>

      {/* Marquee rows */}
      <div className="mt-12 space-y-4 sm:space-y-6">
        <Marquee direction="left" speed={topRowSpeed}>
          {topRow.map(t => cardRenderer(t))}
        </Marquee>

        {bottomRow.length > 0 && (
          <Marquee direction="right" speed={bottomRowSpeed}>
            {bottomRow.map(t => cardRenderer(t))}
          </Marquee>
        )}
      </div>

      {/* Hover hint */}
      {hoverHint && <p className="text-ivory/40 mt-8 text-center text-xs">{hoverHint}</p>}
    </section>
  );
}
