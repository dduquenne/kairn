'use client';

import { motion } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

/**
 * Section title with scroll-reveal animation.
 * Uses hasMounted guard so content is visible on SSR (opacity:1)
 * and only animates after client hydration.
 */
export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const initial = hasMounted ? { opacity: 0, y: 24 } : { opacity: 1, y: 0 };

  return (
    <motion.header
      initial={initial}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -50px 0px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mx-auto max-w-3xl text-center"
    >
      {eyebrow && <p className="text-gold/80 mb-2 text-sm uppercase tracking-[0.3em]">{eyebrow}</p>}
      <h2 className="font-display text-ivory text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description && <p className="text-ivory/80 mt-4 text-base sm:text-lg">{description}</p>}
    </motion.header>
  );
}
