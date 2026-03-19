import type { ReactNode } from 'react';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

/**
 * Section title — always visible, no framer-motion.
 * Previous motion.header + useScrollReveal pattern caused invisible sections
 * due to SSR/hydration issues with framer-motion.
 */
export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      {eyebrow && <p className="text-gold/80 mb-2 text-sm uppercase tracking-[0.3em]">{eyebrow}</p>}
      <h2 className="text-ivory text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description && <p className="text-ivory/80 mt-4 text-base sm:text-lg">{description}</p>}
    </header>
  );
}
