'use client';

import { CTAButton } from '../../../components/CTAButton';
import { SectionTitle } from '../../../components/SectionTitle';

export function TherapySections() {
  return (
    <>
      <section
        id="sophrologie"
        className="px-6 py-20 sm:px-10 lg:px-16"
        data-track-section="sophrologie"
        data-track-section-name="Sophrologie & Relaxation"
      >
        <div className="mx-auto max-w-6xl space-y-12 text-center">
          <SectionTitle
            eyebrow="Sophrologie & Relaxation"
            title="Retrouver le calme et l'harmonie intérieure"
            description="La sophrologie et la relaxation sont des approches douces qui vous aident à relâcher les tensions, apaiser le mental et retrouver un équilibre entre le corps et l'esprit. À travers des exercices de respiration, de détente musculaire et de visualisation positive, vous apprenez à mieux gérer le stress, à améliorer votre sommeil et à développer une présence à vous-même plus sereine. Chaque séance est adaptée à vos besoins et à votre rythme, dans un cadre bienveillant et sécurisant."
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              className="mt-auto"
              href="/demande-rendez-vous"
              animationProps={{
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.7, ease: 'easeOut' },
              }}
            >
              Demander un rendez-vous
            </CTAButton>
            <CTAButton
              variant="secondary"
              className="mt-auto"
              href="/sophrologie"
              animationProps={{
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.8, ease: 'easeOut' },
              }}
            >
              En savoir plus
            </CTAButton>
          </div>
        </div>
      </section>
      <section
        id="somatotherapie"
        className="px-6 py-20 sm:px-10 lg:px-16"
        data-track-section="somatotherapie"
        data-track-section-name="Somatothérapie"
      >
        <div className="mx-auto max-w-6xl space-y-12 text-center">
          <SectionTitle
            eyebrow="Somatothérapie"
            title="Écouter le corps pour libérer l'esprit"
            description="La somatothérapie est une approche corporelle qui considère le corps comme le reflet de notre histoire émotionnelle. En travaillant sur les tensions, les blocages et les mémoires inscrites dans le corps, cette pratique permet de libérer ce qui pèse, de retrouver de la fluidité et de renouer avec ses ressources profondes. Par le toucher, la respiration et l'écoute du corps, vous cheminez vers un mieux-être global, une meilleure connaissance de vous-même et une harmonie retrouvée entre le physique et le psychique."
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CTAButton
              variant="primary"
              className="mt-auto"
              href="/demande-rendez-vous"
              animationProps={{
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.9, ease: 'easeOut' },
              }}
            >
              Demander un rendez-vous
            </CTAButton>
            <CTAButton
              variant="secondary"
              className="mt-auto"
              href="/somatotherapie"
              animationProps={{
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 1.0, ease: 'easeOut' },
              }}
            >
              En savoir plus
            </CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}
