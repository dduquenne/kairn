'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { useScrollReveal } from '../hooks/useScrollReveal';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

/**
 * Section title with SSR-safe scroll-reveal animation.
 *
 * Uses useScrollReveal to keep content visible during SSR,
 * hide it instantly after hydration (if below viewport),
 * then animate it in when scrolled into view.
 */
export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  const { ref, shouldShow, hasMounted } = useScrollReveal();

  return (
    <motion.header
      ref={ref}
      initial={false}
      animate={{ opacity: shouldShow ? 1 : 0, y: shouldShow ? 0 : 24 }}
      transition={!hasMounted || !shouldShow ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
      className="mx-auto max-w-3xl text-center"
    >
      {eyebrow && <p className="text-gold/80 mb-2 text-sm uppercase tracking-[0.3em]">{eyebrow}</p>}
      <h2 className="font-display text-ivory text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description && <p className="text-ivory/80 mt-4 text-base sm:text-lg">{description}</p>}
    </motion.header>
  );
}
