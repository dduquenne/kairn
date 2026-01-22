// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

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
    title: "Acceptation",
    description: "Reconnaître pleinement ce qui est vécu, sans jugement, pour apaiser la résistance et ouvrir un espace de transformation.",
    icon: "/images/icons/journey-acceptation.svg",
    iconAlt: "Acceptation",
  },
  {
    number: 2,
    title: "Exploration",
    description: "Aller à la rencontre des émotions, des pensées et des expériences profondes afin d'en comprendre le sens et les messages.",
    icon: "/images/icons/journey-exploration.svg",
    iconAlt: "Exploration",
  },
  {
    number: 3,
    title: "Intégration",
    description: "Transformer ces prises de conscience en nouveaux équilibres intérieurs, pour retrouver cohérence, alignement et liberté d'être.",
    icon: "/images/icons/journey-integration.svg",
    iconAlt: "Intégration",
  },
];

export function JourneyInfographic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  // Parallax effects for each step
  const step1Y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const step2Y = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const step3Y = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section ref={containerRef} className="relative px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="hidden md:block">
          <div className="relative h-96">
            {/* Steps container */}
            <div className="relative flex h-full items-center justify-between">
              {steps.map((step, index) => {
                const yTransform = [step1Y, step2Y, step3Y][index];

                return (
                  <motion.div
                    key={step.number}
                    style={{ y: yTransform }}
                    className="flex w-1/3 flex-col items-center px-4"
                  >
                    {/* Positioning: odd steps on top, even in middle */}
                    <div className={index !== 1 ? "mb-32" : "mb-0"}>
                      {/* Step circle */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-night/60 shadow-lg"
                      >
                        {/* Icon background glow */}
                        <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl" />

                        {/* SVG Icon */}
                        <Image
                          src={step.icon}
                          alt={step.iconAlt}
                          width={32}
                          height={32}
                          className="relative h-8 w-8 object-contain"
                        />

                        {/* Step number */}
                        <div className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold bg-night text-sm font-bold text-gold">
                          {step.number}
                        </div>
                      </motion.div>

                      {/* Content card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.6, delay: index * 0.2 + 0.2 }}
                        className="rounded-2xl border border-gold/20 bg-gradient-to-br from-night/50 to-night/30 p-6 text-center shadow-lg backdrop-blur-sm"
                      >
                        <h3 className="text-xl font-semibold text-gold">{step.title}</h3>
                        <p className="mt-3 text-sm text-ivory/75 leading-relaxed">
                          {step.description}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="space-y-8 md:hidden">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex gap-6"
            >
              {/* Timeline line and circle */}
              <div className="relative flex flex-col items-center">
                {/* Circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-gold bg-night/60 shadow-lg"
                >
                  <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl" />

                  {/* SVG Icon */}
                  <Image
                    src={step.icon}
                    alt={step.iconAlt}
                    width={28}
                    height={28}
                    className="relative h-7 w-7 object-contain"
                  />

                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-gold bg-night text-xs font-bold text-gold">
                    {step.number}
                  </div>
                </motion.div>

                {/* Vertical line connector */}
                {index < steps.length - 1 && (
                  <div className="mt-4 h-12 w-0.5 bg-gradient-to-b from-gold to-transparent" />
                )}
              </div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
                className="flex-1 rounded-xl border border-gold/20 bg-gradient-to-br from-night/50 to-night/30 p-4 shadow-md backdrop-blur-sm"
              >
                <h3 className="text-lg font-semibold text-gold">{step.title}</h3>
                <p className="mt-2 text-sm text-ivory/75 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
