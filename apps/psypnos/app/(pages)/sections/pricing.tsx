'use client';

import { useRef, useEffect, useState } from 'react';

import { CTAButton } from '../../../components/CTAButton';
import { SectionTitle } from '../../../components/SectionTitle';

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !containerRef.current) return;

      const sectionTop = sectionRef.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      // Only apply parallax when section is in viewport
      if (sectionTop < windowHeight && sectionTop > -sectionRef.current.offsetHeight) {
        const progress =
          (windowHeight - sectionTop) / (windowHeight + sectionRef.current.offsetHeight);
        setOffset(progress * 30); // Parallax intensity
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="tarifs"
      className="relative overflow-hidden px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24"
      data-track-section="tarifs"
      data-track-section-name="Tarifs"
    >
      {/* Parallax background elements */}
      <div
        className="from-gold/5 to-gold/0 absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br blur-3xl"
        style={{ transform: `translateY(${offset * 0.5}px)` }}
      />
      <div
        className="from-gold/5 to-gold/0 absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-gradient-to-tr blur-3xl"
        style={{ transform: `translateY(${-offset * 0.5}px)` }}
      />

      <div
        ref={containerRef}
        className="relative z-10 mx-auto max-w-6xl"
        style={{ transform: `translateY(${offset * 0.3}px)` }}
      >
        {/* Content Grid */}
        <div className="flex flex-col lg:items-center">
          <div className="mx-auto flex-col space-y-8">
            <SectionTitle
              eyebrow="Tarifs"
              title="Un accompagnement accessible pour tous"
              description="La durée d'une séance est de 1 heure. Le réglement peut s'effectuer par chèque, virement ou espèces. Chaque demande de tarif solidaire est étudiée au cas par cas, avec respect et discrétion. L'objectif est de permettre à chacun d'accéder à un accompagnement de qualité."
            />

            {/* Pricing cards - Responsive grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:items-center">
              {/* Standard pricing card */}
              <div className="border-gold from-night/80 to-night/60 shadow-night/40 hover:border-gold hover:shadow-gold/40 group relative w-full rounded-3xl border bg-gradient-to-br p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl sm:p-8">
                <div className="from-gold/30 to-gold/0 group-hover:from-gold/40 group-hover:to-gold/0 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-300" />
                <div className="relative">
                  <p className="text-gold text-xs font-semibold uppercase tracking-wider sm:text-sm">
                    Séance standard
                  </p>
                  <p className="text-ivory mt-4 text-4xl font-bold sm:text-5xl">70 €</p>
                  <p className="text-ivory/75 mt-3 text-sm leading-relaxed">
                    Psychothérapie et/ou hypnose selon vos besoins.
                  </p>
                </div>
              </div>

              {/* Solidarity pricing card */}
              <div className="border-gold/50 from-night/80 to-night/60 shadow-night/40 hover:border-gold/50 hover:shadow-gold/10 group relative w-full rounded-3xl border bg-gradient-to-br p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl sm:p-8">
                <div className="from-gold/10 to-gold/0 group-hover:from-gold/30 group-hover:to-gold/0 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-300" />
                <div className="relative">
                  <p className="text-gold text-xs font-semibold uppercase tracking-wider sm:text-sm">
                    Tarif solidaire
                  </p>
                  <p className="text-ivory mt-4 text-4xl font-bold sm:text-5xl">40–50 €</p>
                  <p className="text-ivory/75 mt-3 text-sm leading-relaxed">
                    Accessible sur demande aux personnes en difficulté.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center">
              <CTAButton
                variant="primary"
                href="/demande-rendez-vous"
                className="inline-flex w-auto"
                animationProps={{
                  initial: { opacity: 0, y: 24 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.8, delay: 1.3, ease: 'easeOut' },
                }}
              >
                Demander un rendez-vous
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
