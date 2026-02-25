'use client';

import { CTAButton } from '../../../components/CTAButton';
import { SectionTitle } from '../../../components/SectionTitle';

export function TherapySections() {
  return (
    <>
      <section
        id="psychotherapie"
        className="px-6 py-20 sm:px-10 lg:px-16"
        data-track-section="psychotherapie"
        data-track-section-name="Psychothérapie"
      >
        <div className="mx-auto max-w-6xl space-y-12 text-center">
          <SectionTitle
            eyebrow="Psychothérapie"
            title="Un accompagnement intime et adapté"
            description="Une séance de psychothérapie est un moment d'exploration intérieure guidé par l'écoute, la bienveillance et la confiance dans les processus naturels de transformation. À travers le dialogue, l'hypnose ou des exercices de présence à soi, nous créons ensemble un espace où les émotions peuvent se dire, les tensions se relâcher et les prises de conscience émerger en douceur. Chaque rencontre est unique, ajustée à votre rythme et à vos besoins du moment, afin de vous aider à renouer avec votre équilibre, votre liberté intérieure et le sens profond que vous voulez donner à votre expérience de vie."
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
              href="/psychotherapie"
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
        id="hypnose"
        className="px-6 py-20 sm:px-10 lg:px-16"
        data-track-section="hypnose"
        data-track-section-name="Hypnose"
      >
        <div className="mx-auto max-w-6xl space-y-12 text-center">
          <SectionTitle
            eyebrow="Hypnose"
            title="Un voyage vers vos ressources internes"
            description="L'hypnose thérapeutique est une pratique douce et efficace qui vous permet d'accéder à vos ressources internes pour surmonter les défis et réaliser des changements profonds. En état de légère conscience modifiée, votre inconscient devient réceptif aux suggestions positives, vous permettant de transformer les patterns limitants et d'activer votre potentiel de guérison. Une expérience bienveillante, respectueuse de votre rythme et de vos besoins."
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
              href="/hypnose"
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
