import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnothérapeute Joigny | Cabinet proche de chez vous | Psypnos',
  description:
    'Hypnothérapeute près de Joigny (89). David Duquenne vous accueille à 15 min en voiture pour hypnose ericksonienne, anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'hypnothérapeute Joigny',
    'hypnose Joigny',
    'hypnose ericksonienne Joigny 89',
    'anxiété Joigny',
    'burn-out Joigny',
  ],
  openGraph: {
    title: 'Hypnothérapeute près de Joigny - David Duquenne',
    description: 'Cabinet d\'hypnothérapie à 15 min de Joigny. Accompagnement personnalisé par David Duquenne.',
    url: 'https://psypnos.fr/hypnotherapeute-joigny',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnotherapeute-joigny',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnotherapeute-joigny',
  name: 'Psypnos - Hypnothérapeute près de Joigny',
  description: 'Cabinet d\'hypnothérapie accessible depuis Joigny',
  url: 'https://psypnos.fr/hypnotherapeute-joigny',
  areaServed: {
    '@type': 'City',
    name: 'Joigny',
    sameAs: 'https://fr.wikipedia.org/wiki/Joigny',
  },
  provider: {
    '@type': 'Person',
    name: 'David Duquenne',
    jobTitle: 'Hypnothérapeute',
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
<p>Vous habitez <strong>Joigny</strong> ou ses environs et recherchez un hypnothérapeute ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à seulement <strong>15 minutes en voiture</strong> de Joigny.</p>

<p>Joigny, ville historique de l'Yonne, est connue pour ses maisons à pans de bois et son dynamisme. Ses habitants méritent un accompagnement thérapeutique de qualité, accessible et personnalisé.</p>

<h3>Un accompagnement adapté aux Joviniennes et Joviniens</h3>

<p>En tant qu'<strong>hypnothérapeute certifié</strong>, j'accompagne depuis de nombreuses années les habitants de Joigny et de ses communes voisines : Villecien, Chamvres, Migennes, Saint-Aubin-sur-Yonne, Looze...</p>

<p>Les motifs de consultation sont variés :</p>
<ul>
  <li>Anxiété et crises d'angoisse</li>
  <li>Burn-out et épuisement professionnel</li>
  <li>Phobies et blocages</li>
  <li>Deuil et séparation</li>
  <li>Confiance en soi</li>
  <li>Arrêt du tabac et addictions</li>
</ul>

<h3>Pourquoi choisir un cabinet proche de Joigny ?</h3>

<p>La proximité géographique est un atout pour un suivi thérapeutique régulier. À seulement 12 km de Joigny, le cabinet de Saint-Julien-du-Sault offre un cadre idéal : un ancien moulin rénové, au calme, propice à l'introspection et au travail hypnotique.</p>

<p>Le trajet depuis Joigny se fait en suivant la D943 direction Sens. Le cabinet est situé à l'entrée de Saint-Julien-du-Sault, avec un parking gratuit.</p>

<h3>Première séance : créer l'alliance thérapeutique</h3>

<p>La première rencontre est essentielle. Elle permet de faire connaissance, de clarifier votre demande et d'établir ensemble les bases de notre travail. C'est aussi l'occasion de découvrir l'hypnose ericksonienne et de voir si cette approche vous convient.</p>

<p>L'<strong>hypnose ericksonienne</strong> est une approche douce et respectueuse qui s'appuie sur vos propres ressources intérieures pour favoriser le changement.</p>
`;

const benefits = [
  'Hypnothérapeute certifié',
  'À seulement 15 min de Joigny',
  'Parking gratuit sur place',
  'Cadre apaisant au Moulin d\'en Bas',
  'Horaires flexibles (soir et samedi)',
  'Tarif solidaire disponible',
  'Consultations visio possibles',
  'Accompagnement personnalisé',
];

const testimonials = [
  {
    content: 'Habitant Joigny, j\'hésitais à faire le déplacement. Mais le cadre et l\'approche de David Duquenne valent largement le court trajet. L\'hypnose m\'a beaucoup aidé.',
    author: 'Claire M.',
    location: 'Joigny',
  },
  {
    content: 'Après mon burn-out, j\'avais besoin d\'un espace hors de la ville pour me reconstruire. L\'hypnose au Moulin d\'en Bas est parfait pour ça.',
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
  { label: 'Hypnothérapeute Yonne', href: '/hypnotherapeute-yonne' },
  { label: 'Hypnothérapeute Migennes', href: '/hypnotherapeute-migennes' },
  { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
];

export default function HypnotherapeuteJoignyPage() {
  return (
    <GeoPage
      title="Hypnothérapeute près de Joigny"
      subtitle="Cabinet d'hypnothérapie à 15 minutes de Joigny pour un accompagnement de proximité"
      description="David Duquenne, hypnothérapeute certifié, accompagne les habitants de Joigny et environs dans un cadre apaisant à Saint-Julien-du-Sault."
      service="hypnose"
      location={{
        city: 'Joigny',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnothérapeute Joigny', href: '/hypnotherapeute-joigny' },
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
