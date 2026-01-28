import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Psychothérapeute Migennes | Cabinet proche | Psypnos',
  description:
    'Psychothérapeute près de Migennes (89). David Duquenne vous accueille à 25 min pour psychothérapie, anxiété, burn-out. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'psychothérapeute Migennes',
    'psy Migennes',
    'thérapeute Migennes 89',
    'psychothérapie Migennes',
    'anxiété Migennes',
  ],
  openGraph: {
    title: 'Psychothérapeute près de Migennes - David Duquenne',
    description: 'Cabinet de psychothérapie accessible depuis Migennes. Accompagnement personnalisé.',
    url: 'https://psypnos.fr/psychotherapeute-migennes',
  },
  alternates: {
    canonical: 'https://psypnos.fr/psychotherapeute-migennes',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/psychotherapeute-migennes',
  name: 'Psypnos - Psychothérapeute près de Migennes',
  description: 'Cabinet de psychothérapie accessible depuis Migennes',
  url: 'https://psypnos.fr/psychotherapeute-migennes',
  areaServed: {
    '@type': 'City',
    name: 'Migennes',
    sameAs: 'https://fr.wikipedia.org/wiki/Migennes',
  },
  provider: {
    '@type': 'Person',
    name: 'David Duquenne',
    jobTitle: 'Psychothérapeute',
  },
};

const mainContent = `
<p>Vous habitez <strong>Migennes</strong> et cherchez un psychothérapeute ? Le cabinet Psypnos est situé à Saint-Julien-du-Sault, à seulement <strong>25 minutes en voiture</strong> de Migennes.</p>

<p>Migennes, carrefour ferroviaire de l'Yonne, est une ville en pleine transformation. Ses habitants, entre tradition cheminote et nouvelles dynamiques, peuvent avoir besoin d'un espace pour se poser et faire le point.</p>

<h3>Un accompagnement pour les Migennois</h3>

<p>En tant que psychothérapeute, j'accueille régulièrement des habitants de Migennes et des communes voisines : Cheny, Laroche-Saint-Cydroine, Bassou, Bonnard...</p>

<p>Les motifs de consultation sont variés :</p>
<ul>
  <li><strong>Difficultés professionnelles</strong> : restructurations, changements d'organisation, stress au travail</li>
  <li><strong>Anxiété et dépression</strong> : mal-être, perte de sens, difficultés à avancer</li>
  <li><strong>Problématiques relationnelles</strong> : couple, famille, isolement</li>
  <li><strong>Deuil et séparation</strong> : accompagnement dans les moments de perte</li>
  <li><strong>Questionnements de vie</strong> : transitions, reconversion, retraite</li>
</ul>

<h3>Le cadre thérapeutique</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un environnement propice au travail sur soi. Installé dans un ancien moulin au bord de l'eau, il offre calme et sérénité, loin du tumulte quotidien.</p>

<p>Le trajet depuis Migennes (environ 20 km via la D943) prend une vingtaine de minutes. Ce temps de route peut devenir un rituel, une transition entre le quotidien et l'espace de la thérapie.</p>

<h3>Ma démarche thérapeutique</h3>

<p>Je pratique la <strong>psychothérapie transpersonnelle</strong>, une approche qui considère l'être humain dans sa globalité. Elle intègre différentes dimensions :</p>
<ul>
  <li>La dimension psychologique : comprendre ses schémas, ses blocages</li>
  <li>La dimension émotionnelle : accueillir et transformer les émotions</li>
  <li>La dimension corporelle : le corps comme support du travail</li>
  <li>La dimension existentielle : donner du sens à son parcours</li>
</ul>

<p>Cette approche intégrative s'adapte aux besoins de chacun et permet un travail en profondeur.</p>
`;

const benefits = [
  'À 25 min de Migennes',
  'Cadre calme et naturel',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Visioconférence possible',
  'Approche personnalisée',
  'Confidentialité assurée',
];

const testimonials = [
  {
    content: 'Après la fermeture de mon entreprise, j\'avais besoin de me reconstruire. David m\'a accompagné avec patience et bienveillance.',
    author: 'Rémi P.',
    location: 'Migennes',
  },
  {
    content: 'Le cadre du cabinet est vraiment apaisant. Ça change de Migennes et ça fait du bien.',
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
  { label: 'Psychothérapeute Yonne', href: '/psychotherapeute-yonne' },
  { label: 'Psychothérapeute Joigny', href: '/psychotherapeute-joigny' },
  { label: 'Hypnose Migennes', href: '/hypnose-migennes' },
];

export default function PsychotherapeuteMigennesPage() {
  return (
    <GeoPage
      title="Psychothérapeute près de Migennes"
      subtitle="Cabinet de psychothérapie accessible depuis Migennes"
      description="David Duquenne accompagne les habitants de Migennes dans un cadre apaisant, à 25 minutes de la ville."
      service="psychotherapie"
      location={{
        city: 'Migennes',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Psychothérapie', href: '/psychotherapie' },
        { name: 'Psychothérapeute Migennes', href: '/psychotherapeute-migennes' },
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
