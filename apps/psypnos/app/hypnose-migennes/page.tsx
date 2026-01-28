import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnose Migennes | Hypnothérapeute proche | Psypnos',
  description:
    'Hypnose ericksonienne près de Migennes. David Duquenne, hypnothérapeute à 25 min. Séances pour arrêt tabac, anxiété, phobies, sommeil.',
  keywords: [
    'hypnose Migennes',
    'hypnothérapeute Migennes',
    'hypnose ericksonienne Migennes',
    'arrêt tabac Migennes',
  ],
  openGraph: {
    title: 'Hypnose près de Migennes - David Duquenne',
    description: 'Cabinet d\'hypnose ericksonienne accessible depuis Migennes.',
    url: 'https://psypnos.fr/hypnose-migennes',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnose-migennes',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnose-migennes',
  name: 'Psypnos - Hypnose près de Migennes',
  medicalSpecialty: 'Hypnotherapy',
  areaServed: { '@type': 'City', name: 'Migennes' },
  provider: { '@type': 'Person', name: 'David Duquenne' },
};

const mainContent = `
<p>Vous habitez <strong>Migennes</strong> et souhaitez découvrir l'hypnose ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à seulement <strong>25 minutes</strong> de Migennes.</p>

<p>L'<strong>hypnose ericksonienne</strong> est une méthode thérapeutique naturelle et respectueuse, qui utilise les ressources de l'inconscient pour favoriser le changement.</p>

<h3>L'hypnose pour les habitants de Migennes</h3>

<p>Les Migennois et habitants des communes voisines (Cheny, Laroche-Saint-Cydroine, Bassou...) consultent en hypnose pour :</p>
<ul>
  <li><strong>Arrêter de fumer</strong> : méthode naturelle et efficace</li>
  <li><strong>Gérer l'anxiété</strong> : retrouver la sérénité</li>
  <li><strong>Vaincre les phobies</strong> : se libérer des peurs</li>
  <li><strong>Améliorer le sommeil</strong> : retrouver des nuits réparatrices</li>
  <li><strong>Perdre du poids</strong> : modifier sa relation à l'alimentation</li>
  <li><strong>Gagner en confiance</strong> : renforcer l'estime de soi</li>
</ul>

<h3>Comment fonctionne l'hypnose ericksonienne ?</h3>

<p>L'hypnose ericksonienne est une approche douce qui respecte votre rythme et votre personnalité. Elle se caractérise par :</p>
<ul>
  <li><strong>Une approche permissive</strong> : pas d'ordres, mais des suggestions</li>
  <li><strong>Le respect de vos valeurs</strong> : l'hypnose ne peut pas vous faire faire ce que vous refusez</li>
  <li><strong>L'utilisation de métaphores</strong> : des histoires qui parlent à l'inconscient</li>
  <li><strong>L'activation de vos ressources</strong> : vous avez en vous les clés du changement</li>
</ul>

<h3>Déroulement d'une séance</h3>

<p>Une séance d'hypnose dure environ <strong>1h à 1h30</strong> :</p>
<ol>
  <li><strong>Accueil</strong> : nous échangeons sur votre objectif et vos attentes</li>
  <li><strong>Induction</strong> : je vous guide vers un état de relaxation profonde</li>
  <li><strong>Travail hypnotique</strong> : suggestions, métaphores, visualisations</li>
  <li><strong>Retour</strong> : vous revenez progressivement à l'état de veille</li>
  <li><strong>Échange</strong> : nous débriefons sur votre vécu</li>
</ol>

<h3>Un cadre propice au changement</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un environnement idéal pour l'hypnose : calme, naturel, ressourçant. Le Moulin d'en Bas vous accueille dans un espace préservé, propice à la détente et à la transformation.</p>
`;

const benefits = [
  'À 25 min de Migennes',
  'Hypnose ericksonienne certifiée',
  'Approche douce et respectueuse',
  'Cadre naturel apaisant',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Résultats souvent rapides',
];

const testimonials = [
  {
    content: 'J\'ai consulté pour arrêter de fumer. Après 2 séances, j\'ai définitivement arrêté. Ça fait maintenant un an !',
    author: 'Christophe R.',
    location: 'Migennes',
  },
  {
    content: 'L\'hypnose m\'a aidée à surmonter ma peur de parler en public. Je peux maintenant faire des présentations au travail sereinement.',
    author: 'Sandrine V.',
    location: 'Cheny',
  },
];

const practicalInfo = {
  distance: '20 km',
  duration: '25 min',
  directions: 'Depuis Migennes, D943 direction Sens. Le cabinet est à l\'entrée de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Hypnose Yonne', href: '/hypnose-yonne' },
  { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
  { label: 'Psychothérapie Migennes', href: '/psychotherapie-migennes' },
];

export default function HypnoseMigennesPage() {
  return (
    <GeoPage
      title="Hypnose près de Migennes"
      subtitle="Séances d'hypnose ericksonienne à 25 minutes de Migennes"
      description="David Duquenne, hypnothérapeute, accompagne les habitants de Migennes par l'hypnose ericksonienne."
      service="hypnose"
      location={{ city: 'Migennes', department: '89' }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnose Migennes', href: '/hypnose-migennes' },
      ]}
      mainContent={mainContent}
      benefits={benefits}
      testimonials={testimonials}
      practicalInfo={practicalInfo}
      relatedLinks={relatedLinks}
      schemaData={schemaData}
    />
  );
}
