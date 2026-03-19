'use client';

import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

/**
 * Props for the SectionTitle component
 */
export interface SectionTitleProps {
  /** Small text displayed above the title */
  eyebrow?: string;
  /** Main heading text */
  title: string;
  /** Optional description below the title */
  description?: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Custom colors configuration */
  colors?: {
    /** Eyebrow text color class (default: 'text-gold/80') */
    eyebrow?: string;
    /** Title text color class (default: 'text-ivory') */
    title?: string;
    /** Description text color class (default: 'text-ivory/80') */
    description?: string;
  };
}

/**
 * Reusable section title component with eyebrow, heading, and description.
 * Used as a header for page sections across sites.
 *
 * @example
 * ```tsx
 * <SectionTitle
 *   eyebrow="Témoignages"
 *   title="Ce que disent nos clients"
 *   description="Des retours authentiques de nos utilisateurs."
 * />
 * ```
 */
export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
  colors = {},
}: SectionTitleProps) {
  const {
    eyebrow: eyebrowColor = 'text-gold/80',
    title: titleColor = 'text-ivory',
    description: descriptionColor = 'text-ivory/80',
  } = colors;

  return (
    <header className={cn('mx-auto max-w-3xl text-center', className)}>
      {eyebrow && (
        <p className={cn('mb-2 text-sm uppercase tracking-[0.3em]', eyebrowColor)}>{eyebrow}</p>
      )}
      <h2 className={cn('text-3xl font-semibold sm:text-4xl', titleColor)}>{title}</h2>
      {description && (
        <p className={cn('mt-4 text-base sm:text-lg', descriptionColor)}>{description}</p>
      )}
    </header>
  );
}
