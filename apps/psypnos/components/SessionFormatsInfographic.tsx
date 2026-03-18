/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type SessionFormat = {
  title: string;
  description: string;
  icon: string;
  iconAlt: string;
};

interface SessionFormatsInfographicProps {
  formats: SessionFormat[];
}

/**
 * Session formats infographic with parallax and scroll-reveal animations.
 * Uses hasMounted guard so content is visible on SSR and only animates after hydration.
 */
export function SessionFormatsInfographic({ formats }: SessionFormatsInfographicProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Create parallax effects for each format
  const parallaxValues = formats.map((_, index) => {
    const isLeft = index % 2 === 0;
    const direction = isLeft ? 1 : -1;
    const baseAmplitude = 30 + index * 15;

    return useTransform(
      scrollYProgress,
      [0, 1],
      [direction * baseAmplitude, -direction * baseAmplitude]
    );
  });

  // SSR-safe initial values: visible on server, animate only after hydration
  const cardInitial = hasMounted ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 };
  const iconInitial = hasMounted ? { scale: 0, rotateY: 90 } : { scale: 1, rotateY: 0 };
  const lineInitial = hasMounted ? { scaleX: 0 } : { scaleX: 1 };
  const mobileCardInitial = hasMounted ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 };
  const mobileIconInitial = hasMounted ? { scale: 0 } : { scale: 1 };

  return (
    <div ref={containerRef} className="relative px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl">
        {/* Desktop: Grid layout with parallax */}
        <div className="hidden md:block">
          <div className="grid gap-8 md:grid-cols-3">
            {formats.map((format, index) => {
              const yTransform = parallaxValues[index];

              return (
                <motion.article
                  key={format.title}
                  style={{ y: yTransform }}
                  initial={cardInitial}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative"
                >
                  {/* Card */}
                  <div className="border-gold/20 from-night/60 via-night/40 to-night/60 hover:border-gold/50 relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(199,169,98,0.2)]">
                    {/* Animated background gradient */}
                    <div className="from-gold/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Content */}
                    <div className="relative z-10 flex h-full flex-col items-center text-center">
                      {/* Icon container with glow effect */}
                      <motion.div
                        initial={iconInitial}
                        whileInView={{ scale: 1, rotateY: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
                        className="relative mb-6 inline-flex h-20 w-20 items-center justify-center"
                      >
                        {/* Glow background */}
                        <div className="bg-gold/15 absolute inset-0 rounded-full blur-xl" />

                        {/* Icon background circle */}
                        <div className="border-gold/30 from-gold/10 absolute inset-0 rounded-full border bg-gradient-to-br to-transparent" />

                        {/* Icon */}
                        <Image
                          src={format.icon}
                          alt={format.iconAlt}
                          width={40}
                          height={40}
                          className="relative h-10 w-10 object-contain"
                        />
                      </motion.div>

                      {/* Title */}
                      <h3 className="text-gold group-hover:text-gold text-lg font-semibold transition-colors duration-300">
                        {format.title}
                      </h3>

                      {/* Description */}
                      <p className="text-ivory/75 group-hover:text-ivory/90 mt-3 flex-grow text-sm leading-relaxed transition-colors duration-300">
                        {format.description}
                      </p>

                      {/* Bottom accent line */}
                      <motion.div
                        initial={lineInitial}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                        className="from-gold/0 via-gold to-gold/0 mt-6 h-0.5 w-8 origin-center bg-gradient-to-r"
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
          {formats.map((format, index) => (
            <motion.article
              key={format.title}
              initial={mobileCardInitial}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              {/* Mobile card */}
              <div className="border-gold/20 from-night/60 via-night/40 to-night/60 hover:border-gold/50 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-lg backdrop-blur-sm transition-all duration-300">
                {/* Animated background gradient */}
                <div className="from-gold/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon and title */}
                  <div className="flex flex-col items-center">
                    {/* Icon */}
                    <motion.div
                      initial={mobileIconInitial}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="relative mb-4 inline-flex h-16 w-16 items-center justify-center"
                    >
                      {/* Glow background */}
                      <div className="bg-gold/15 absolute inset-0 rounded-full blur-lg" />

                      {/* Icon background circle */}
                      <div className="border-gold/30 from-gold/10 absolute inset-0 rounded-full border bg-gradient-to-br to-transparent" />

                      {/* Icon */}
                      <Image
                        src={format.icon}
                        alt={format.iconAlt}
                        width={32}
                        height={32}
                        className="relative h-8 w-8 object-contain"
                      />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-gold text-base font-semibold">{format.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-ivory/75 mt-4 text-center text-sm leading-relaxed">
                    {format.description}
                  </p>

                  {/* Bottom accent */}
                  <motion.div
                    initial={lineInitial}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: index * 0.1 + 0.15 }}
                    className="mt-4 flex justify-center"
                  >
                    <div className="from-gold/0 via-gold to-gold/0 h-0.5 w-8 bg-gradient-to-r" />
                  </motion.div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
