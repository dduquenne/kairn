import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Psychothérapeute Joigny | Cabinet proche de chez vous | Psypnos',
  description:
    'Psychothérapeute près de Joigny (89). David Duquenne vous accueille à 15 min en voiture pour l\'anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'psychothérapeute Joigny',
    'psy Joigny',
    'thérapeute Joigny 89',
    'psychothérapie près de Joigny',
    'anxiété Joigny',
    'burn-out Joigny',
  ],
  openGraph: {
    title: 'Psychothérapeute près de Joigny - David Duquenne',
    description: 'Cabinet de psychothérapie à 15 min de Joigny. Accompagnement personnalisé par David Duquenne.',
    url: 'https://psypnos.fr/psychotherapeute-joigny',
  },
  alternates: {
    canonical: 'https://psypnos.fr/psychotherapeute-joigny',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/psychotherapeute-joigny',
  name: 'Psypnos - Psychothérapeute près de Joigny',
  description: 'Cabinet de psychothérapie accessible depuis Joigny',
  url: 'https://psypnos.fr/psychotherapeute-joigny',
  areaServed: {
    '@type': 'City',
    name: 'Joigny',
    sameAs: 'https://fr.wikipedia.org/wiki/Joigny',
  },
  provider: {
    '@type': 'Person',
    name: 'David Duquenne',
    jobTitle: 'Psychothérapeute',
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
<p>Vous habitez <strong>Joigny</strong> ou ses environs et recherchez un psychothérapeute ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à seulement <strong>15 minutes en voiture</strong> de Joigny.</p>

<p>Joigny, ville historique de l'Yonne, est connue pour ses maisons à pans de bois et son dynamisme. Ses habitants méritent un accompagnement thérapeutique de qualité, accessible et personnalisé.</p>

<h3>Un accompagnement adapté aux Joviniennes et Joviniens</h3>

<p>En tant que <strong>psychothérapeute</strong>, j'accompagne depuis de nombreuses années les habitants de Joigny et de ses communes voisines : Villecien, Chamvres, Migennes, Saint-Aubin-sur-Yonne, Looze...</p>

<p>Les motifs de consultation sont variés :</p>
<ul>
  <li>Difficultés relationnelles (couple, famille, travail)</li>
  <li>Anxiété et crises d'angoisse</li>
  <li>Burn-out et épuisement professionnel</li>
  <li>Deuil et séparation</li>
  <li>Questionnements existentiels</li>
  <li>Traumatismes et blessures du passé</li>
</ul>

<h3>Pourquoi choisir un cabinet proche de Joigny ?</h3>

<p>La proximité géographique est un atout pour un suivi thérapeutique régulier. À seulement 12 km de Joigny, le cabinet de Saint-Julien-du-Sault offre un cadre idéal : un ancien moulin rénové, au calme, propice à l'introspection et au travail thérapeutique.</p>

<p>Le trajet depuis Joigny se fait en suivant la D943 direction Sens. Le cabinet est situé à l'entrée de Saint-Julien-du-Sault, avec un parking gratuit.</p>

<h3>Première séance : créer l'alliance thérapeutique</h3>

<p>La première rencontre est essentielle. Elle permet de faire connaissance, de clarifier votre demande et d'établir ensemble les bases de notre travail. C'est aussi l'occasion de voir si le courant passe et si ma manière de travailler vous convient.</p>

<p>Je pratique la <strong>psychothérapie transpersonnelle</strong>, une approche intégrative qui prend en compte toutes les dimensions de l'être : corps, émotions, mental et spiritualité.</p>
`;

const benefits = [
  'À seulement 15 min de Joigny',
  'Parking gratuit sur place',
  'Cadre apaisant au Moulin d\'en Bas',
  'Horaires flexibles (soir et samedi)',
  'Tarif solidaire disponible',
  'Consultations visio possibles',
  'Première séance pour faire connaissance',
  'Accompagnement personnalisé',
];

const testimonials = [
  {
    content: 'Habitant Joigny, j\'hésitais à faire le déplacement. Mais le cadre et l\'écoute de David Duquenne valent largement le court trajet. Un vrai cocon pour se poser.',
    author: 'Claire M.',
    location: 'Joigny',
  },
  {
    content: 'Après mon burn-out, j\'avais besoin d\'un espace hors de la ville pour me reconstruire. Le Moulin d\'en Bas est parfait pour ça.',
    author: 'Philippe D.',
    location: 'Joigny',
  },
];

const practicalInfo = {
  distance: '12 km',
  duration: '15 min',
  directions: 'Depuis Joigny, prendre la D943 direction Sens. Traverser Saint-Julien-du-Sault, le cabinet est à la sortie du village sur la gauche.',
};

const relatedLinks = [
  { label: 'Psychothérapeute Yonne', href: '/psychotherapeute-yonne' },
  { label: 'Psychothérapeute Migennes', href: '/psychotherapeute-migennes' },
  { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
];

export default function PsychotherapeuteJoignyPage() {
  return (
    <GeoPage
      title="Psychothérapeute près de Joigny"
      subtitle="Cabinet à 15 minutes de Joigny pour un accompagnement de proximité"
      description="David Duquenne, psychothérapeute, accompagne les habitants de Joigny et environs dans un cadre apaisant à Saint-Julien-du-Sault."
      service="psychotherapie"
      location={{
        city: 'Joigny',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Psychothérapie', href: '/psychotherapie' },
        { name: 'Psychothérapeute Joigny', href: '/psychotherapeute-joigny' },
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
