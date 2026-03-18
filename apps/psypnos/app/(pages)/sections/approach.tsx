'use client';

import { ApproachInfographic } from '../../../components/ApproachInfographic';
import { CTAButton } from '../../../components/CTAButton';
import { SectionTitle } from '../../../components/SectionTitle';

type ApproachItem = {
  title: string;
  description: string;
  icon: string;
  iconAlt: string;
};

const approachItems: ApproachItem[] = [
  {
    title: 'Anxiété',
    description:
      "Je vous aide à comprendre ce qui déclenche votre anxiété et à apaiser les mécanismes qui l'entretiennent. Grâce à l'hypnose et à des outils de respiration et de recentrage, vous apprenez à calmer votre corps et votre esprit, jusqu'à retrouver progressivement un sentiment de confiance et de sécurité intérieure.",
    icon: '/images/icons/anxiete.svg',
    iconAlt: 'Picto représentant des ondes apaisées',
  },
  {
    title: 'Dépression',
    description:
      "Je vous accompagne pour rallumer la flamme intérieure qui semble s'être affaiblie. En explorant vos émotions, vos croyances et votre rapport à vous-même, vous redécouvrez votre énergie de vie et la capacité de vous sentir à nouveau pleinement vivant, au-delà du simple fait d'aller mieux.",
    icon: '/images/icons/depression.svg',
    iconAlt: 'Picto représentant un soleil se levant',
  },
  {
    title: 'Stress',
    description:
      "Je vous offre un espace pour comprendre ce qui vous pèse et transformer votre manière de réagir face aux pressions du quotidien. Par l'hypnose, la respiration et la pleine présence, vous libérez les tensions accumulées et retrouvez votre calme naturel, en renouant avec votre capacité d'adaptation sans épuisement.",
    icon: '/images/icons/stress.svg',
    iconAlt: 'Picto représentant des vagues harmonieuses',
  },
  {
    title: 'Burn-out',
    description:
      'Je vous aide à restaurer le repos et la sécurité intérieure nécessaires à votre reconstruction. Ensemble, nous explorons ce qui a conduit à cet épuisement — votre rythme, vos exigences, votre rapport au travail ou aux autres — afin de reconstruire une énergie plus juste et un mode de vie plus équilibré.',
    icon: '/images/icons/burnout.svg',
    iconAlt: 'Picto représentant une flamme protectrice',
  },
  {
    title: 'Crise de vie',
    description:
      "Je vous accompagne dans ces périodes de bouleversement pour vous aider à y voir plus clair et à en saisir le sens. Grâce à l'hypnose et à la psychothérapie transpersonnelle, vous apprenez à accueillir vos émotions, à transformer vos questionnements en leviers d'évolution et à retrouver une direction intérieure plus alignée.",
    icon: '/images/icons/crise-de-vie.svg',
    iconAlt: 'Picto représentant une boussole lumineuse',
  },
  {
    title: 'Deuil',
    description:
      "Je vous aide à traverser la douleur du deuil tout en apprivoisant l'absence. Par un travail d'accueil des émotions et de reconnexion à la continuité du lien, vous apprenez à vivre autrement cette relation, non pas en oubliant, mais en retrouvant la paix et un nouvel équilibre intérieur.",
    icon: '/images/icons/deuil.svg',
    iconAlt: 'Picto représentant un cœur bienveillant',
  },
];

export function ApproachSection() {
  return (
    <section
      id="approche"
      className="px-6 py-12 sm:px-10 sm:py-20 lg:px-16"
      data-track-section="approche"
      data-track-section-name="Approche"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle
          eyebrow="Mon approche"
          title="Une présence douce dans les profondeurs de la conscience"
          description="Grâce à des méthodes telles que la psychothérapie transpersonnelle, l'hypnose ericksonienne, la cohérence cardiaque, l'EFT et la respiration holotropique, je propose une présence bienveillante et des outils efficaces pour vous permettre d'explorer vos émotions, libérer des traumatismes et traverser des étapes difficiles de votre vie, notamment le deuil. Mon objectif est de créer un espace sécurisant où vous pourrez exprimer vos ressentis, comprendre vos mécanismes intérieurs et trouver des solutions concrètes pour avancer. Ensemble, nous cheminerons vers un équilibre émotionnel et une plus grande harmonie intérieure."
        />
        <ApproachInfographic items={approachItems} />
        <div className="flex justify-center">
          <CTAButton
            variant="primary"
            href="/demande-rendez-vous"
            animationProps={{
              initial: { opacity: 0, y: 24 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.8, delay: 0.3, ease: 'easeOut' },
            }}
          >
            Demander un rendez-vous
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
