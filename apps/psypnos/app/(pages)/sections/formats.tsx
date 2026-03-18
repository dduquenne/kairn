'use client';

import { CTAButton } from '../../../components/CTAButton';
import { SectionTitle } from '../../../components/SectionTitle';
import { SessionFormatsInfographic } from '../../../components/SessionFormatsInfographic';

type SessionFormat = {
  title: string;
  description: string;
  icon: string;
  iconAlt: string;
};

const sessionFormats: SessionFormat[] = [
  {
    title: 'En présentiel',
    description:
      'Rencontres dans un cadre bienveillant et sécurisant, face à face pour une connexion authentique.',
    icon: '/images/icons/seance-presentiel.svg',
    iconAlt: 'Icône représentant une séance en présentiel',
  },
  {
    title: 'Par visioconférence',
    description:
      'Séances depuis le confort de votre domicile, avec la même qualité et présence thérapeutique.',
    icon: '/images/icons/seance-visioconference.svg',
    iconAlt: 'Icône représentant une séance par visioconférence',
  },
  {
    title: 'Par téléphone',
    description:
      'Un accompagnement vocal pour ceux qui préfèrent cette approche, pratique et tout aussi efficace.',
    icon: '/images/icons/seance-telephone.svg',
    iconAlt: 'Icône représentant une séance par téléphone',
  },
];

export function SessionFormatsSection() {
  return (
    <section
      id="formats-seance"
      className="px-6 py-12 sm:px-10 sm:py-20 lg:px-16"
      data-track-section="formats"
      data-track-section-name="Formats de séance"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle
          eyebrow="Formats flexibles"
          title="Séances adaptées à votre mode de vie"
          description="Que vous préfériez une rencontre en face à face, une session par visioconférence ou un accompagnement par téléphone, je m'adapte à vos besoins. Chaque format offre la même qualité de présence et d'écoute thérapeutique pour soutenir votre transformation."
        />
        <SessionFormatsInfographic formats={sessionFormats} />
        <div className="flex justify-center">
          <CTAButton variant="primary" href="/demande-rendez-vous">
            Demander un rendez-vous
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
