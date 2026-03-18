/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';

import { useScrollReveal } from '../hooks/useScrollReveal';

type ApproachItem = {
  title: string;
  description: string;
  icon: string;
  iconAlt: string;
};

interface ApproachInfographicProps {
  items: ApproachItem[];
}

/**
 * Approach infographic with parallax and scroll-reveal animations.
 *
 * Uses useScrollReveal for SSR-safe visibility: content is visible
 * during SSR, hidden instantly after hydration (if below viewport),
 * then animated in when scrolled into view.
 */
export function ApproachInfographic({ items }: ApproachInfographicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: revealRef, shouldShow, hasMounted } = useScrollReveal({ amount: 0.1 });
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  // Create staggered parallax effects for each item
  const parallaxValues = items.map((_, index) => {
    const isLeft = index % 2 === 0;
    const offset = index % 3;
    const direction = isLeft ? 1 : -1;
    const baseAmplitude = 40 + offset * 15;

    return useTransform(
      scrollYProgress,
      [0, 1],
      [direction * baseAmplitude, -direction * baseAmplitude]
    );
  });

  /**
   * Build transition: instant when hiding or pre-mount, smooth when revealing.
   */
  const cardTransition = (delay: number) =>
    !hasMounted || !shouldShow
      ? { duration: 0 }
      : { duration: 0.6, delay, ease: 'easeOut' as const };

  return (
    <div ref={containerRef} className="relative px-6 py-20 sm:px-10 lg:px-16">
      {/* Desktop: Hexagonal/Grid layout with parallax */}
      <div ref={revealRef} className="mx-auto max-w-6xl">
        {/* Desktop Grid - Hidden on mobile */}
        <div className="hidden md:block">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => {
              const yTransform = parallaxValues[index];

              return (
                <motion.article
                  key={item.title}
                  style={{ y: yTransform }}
                  initial={false}
                  animate={{
                    opacity: shouldShow ? 1 : 0,
                    scale: shouldShow ? 1 : 0.9,
                  }}
                  transition={cardTransition(index * 0.1)}
                  className="group relative"
                >
                  {/* Card with gradient border effect */}
                  <div className="border-gold/20 from-night/60 via-night/40 to-night/60 hover:border-gold/50 relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(199,169,98,0.2)]">
                    {/* Animated background gradient */}
                    <div className="from-gold/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Content */}
                    <div className="relative z-10 flex h-full flex-col">
                      {/* Icon container with glow effect */}
                      <motion.div
                        initial={false}
                        animate={{
                          scale: shouldShow ? 1 : 0,
                          rotateY: shouldShow ? 0 : 90,
                        }}
                        transition={cardTransition(index * 0.1 + 0.1)}
                        className="relative mb-6 inline-flex h-16 w-16 items-center justify-center"
                      >
                        {/* Glow background */}
                        <div className="bg-gold/15 absolute inset-0 rounded-full blur-xl" />

                        {/* Icon background circle */}
                        <div className="border-gold/30 from-gold/10 absolute inset-0 rounded-full border bg-gradient-to-br to-transparent" />

                        {/* Icon */}
                        <Image
                          src={item.icon}
                          alt={item.iconAlt}
                          width={32}
                          height={32}
                          className="relative h-8 w-8 object-contain"
                        />
                      </motion.div>

                      {/* Title */}
                      <h3 className="text-gold group-hover:text-gold text-lg font-semibold transition-colors duration-300">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-ivory/75 group-hover:text-ivory/90 mt-3 flex-grow text-sm leading-relaxed transition-colors duration-300">
                        {item.description}
                      </p>

                      {/* Bottom accent line */}
                      <motion.div
                        initial={false}
                        animate={{ scaleX: shouldShow ? 1 : 0 }}
                        transition={cardTransition(index * 0.1 + 0.2)}
                        className="from-gold to-gold/0 mt-6 h-0.5 w-12 origin-left bg-gradient-to-r"
                      />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        {/* Mobile: Vertical stacked layout */}
        <div className="space-y-6 md:hidden">
          {items.map((item, index) => (
            <motion.article
              key={item.title}
              initial={false}
              animate={{
                opacity: shouldShow ? 1 : 0,
                x: shouldShow ? 0 : -20,
              }}
              transition={cardTransition(index * 0.1)}
              className="group relative"
            >
              {/* Mobile card */}
              <div className="border-gold/20 from-night/60 via-night/40 to-night/60 hover:border-gold/50 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-lg backdrop-blur-sm transition-all duration-300">
                {/* Animated background gradient */}
                <div className="from-gold/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Header with icon and title */}
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      initial={false}
                      animate={{ scale: shouldShow ? 1 : 0 }}
                      transition={cardTransition(index * 0.1)}
                      className="relative mt-1 inline-flex h-12 w-12 flex-shrink-0 items-center justify-center"
                    >
                      {/* Glow background */}
                      <div className="bg-gold/15 absolute inset-0 rounded-full blur-lg" />

                      {/* Icon background circle */}
                      <div className="border-gold/30 from-gold/10 absolute inset-0 rounded-full border bg-gradient-to-br to-transparent" />

                      {/* Icon */}
                      <Image
                        src={item.icon}
                        alt={item.iconAlt}
                        width={28}
                        height={28}
                        className="relative h-7 w-7 object-contain"
                      />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-gold text-base font-semibold">{item.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-ivory/75 mt-4 text-sm leading-relaxed">{item.description}</p>

                  {/* Bottom accent */}
                  <motion.div
                    initial={false}
                    animate={{ scaleX: shouldShow ? 1 : 0 }}
                    transition={cardTransition(index * 0.1 + 0.15)}
                    className="from-gold to-gold/0 mt-4 h-0.5 w-8 origin-left bg-gradient-to-r"
                  />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
