"use client";

import { type ElementType } from "react";
import { cn } from "../../utils/cn";
import type { Testimonial } from "./types";

export interface TestimonialCardProps {
  /** Testimonial quote text */
  quote: string;
  /** Author name */
  author: string;
  /** Author role (optional) */
  role?: string;
  /** Author image URL (optional) */
  image?: string;
  /** Rating (1-5, optional) */
  rating?: number;
  /** Custom class name */
  className?: string;
  /** Quote class name */
  quoteClassName?: string;
  /** Author class name */
  authorClassName?: string;
  /** Motion component for animations */
  motionComponent?: ElementType;
  /** Whether to animate on scroll */
  animateOnScroll?: boolean;
}

/**
 * Testimonial card component
 *
 * @example
 * ```tsx
 * <TestimonialCard
 *   quote="Great service!"
 *   author="John Doe"
 *   role="CEO"
 *   rating={5}
 *   motionComponent={motion.figure}
 * />
 * ```
 */
export function TestimonialCard({
  quote,
  author,
  role,
  image,
  rating,
  className,
  quoteClassName,
  authorClassName,
  motionComponent: Motion,
  animateOnScroll = true,
}: TestimonialCardProps) {
  const Wrapper = Motion ?? "figure";

  const wrapperProps = Motion && animateOnScroll
    ? {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.5, ease: "easeOut" },
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "flex h-full flex-col justify-between",
        "rounded-3xl border border-ivory/10 bg-night/40 p-8",
        "text-center shadow-xl shadow-night/40 backdrop-blur",
        className
      )}
    >
      {/* Rating stars */}
      {rating && rating > 0 && (
        <div className="mb-4 flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={cn(
                "h-5 w-5",
                i < rating ? "text-gold fill-gold" : "text-ivory/20"
              )}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
      )}

      {/* Quote */}
      <blockquote
        className={cn("text-lg text-ivory/80 italic", quoteClassName)}
      >
        "{quote}"
      </blockquote>

      {/* Author */}
      <figcaption
        className={cn(
          "mt-6 flex flex-col items-center gap-3",
          authorClassName
        )}
      >
        {/* Author image */}
        {image && (
          <img
            src={image}
            alt={author}
            className="h-12 w-12 rounded-full object-cover border-2 border-gold/30"
          />
        )}

        <div className="text-center">
          <cite className="text-sm font-semibold text-gold not-italic">
            {author}
          </cite>
          {role && (
            <p className="mt-1 text-xs text-ivory/60">{role}</p>
          )}
        </div>
      </figcaption>
    </Wrapper>
  );
}

/**
 * Create a TestimonialCard from a Testimonial object
 */
export function TestimonialCardFromData({
  testimonial,
  ...props
}: Omit<TestimonialCardProps, "quote" | "author" | "role" | "image" | "rating"> & {
  testimonial: Testimonial;
}) {
  return (
    <TestimonialCard
      quote={testimonial.quote}
      author={testimonial.author}
      role={testimonial.role}
      image={testimonial.image}
      rating={testimonial.rating}
      {...props}
    />
  );
}

