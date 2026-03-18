'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { useScrollReveal } from '../hooks/useScrollReveal';

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
 * Session formats infographic with scroll-reveal animations.
 * Un seul motion.div par format pour la performance.
 */
export function SessionFormatsInfographic({ formats }: SessionFormatsInfographicProps) {
  const { ref: revealRef, shouldShow, hasMounted } = useScrollReveal({ amount: 0.1 });

  /** Transition instantanée pré-mount ou hide, smooth au reveal. */
  const revealTransition = (delay: number) =>
    !hasMounted || !shouldShow
      ? { duration: 0 }
      : { duration: 0.5, delay, ease: 'easeOut' as const };

  return (
    <div className="relative px-6 py-20 sm:px-10 lg:px-16">
      <div ref={revealRef} className="mx-auto max-w-4xl">
        {/* Desktop */}
        <div className="hidden md:block">
          <div className="grid gap-8 md:grid-cols-3">
            {formats.map((format, index) => (
              <motion.article
                key={format.title}
                initial={false}
                animate={{
                  opacity: shouldShow ? 1 : 0,
                  y: shouldShow ? 0 : 16,
                }}
                transition={revealTransition(index * 0.08)}
                className="group relative"
              >
                <div className="border-gold/20 from-night/60 via-night/40 to-night/60 hover:border-gold/50 relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(199,169,98,0.2)]">
                  <div className="from-gold/5 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative z-10 flex h-full flex-col items-center text-center">
                    {/* Icon — pas de motion.div imbriqué */}
                    <div className="relative mb-6 inline-flex h-20 w-20 items-center justify-center">
                      <div className="bg-gold/15 absolute inset-0 rounded-full blur-xl" />
                      <div className="border-gold/30 from-gold/10 absolute inset-0 rounded-full border bg-gradient-to-br to-transparent" />
                      <Image
                        src={format.icon}
                        alt={format.iconAlt}
                        width={40}
                        height={40}
                        className="relative h-10 w-10 object-contain"
                      />
                    </div>
                    <h3 className="text-gold text-lg font-semibold">{format.title}</h3>
                    <p className="text-ivory/75 mt-3 flex-grow text-sm leading-relaxed">
                      {format.description}
                    </p>
                    <div className="from-gold/0 via-gold to-gold/0 mt-6 h-0.5 w-8 bg-gradient-to-r" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="space-y-6 md:hidden">
          {formats.map((format, index) => (
            <motion.article
              key={format.title}
              initial={false}
              animate={{
                opacity: shouldShow ? 1 : 0,
                x: shouldShow ? 0 : -16,
              }}
              transition={revealTransition(index * 0.08)}
              className="group relative"
            >
              <div className="border-gold/20 from-night/60 via-night/40 to-night/60 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-lg backdrop-blur-sm">
                <div className="relative z-10">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4 inline-flex h-16 w-16 items-center justify-center">
                      <div className="bg-gold/15 absolute inset-0 rounded-full blur-lg" />
                      <div className="border-gold/30 from-gold/10 absolute inset-0 rounded-full border bg-gradient-to-br to-transparent" />
                      <Image
                        src={format.icon}
                        alt={format.iconAlt}
                        width={32}
                        height={32}
                        className="relative h-8 w-8 object-contain"
                      />
                    </div>
                    <h3 className="text-gold text-base font-semibold">{format.title}</h3>
                  </div>
                  <p className="text-ivory/75 mt-4 text-center text-sm leading-relaxed">
                    {format.description}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <div className="from-gold/0 via-gold to-gold/0 h-0.5 w-8 bg-gradient-to-r" />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
