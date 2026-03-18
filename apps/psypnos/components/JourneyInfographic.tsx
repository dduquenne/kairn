'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { useScrollReveal } from '../hooks/useScrollReveal';

type JourneyStep = {
  number: number;
  title: string;
  description: string;
  icon: string;
  iconAlt: string;
};

const steps: JourneyStep[] = [
  {
    number: 1,
    title: 'Acceptation',
    description:
      'Reconnaître pleinement ce qui est vécu, sans jugement, pour apaiser la résistance et ouvrir un espace de transformation.',
    icon: '/images/icons/journey-acceptation.svg',
    iconAlt: 'Acceptation',
  },
  {
    number: 2,
    title: 'Exploration',
    description:
      "Aller à la rencontre des émotions, des pensées et des expériences profondes afin d'en comprendre le sens et les messages.",
    icon: '/images/icons/journey-exploration.svg',
    iconAlt: 'Exploration',
  },
  {
    number: 3,
    title: 'Intégration',
    description:
      "Transformer ces prises de conscience en nouveaux équilibres intérieurs, pour retrouver cohérence, alignement et liberté d'être.",
    icon: '/images/icons/journey-integration.svg',
    iconAlt: 'Intégration',
  },
];

/**
 * Journey infographic with scroll-reveal animations.
 * Un seul motion.div par step pour la performance.
 */
export function JourneyInfographic() {
  const { ref: revealRef, shouldShow, hasMounted } = useScrollReveal({ amount: 0.1 });

  /** Transition instantanée pré-mount ou hide, smooth au reveal. */
  const revealTransition = (delay: number) =>
    !hasMounted || !shouldShow
      ? { duration: 0 }
      : { duration: 0.5, delay, ease: 'easeOut' as const };

  return (
    <section className="relative px-6 py-20 sm:px-10 lg:px-16">
      <div ref={revealRef} className="mx-auto max-w-6xl space-y-16">
        {/* Desktop */}
        <div className="hidden md:block">
          <div className="relative h-96">
            <div className="relative flex h-full items-center justify-between">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={false}
                  animate={{
                    opacity: shouldShow ? 1 : 0,
                    y: shouldShow ? 0 : 20,
                  }}
                  transition={revealTransition(index * 0.15)}
                  className="flex w-1/3 flex-col items-center px-4"
                >
                  <div className={index !== 1 ? 'mb-32' : 'mb-0'}>
                    {/* Step circle — pas de motion.div imbriqué */}
                    <div className="border-gold bg-night/60 relative mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-lg">
                      <div className="bg-gold/10 absolute inset-0 rounded-full blur-xl" />
                      <Image
                        src={step.icon}
                        alt={step.iconAlt}
                        width={32}
                        height={32}
                        className="relative h-8 w-8 object-contain"
                      />
                      <div className="border-gold bg-night text-gold absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold">
                        {step.number}
                      </div>
                    </div>

                    {/* Content card — pas de motion.div imbriqué */}
                    <div className="border-gold/20 from-night/50 to-night/30 rounded-2xl border bg-gradient-to-br p-6 text-center shadow-lg backdrop-blur-sm">
                      <h3 className="text-gold text-xl font-semibold">{step.title}</h3>
                      <p className="text-ivory/75 mt-3 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="space-y-8 md:hidden">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={false}
              animate={{
                opacity: shouldShow ? 1 : 0,
                x: shouldShow ? 0 : -16,
              }}
              transition={revealTransition(index * 0.1)}
              className="flex gap-6"
            >
              {/* Timeline line and circle */}
              <div className="relative flex flex-col items-center">
                <div className="border-gold bg-night/60 relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 shadow-lg">
                  <div className="bg-gold/10 absolute inset-0 rounded-full blur-xl" />
                  <Image
                    src={step.icon}
                    alt={step.iconAlt}
                    width={28}
                    height={28}
                    className="relative h-7 w-7 object-contain"
                  />
                  <div className="border-gold bg-night text-gold absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold">
                    {step.number}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="from-gold mt-4 h-12 w-0.5 bg-gradient-to-b to-transparent" />
                )}
              </div>

              {/* Content */}
              <div className="border-gold/20 from-night/50 to-night/30 flex-1 rounded-xl border bg-gradient-to-br p-4 shadow-md backdrop-blur-sm">
                <h3 className="text-gold text-lg font-semibold">{step.title}</h3>
                <p className="text-ivory/75 mt-2 text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
