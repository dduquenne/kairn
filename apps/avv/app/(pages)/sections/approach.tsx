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
    title: 'Stress',
    description:
      "Je vous aide à identifier les sources de stress dans votre quotidien et à y répondre autrement. Grâce à la sophrologie, la relaxation et des exercices de respiration, vous apprenez à relâcher les tensions, à retrouver votre calme intérieur et à développer une capacité durable à faire face aux pressions de la vie.",
    icon: '/images/icons/stress.svg',
    iconAlt: 'Picto représentant des vagues harmonieuses',
  },
  {
    title: 'Tensions corporelles',
    description:
      "Je vous accompagne pour écouter votre corps et libérer les tensions qui s'y sont installées. Par la somatothérapie et des techniques de relaxation profonde, vous apprenez à relâcher les blocages physiques, à retrouver de la fluidité dans vos mouvements et à renouer avec un confort corporel au quotidien.",
    icon: '/images/icons/tensions-corporelles.svg',
    iconAlt: 'Picto représentant un corps détendu',
  },
  {
    title: 'Troubles du sommeil',
    description:
      "Je vous propose des outils concrets pour retrouver un sommeil réparateur. Par la sophrologie, la cohérence cardiaque et des exercices de détente, vous apprenez à apaiser votre mental, à relâcher les tensions du corps et à créer les conditions d'un endormissement naturel et d'un repos profond.",
    icon: '/images/icons/sommeil.svg',
    iconAlt: 'Picto représentant une lune apaisante',
  },
  {
    title: 'Fatigue',
    description:
      "Je vous aide à comprendre l'origine de votre fatigue et à restaurer votre vitalité. En combinant relaxation, respiration et travail corporel, vous rechargez vos ressources intérieures, retrouvez un rythme plus juste et apprenez à préserver votre énergie au quotidien.",
    icon: '/images/icons/fatigue.svg',
    iconAlt: 'Picto représentant une flamme protectrice',
  },
  {
    title: 'Gestion des émotions',
    description:
      "Je vous accompagne pour mieux comprendre vos émotions et apprendre à les accueillir sans être submergé. Grâce à la sophrologie et au travail corporel, vous développez une conscience plus fine de vos ressentis et acquérez des outils pour traverser les moments d'intensité émotionnelle avec plus de sérénité.",
    icon: '/images/icons/emotions.svg',
    iconAlt: 'Picto représentant des ondes apaisées',
  },
  {
    title: 'Confiance en soi',
    description:
      "Je vous aide à retrouver la confiance en vous et en vos capacités. Par un travail alliant sophrologie, visualisation et ancrage corporel, vous renforcez l'estime de vous-même, apprenez à vous affirmer avec douceur et retrouvez la force intérieure nécessaire pour avancer dans vos projets de vie.",
    icon: '/images/icons/confiance.svg',
    iconAlt: 'Picto représentant une étoile lumineuse',
  },
];

export function ApproachSection() {
  return (
    <section
      id="approche"
      className="px-6 py-20 sm:px-10 lg:px-16"
      data-track-section="approche"
      data-track-section-name="Approche"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle
          eyebrow="Mon approche"
          title="Une approche globale au service de votre bien-être"
          description="Grâce à des méthodes telles que la sophrologie, la relaxation, la somatothérapie, le breathwork, la cohérence cardiaque et le reiki, je propose une présence bienveillante et des outils concrets pour vous aider à relâcher les tensions, retrouver votre vitalité et développer vos ressources intérieures. Mon objectif est de créer un espace sécurisant où vous pourrez vous reconnecter à votre corps, apaiser votre mental et retrouver un équilibre durable. Ensemble, nous cheminerons vers une harmonie entre le corps et l'esprit."
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
