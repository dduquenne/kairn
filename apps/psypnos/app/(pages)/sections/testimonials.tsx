'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { SectionTitle } from '../../../components/SectionTitle';
import { useTestimonials } from '../../../lib/hooks';
import type { TestimonialData } from '../../../lib/server/data-fetchers';

/**
 * Compact testimonial card for the marquee
 * Features a subtle glass morphism effect and gold accent
 */
function TestimonialCard({ quote, author }: { quote: string; author: string }) {
  return (
    <article className="border-ivory/[0.08] from-ivory/[0.04] hover:border-gold/20 hover:bg-ivory/[0.06] group relative flex w-[320px] shrink-0 flex-col gap-4 rounded-2xl border bg-gradient-to-br to-transparent p-6 backdrop-blur-sm transition-all duration-300 sm:w-[380px]">
      {/* Subtle gold accent line */}
      <div className="from-gold/60 absolute left-6 top-0 h-px w-12 bg-gradient-to-r to-transparent" />

      {/* Quote */}
      <p className="text-ivory/75 group-hover:text-ivory/90 text-[15px] leading-relaxed transition-colors duration-300">
        "{quote}"
      </p>

      {/* Author with decorative dash */}
      <div className="flex items-center gap-2">
        <span className="bg-gold/40 h-px w-4" />
        <span className="text-gold/80 text-sm font-medium">{author}</span>
      </div>
    </article>
  );
}

/**
 * Infinite marquee component with pause on hover
 * Uses CSS animations for truly seamless infinite scrolling
 *
 * Key insight: We animate a WRAPPER containing two copies of content.
 * - The wrapper width = 2x content width (since it has 2 copies)
 * - Animation moves wrapper by 50% of its width = 100% of one copy
 * - When wrapper moves -50%, Copy2 is where Copy1 started -> seamless loop
 *
 * Direction LEFT:  wrapper moves from 0% to -50%
 * Direction RIGHT: wrapper moves from -50% to 0%
 */
function Marquee({
  children,
  direction = 'left',
  speed = 25,
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number;
  pauseOnHover?: boolean;
}) {
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
    return <div className="flex gap-4 overflow-x-auto px-6 sm:gap-6">{children}</div>;
  }

  const isRight = direction === 'right';

  return (
    <div
      className="group relative flex overflow-hidden"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Gradient fade edges */}
      <div className="from-night/80 pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r to-transparent sm:w-24" />
      <div className="from-night/80 pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l to-transparent sm:w-24" />

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

interface TestimonialsSectionProps {
  initialData?: TestimonialData[];
}

/**
 * Testimonials section with dual-direction infinite marquee
 * - Two rows scrolling in opposite directions create visual interest
 * - Hover to pause allows reading individual testimonials
 * - Reduced motion support for accessibility
 */
export function TestimonialsSection({ initialData }: TestimonialsSectionProps) {
  const [hasMounted, setHasMounted] = useState(false);

  // Use SWR for optimized data fetching with caching
  const { testimonials: fetchedTestimonials, isLoading } = useTestimonials({ limit: 10 });

  // Use initialData if available, otherwise use fetched data
  const testimonials = initialData && initialData.length > 0 ? initialData : fetchedTestimonials;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // For 10 or fewer testimonials, show all on both rows (second row reversed)
  // For more than 10, split into two separate halves
  const shouldShowAllOnBothRows = testimonials.length <= 10;
  const topRow = shouldShowAllOnBothRows
    ? testimonials
    : testimonials.slice(0, Math.ceil(testimonials.length / 2));
  const bottomRow = shouldShowAllOnBothRows
    ? [...testimonials].reverse()
    : testimonials.slice(Math.ceil(testimonials.length / 2));

  // Show skeleton only if no initialData AND (not mounted OR still loading)
  if (!initialData && (!hasMounted || isLoading)) {
    return (
      <section className="bg-night/60 overflow-hidden py-20">
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

  // Empty state
  if (testimonials.length === 0) {
    return (
      <section className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-12">
          <SectionTitle
            eyebrow="Témoignages"
            title="Ils et elles témoignent de leur métamorphose"
          />
          <div className="border-ivory/10 bg-ivory/[0.02] text-ivory/60 rounded-2xl border p-8 text-center text-sm">
            Aucun témoignage pour le moment.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-night/60 overflow-hidden py-20"
      data-track-section="temoignages"
      data-track-section-name="Témoignages"
    >
      {/* Title with constrained width */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <SectionTitle
            eyebrow="Témoignages"
            title="Ils et elles témoignent de leur métamorphose"
          />
        </motion.div>
      </div>

      {/* Full-width marquee container */}
      <div className="mt-12 space-y-4 sm:space-y-6">
        {/* Top row - scrolls left */}
        <Marquee direction="left" speed={35}>
          {topRow.map(testimonial => (
            <TestimonialCard
              key={testimonial.id}
              quote={testimonial.quote}
              author={testimonial.author}
            />
          ))}
        </Marquee>

        {/* Bottom row - scrolls right (only if enough testimonials) */}
        {bottomRow.length > 0 && (
          <Marquee direction="right" speed={30}>
            {bottomRow.map(testimonial => (
              <TestimonialCard
                key={testimonial.id}
                quote={testimonial.quote}
                author={testimonial.author}
              />
            ))}
          </Marquee>
        )}
      </div>

      {/* Hover hint */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-ivory/40 mt-8 text-center text-xs"
      >
        Survolez pour mettre en pause
      </motion.p>
    </section>
  );
}
