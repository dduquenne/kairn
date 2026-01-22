// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

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
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto max-w-3xl text-center"
    >
      {eyebrow && (
        <p className="mb-2 text-sm uppercase tracking-[0.3em] text-gold/80">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-semibold text-ivory sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-ivory/80 sm:text-lg">{description}</p>
      )}
    </motion.header>
  );
}
