'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mx-auto max-w-3xl text-center"
    >
      {eyebrow && <p className="text-gold/80 mb-2 text-sm uppercase tracking-[0.3em]">{eyebrow}</p>}
      <h2 className="font-display text-ivory text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description && <p className="text-ivory/80 mt-4 text-base sm:text-lg">{description}</p>}
    </motion.header>
  );
}
