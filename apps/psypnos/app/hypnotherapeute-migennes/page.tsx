import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnothérapeute Migennes | Cabinet proche | Psypnos',
  description:
    'Hypnothérapeute près de Migennes (89). David Duquenne vous accueille à 25 min pour hypnose ericksonienne, anxiété, burn-out. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'hypnothérapeute Migennes',
    'hypnose Migennes',
    'hypnose ericksonienne Migennes 89',
    'anxiété Migennes',
  ],
  openGraph: {
    title: 'Hypnothérapeute près de Migennes - David Duquenne',
    description: 'Cabinet d\'hypnothérapie accessible depuis Migennes. Accompagnement personnalisé par l\'hypnose ericksonienne.',
    url: 'https://psypnos.fr/hypnotherapeute-migennes',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnotherapeute-migennes',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnotherapeute-migennes',
  name: 'Psypnos - Hypnothérapeute près de Migennes',
  description: 'Cabinet d\'hypnothérapie accessible depuis Migennes',
  url: 'https://psypnos.fr/hypnotherapeute-migennes',
  areaServed: {
    '@type': 'City',
    name: 'Migennes',
    sameAs: 'https://fr.wikipedia.org/wiki/Migennes',
  },
  provider: {
    '@type': 'Person',
    name: 'David Duquenne',
    jobTitle: 'Hypnothérapeute',
  },
};

const mainContent = `
<p>Vous habitez <strong>Migennes</strong> et cherchez un hypnothérapeute ? Le cabinet Psypnos est situé à Saint-Julien-du-Sault, à seulement <strong>25 minutes en voiture</strong> de Migennes.</p>

<p>Migennes, carrefour ferroviaire de l'Yonne, est une ville en pleine transformation. Ses habitants, entre tradition cheminote et nouvelles dynamiques, peuvent avoir besoin d'un espace pour se poser et faire le point.</p>

<h3>Un accompagnement pour les Migennois</h3>

<p>En tant qu'hypnothérapeute certifié, j'accueille régulièrement des habitants de Migennes et des communes voisines : Cheny, Laroche-Saint-Cydroine, Bassou, Bonnard...</p>

<p>Les motifs de consultation sont variés :</p>
<ul>
  <li><strong>Difficultés professionnelles</strong> : restructurations, changements d'organisation, stress au travail</li>
  <li><strong>Anxiété et dépression</strong> : mal-être, perte de sens, difficultés à avancer</li>
  <li><strong>Phobies et blocages</strong> : peurs irrationnelles, comportements limitants</li>
  <li><strong>Deuil et séparation</strong> : accompagnement dans les moments de perte</li>
  <li><strong>Arrêt du tabac</strong> : accompagnement par l'hypnose</li>
  <li><strong>Confiance en soi</strong> : estime de soi, affirmation personnelle</li>
</ul>

<h3>Le cadre thérapeutique</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un environnement propice au travail sur soi. Installé dans un ancien moulin au bord de l'eau, il offre calme et sérénité, loin du tumulte quotidien.</p>

<p>Le trajet depuis Migennes (environ 20 km via la D943) prend une vingtaine de minutes. Ce temps de route peut devenir un rituel, une transition entre le quotidien et l'espace de la thérapie.</p>

<h3>L'hypnose ericksonienne</h3>

<p>L'<strong>hypnose ericksonienne</strong> que je pratique est une approche douce et respectueuse qui permet :</p>
<ul>
  <li>D'accéder à vos ressources intérieures</li>
  <li>De dépasser les blocages et les peurs</li>
  <li>De favoriser le changement en profondeur</li>
  <li>De retrouver confiance et sérénité</li>
</ul>

<p>Vous restez conscient et acteur de votre séance. L'hypnose amplifie vos capacités naturelles de guérison et de transformation.</p>
`;

const benefits = [
  'Hypnothérapeute certifié',
  'À 25 min de Migennes',
  'Cadre calme et naturel',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Visioconférence possible',
  'Confidentialité assurée',
];

const testimonials = [
  {
    content: 'Après la fermeture de mon entreprise, j\'avais besoin de me reconstruire. L\'hypnose avec David m\'a accompagné avec patience et bienveillance.',
    author: 'Rémi P.',
    location: 'Migennes',
  },
  {
    content: 'Le cadre du cabinet est vraiment apaisant. L\'hypnose m\'a permis de dépasser mes angoisses. Ça change de Migennes et ça fait du bien.',
    author: 'Isabelle C.',
    location: 'Laroche-Saint-Cydroine',
  },
];

const practicalInfo = {
  distance: '20 km',
  duration: '25 min',
  directions: 'Depuis Migennes, prendre la D943 direction Sens. Le cabinet se trouve à l\'entrée de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Hypnothérapeute Yonne', href: '/hypnotherapeute-yonne' },
  { label: 'Hypnothérapeute Joigny', href: '/hypnotherapeute-joigny' },
  { label: 'Hypnose Migennes', href: '/hypnose-migennes' },
];

export default function HypnotherapeuteMigennesPage() {
  return (
    <GeoPage
      title="Hypnothérapeute près de Migennes"
      subtitle="Cabinet d'hypnothérapie accessible depuis Migennes"
      description="David Duquenne, hypnothérapeute certifié, accompagne les habitants de Migennes dans un cadre apaisant, à 25 minutes de la ville."
      service="hypnose"
      location={{
        city: 'Migennes',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnothérapeute Migennes', href: '/hypnotherapeute-migennes' },
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
