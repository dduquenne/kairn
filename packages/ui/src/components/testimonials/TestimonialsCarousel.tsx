"use client";

import { useEffect, useState, useCallback, type ElementType } from "react";
import { cn } from "../../utils/cn";
import { TestimonialCard } from "./TestimonialCard";
import type { Testimonial } from "./types";

export interface TestimonialsCarouselProps {
  /** Testimonials to display */
  testimonials: Testimonial[];
  /** Autoplay interval in ms (default: 5000, 0 to disable) */
  autoplayInterval?: number;
  /** Show navigation dots */
  showDots?: boolean;
  /** Show navigation arrows */
  showArrows?: boolean;
  /** Section title (optional) */
  title?: string;
  /** Custom class name */
  className?: string;
  /** Custom card class name */
  cardClassName?: string;
  /** Motion component for card animations */
  motionComponent?: ElementType;
}

/**
 * Testimonials carousel component
 *
 * @example
 * ```tsx
 * <TestimonialsCarousel
 *   testimonials={testimonials}
 *   autoplayInterval={5000}
 *   showDots
 *   motionComponent={motion.div}
 * />
 * ```
 */
export function TestimonialsCarousel({
  testimonials,
  autoplayInterval = 5000,
  showDots = true,
  showArrows = false,
  title,
  className,
  cardClassName,
  motionComponent: Motion,
}: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = testimonials.length;

  // Reset index when testimonials change
  useEffect(() => {
    setCurrentIndex(0);
  }, [totalSlides]);

  // Autoplay
  useEffect(() => {
    if (totalSlides <= 1 || autoplayInterval <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, autoplayInterval);

    return () => {
      window.clearInterval(timer);
    };
  }, [totalSlides, autoplayInterval]);

  const goToSlide = useCallback(
    (index: number) => {
      if (totalSlides === 0) return;
      const normalizedIndex = (index + totalSlides) % totalSlides;
      setCurrentIndex(normalizedIndex);
    },
    [totalSlides]
  );

  const handlePrevious = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const handleNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  if (totalSlides === 0) {
    return null;
  }

  const CardWrapper = Motion ?? "div";

  return (
    <section className={cn("relative", className)}>
      {/* Title */}
      {title && (
        <h2 className="mb-8 text-center text-2xl font-semibold text-ivory">
          {title}
        </h2>
      )}

      {/* Carousel */}
      <div className="relative">
        {/* Previous arrow */}
        {showArrows && totalSlides > 1 && (
          <button
            type="button"
            onClick={handlePrevious}
            className={cn(
              "absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2",
              "rounded-full border border-gold/30 bg-night/90 p-3 text-gold",
              "backdrop-blur-sm transition-all hover:border-gold hover:bg-night hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-gold"
            )}
            aria-label="Previous testimonial"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Slides container */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="w-full shrink-0 px-1 sm:px-2"
              >
                <CardWrapper
                  initial={Motion ? { opacity: 0.4, scale: 0.98 } : undefined}
                  animate={Motion ? { opacity: 1, scale: 1 } : undefined}
                  transition={
                    Motion ? { duration: 0.4, ease: "easeOut" } : undefined
                  }
                  className="flex justify-center"
                >
                  <TestimonialCard
                    quote={testimonial.quote}
                    author={testimonial.author}
                    role={testimonial.role}
                    image={testimonial.image}
                    rating={testimonial.rating}
                    className={cn("max-w-2xl", cardClassName)}
                    motionComponent={Motion}
                    animateOnScroll={false}
                  />
                </CardWrapper>
              </div>
            ))}
          </div>
        </div>

        {/* Next arrow */}
        {showArrows && totalSlides > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              "absolute right-0 top-1/2 z-10 translate-x-4 -translate-y-1/2",
              "rounded-full border border-gold/30 bg-night/90 p-3 text-gold",
              "backdrop-blur-sm transition-all hover:border-gold hover:bg-night hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-gold"
            )}
            aria-label="Next testimonial"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation dots */}
      {showDots && totalSlides > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-8 bg-gold"
                  : "w-2 bg-ivory/30 hover:bg-ivory/50"
              )}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

