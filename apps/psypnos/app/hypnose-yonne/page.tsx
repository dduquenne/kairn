import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnose Yonne | Thérapeute dans le 89 | Psypnos',
  description:
    'Hypnose ericksonienne dans l\'Yonne (89). David Duquenne, hypnothérapeute à Saint-Julien-du-Sault. Séances pour anxiété, phobies, arrêt tabac, confiance en soi.',
  keywords: [
    'hypnose Yonne',
    'hypnothérapeute 89',
    'hypnose ericksonienne Yonne',
    'hypnose anxiété Yonne',
    'hypnose arrêt tabac Yonne',
    'hypnose phobies Yonne',
    'hypnothérapie Bourgogne',
  ],
  openGraph: {
    title: 'Hypnose Yonne - Thérapeute David Duquenne',
    description: 'Séances d\'hypnose ericksonienne dans l\'Yonne. Accompagnement pour anxiété, phobies, addictions.',
    url: 'https://psypnos.fr/hypnose-yonne',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnose-yonne',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnose-yonne',
  name: 'Psypnos - Hypnose Yonne',
  description: 'Séances d\'hypnose ericksonienne pour les habitants de l\'Yonne',
  url: 'https://psypnos.fr/hypnose-yonne',
  medicalSpecialty: 'Hypnotherapy',
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Yonne',
  },
  provider: {
    '@type': 'Person',
    name: 'David Duquenne',
    jobTitle: 'Thérapeute',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: "Le Moulin d'en Bas",
    addressLocality: 'Saint-Julien-du-Sault',
    postalCode: '89330',
    addressCountry: 'FR',
  },
};

const mainContent = `
<p>Vous recherchez un <strong>hypnothérapeute dans l'Yonne</strong> ? David Duquenne pratique l'<strong>hypnose ericksonienne</strong> à Saint-Julien-du-Sault, au cœur du département de l'Yonne (89).</p>

<p>L'hypnose ericksonienne est une approche douce et respectueuse qui utilise l'état naturel de transe pour favoriser le changement. Elle tire son nom de Milton Erickson, psychiatre américain qui a révolutionné la pratique de l'hypnose thérapeutique.</p>

<h3>Qu'est-ce que l'hypnose ericksonienne ?</h3>

<p>Contrairement aux idées reçues, l'hypnose n'est pas un état de perte de contrôle. C'est un <strong>état modifié de conscience</strong> naturel, que nous expérimentons tous au quotidien (absorption dans un film, conduite automatique...).</p>

<p>En séance, cet état est amplifié et utilisé pour :</p>
<ul>
  <li>Accéder aux ressources inconscientes</li>
  <li>Modifier des schémas de pensée limitants</li>
  <li>Libérer des émotions bloquées</li>
  <li>Favoriser des changements de comportement</li>
</ul>

<h3>Pour quels problèmes consulter ?</h3>

<p>L'hypnose ericksonienne est particulièrement efficace pour :</p>
<ul>
  <li><strong>Anxiété et stress</strong> : gestion des angoisses, réduction du stress chronique</li>
  <li><strong>Phobies</strong> : peur de l'avion, claustrophobie, phobie sociale...</li>
  <li><strong>Addictions</strong> : arrêt du tabac, gestion de l'alimentation</li>
  <li><strong>Troubles du sommeil</strong> : insomnie, difficultés d'endormissement</li>
  <li><strong>Confiance en soi</strong> : estime de soi, affirmation</li>
  <li><strong>Douleurs</strong> : accompagnement des douleurs chroniques</li>
  <li><strong>Préparation mentale</strong> : examens, compétitions, événements importants</li>
</ul>

<h3>Un cabinet accessible dans toute l'Yonne</h3>

<p>Le cabinet de Saint-Julien-du-Sault est idéalement situé pour les habitants de tout le département :</p>
<ul>
  <li>À 25 km de Sens (25 min)</li>
  <li>À 12 km de Joigny (15 min)</li>
  <li>À 35 km d'Auxerre (40 min)</li>
  <li>À 20 km de Migennes (25 min)</li>
</ul>

<h3>Déroulement d'une séance d'hypnose</h3>

<p>Une séance dure environ <strong>1h à 1h30</strong> et se déroule en plusieurs temps :</p>
<ol>
  <li><strong>Entretien</strong> : nous clarifions votre objectif et votre état actuel</li>
  <li><strong>Induction</strong> : je vous guide vers un état de relaxation profonde</li>
  <li><strong>Travail hypnotique</strong> : suggestions, métaphores, exploration</li>
  <li><strong>Retour</strong> : vous revenez en douceur à l'état de veille</li>
  <li><strong>Débriefing</strong> : nous échangeons sur votre vécu</li>
</ol>
`;

const benefits = [
  'Hypnose ericksonienne certifiée',
  'Approche douce et respectueuse',
  'Résultats souvent rapides',
  'Cabinet central dans l\'Yonne',
  'Parking gratuit sur place',
  'Première séance découverte',
  'Tarif solidaire disponible',
  'Confidentialité totale',
];

const testimonials = [
  {
    content: 'J\'ai arrêté de fumer après 3 séances d\'hypnose. Ça fait maintenant 8 mois et je n\'ai pas repris. Une vraie libération !',
    author: 'Jean-Pierre M.',
    location: 'Joigny',
  },
  {
    content: 'Mes crises d\'angoisse ont quasiment disparu. L\'hypnose m\'a permis de comprendre et de dépasser mes peurs.',
    author: 'Émilie R.',
    location: 'Sens',
  },
];

const practicalInfo = {
  distance: 'Centre de l\'Yonne',
  duration: '15-45 min selon votre ville',
  directions: 'Cabinet situé à Saint-Julien-du-Sault, accessible depuis l\'A6 (sortie Joigny) ou la D606.',
};

const relatedLinks = [
  { label: 'Hypnose Auxerre', href: '/hypnose-auxerre' },
  { label: 'Hypnose Sens', href: '/hypnose-sens' },
  { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
  { label: 'Psychothérapie Yonne', href: '/psychotherapie-yonne' },
];

export default function HypnoseYonnePage() {
  return (
    <GeoPage
      title="Hypnose dans l'Yonne"
      subtitle="Thérapeute certifié au service du département 89"
      description="David Duquenne pratique l'hypnose ericksonienne à Saint-Julien-du-Sault, accessible depuis toute l'Yonne."
      service="hypnose"
      location={{
        city: "l'Yonne",
        department: '89',
        region: 'Bourgogne-Franche-Comté',
      }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnose Yonne', href: '/hypnose-yonne' },
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
