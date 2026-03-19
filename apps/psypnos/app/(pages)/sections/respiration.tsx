'use client';

import { CTAButton } from '../../../components/CTAButton';
import GoldGlowImage from '../../../components/GoldGlowImage';
import { SectionTitle } from '../../../components/SectionTitle';

/**
 * Section Respiration holotropique — animations CSS légères.
 * Remplace les motion.div + whileInView par des animations CSS
 * pour éviter les problèmes SSR (initial={{ opacity: 0 }} invisible côté serveur).
 */
export function RespirationSection() {
  return (
    <section
      id="respiration-holotropique"
      className="from-night via-night/95 to-night bg-gradient-to-br px-6 py-12 sm:px-10 sm:py-20 lg:px-16"
      data-track-section="respiration"
      data-track-section-name="Respiration holotropique"
    >
      <div className="mx-auto max-w-5xl space-y-12">
        <SectionTitle
          eyebrow="Respiration holotropique"
          title="Le corps est le chemin. Le souffle est le guide."
          description="La Respiration Holotropique ouvre une porte à un voyage intérieur extraordinaire. Porté par la respiration, la musique et un travail corporel spécifiques, ce voyage vous emmène dans des espaces d'introspection, d'enseignement, de libération, de guérison ou encore d'éveil.
Avec sécurité et bienveillance, nous vous offrons l'opportunité de vous accompagner tout au long de votre voyage. Celui-ci vous aidera à accéder à une meilleure compréhension de vous-même pour mieux vous éclairer sur votre chemin de vie dans vos projets comme dans vos relations.
"
        />
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="items-normal flex flex-col justify-center space-y-6 text-left">
            {[
              'Un lieu magique dans un magnifique moulin bourguignon',
              'Un accompagnement bienveillant et respectueux',
              'Une préparation personnalisée pour définir vos intentions',
              'Une musique immersive et un support corporel sécurisant',
              'Une exploration intérieure et une libération des blocages',
              "Un temps d'intégration avec dessin, écriture et partage",
              'Une expérience immersive et transformante',
            ].map(item => (
              <div key={item} className="flex items-start gap-4">
                <span className="bg-gold/20 text-gold mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full">
                  <span className="text-lg font-bold">+</span>
                </span>
                <p className="text-ivory/80">{item}</p>
              </div>
            ))}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <CTAButton variant="primary" href="/inscription-seminaire">
                S&apos;inscrire à un séminaire
              </CTAButton>
              <CTAButton variant="secondary" href="/respiration-holotropique">
                En savoir plus
              </CTAButton>
            </div>
          </div>
          <div className="relative overflow-hidden">
            <GoldGlowImage
              src="/images/Moulin_d_en_Bas.webp"
              alt="Le Moulin d'en Bas"
              width={480}
              height={480}
              shadowBlur={34}
              shadowOpacity={0.92}
              className="rounded-full"
            />
            <div
              className="from-night/40 via-night/15 absolute inset-0 bg-gradient-to-tr to-transparent"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}
