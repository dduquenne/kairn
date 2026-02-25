'use client';

import { CTAButton } from '../../../components/CTAButton';
import { JourneyInfographic } from '../../../components/JourneyInfographic';
import { SectionTitle } from '../../../components/SectionTitle';

export function JourneySection() {
  return (
    <section
      className="px-6 py-20 sm:px-10 lg:px-16"
      data-track-section="parcours"
      data-track-section-name="Parcours"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle
          eyebrow="Votre voyage"
          title="Trois étapes pour activer votre transformation"
        />
        <JourneyInfographic />
        <div className="flex justify-center">
          <CTAButton
            variant="primary"
            href="/demande-rendez-vous"
            animationProps={{
              initial: { opacity: 0, y: 24 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.8, delay: 0.5, ease: 'easeOut' },
            }}
          >
            Demander un rendez-vous
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
