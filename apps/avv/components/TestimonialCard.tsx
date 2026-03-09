/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
}

export function TestimonialCard({ quote, author, role }: TestimonialCardProps) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex h-full flex-col justify-between rounded-3xl border border-ivory/10 bg-night/40 p-8 text-center shadow-xl shadow-night/40 backdrop-blur"
    >
      <blockquote className="text-lg text-ivory/80 italic">“{quote}"</blockquote>
      <figcaption className="mt-6 text-sm font-semibold text-gold text-center">
        {author}
        {role && <span className="ml-2 font-normal text-ivory/60"></span>}
      </figcaption>
    </motion.figure>
  );
}
