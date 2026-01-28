import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Psychothérapie Joigny | Cabinet proche de chez vous | Psypnos',
  description:
    'Psychothérapie près de Joigny (89). David Duquenne, thérapeute certifié, vous accueille à 15 min en voiture pour l\'anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'psychothérapie Joigny',
    'thérapeute Joigny',
    'thérapie Joigny 89',
    'anxiété Joigny',
    'burn-out Joigny',
  ],
  openGraph: {
    title: 'Psychothérapie près de Joigny - David Duquenne',
    description: 'Cabinet de psychothérapie à 15 min de Joigny. Accompagnement personnalisé.',
    url: 'https://psypnos.fr/psychotherapie-joigny',
  },
  alternates: {
    canonical: 'https://psypnos.fr/psychotherapie-joigny',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/psychotherapie-joigny',
  name: 'Psypnos - Psychothérapie près de Joigny',
  description: 'Cabinet de psychothérapie accessible depuis Joigny',
  url: 'https://psypnos.fr/psychotherapie-joigny',
  areaServed: {
    '@type': 'City',
    name: 'Joigny',
    sameAs: 'https://fr.wikipedia.org/wiki/Joigny',
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
<p>Vous habitez <strong>Joigny</strong> ou ses environs et recherchez un accompagnement en psychothérapie ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à seulement <strong>15 minutes en voiture</strong> de Joigny.</p>

<p>Joigny, cité médiévale au bord de l'Yonne, est une ville attachante où le temps semble ralentir. Pourtant, ses habitants peuvent aussi traverser des périodes de questionnement ou de difficulté.</p>

<h3>Un accompagnement de proximité</h3>

<p>En tant que <strong>thérapeute</strong>, j'accompagne depuis de nombreuses années les habitants de Joigny et de ses communes voisines : Villecien, Chamvres, Migennes, Saint-Aubin-sur-Yonne, Looze...</p>

<p>Les Jovigniens me consultent souvent pour :</p>
<ul>
  <li><strong>L'anxiété</strong> : stress quotidien, crises d'angoisse, ruminations</li>
  <li><strong>Le burn-out</strong> : épuisement professionnel, perte de sens</li>
  <li><strong>Le deuil</strong> : accompagnement dans les moments de perte</li>
  <li><strong>Les transitions de vie</strong> : séparation, retraite, reconversion</li>
  <li><strong>Les difficultés relationnelles</strong> : couple, famille, travail</li>
</ul>

<h3>Le cadre du cabinet</h3>

<p>Le cabinet de Saint-Julien-du-Sault est installé dans un ancien moulin au bord de l'eau. Ce lieu chargé d'histoire offre un cadre apaisant, propice au travail sur soi. Le trajet de quelques minutes depuis Joigny permet de créer une transition entre le quotidien et l'espace thérapeutique.</p>

<h3>Ma pratique</h3>

<p>Je pratique la <strong>psychothérapie</strong> en intégrant l'<strong>hypnose ericksonienne</strong>. Cette approche douce et respectueuse permet d'accompagner les personnes dans leur cheminement, à leur rythme.</p>

<p>L'hypnose ericksonienne permet notamment de :</p>
<ul>
  <li>Accéder aux ressources intérieures</li>
  <li>Dépasser les blocages et les peurs</li>
  <li>Favoriser le changement en profondeur</li>
  <li>Retrouver confiance et sérénité</li>
</ul>
`;

const benefits = [
  'Thérapeute certifié',
  'À seulement 15 min de Joigny',
  'Cadre naturel et apaisant',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Visioconférence possible',
  'Confidentialité assurée',
];

const testimonials = [
  {
    content: 'David m\'a accompagné pendant une période très difficile de ma vie. Sa bienveillance et son écoute m\'ont beaucoup aidé. Je recommande vivement.',
    author: 'Pierre M.',
    location: 'Joigny',
  },
  {
    content: 'Le cadre du cabinet est magnifique et très apaisant. C\'est un vrai plus pour le travail thérapeutique.',
    author: 'Nathalie B.',
    location: 'Villecien',
  },
];

const practicalInfo = {
  distance: '12 km',
  duration: '15 min',
  directions: 'Depuis Joigny, prendre la D943 direction Sens. Le cabinet se trouve à l\'entrée de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Psychothérapie Yonne', href: '/psychotherapie-yonne' },
  { label: 'Psychothérapie Migennes', href: '/psychotherapie-migennes' },
  { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
];

export default function PsychotherapieJoignyPage() {
  return (
    <GeoPage
      title="Psychothérapie près de Joigny"
      subtitle="Cabinet de psychothérapie à 15 minutes de Joigny"
      description="David Duquenne, thérapeute certifié, accompagne les habitants de Joigny et environs dans un cadre apaisant à Saint-Julien-du-Sault."
      service="psychotherapie"
      location={{
        city: 'Joigny',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Psychothérapie', href: '/psychotherapie' },
        { name: 'Psychothérapie Joigny', href: '/psychotherapie-joigny' },
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
