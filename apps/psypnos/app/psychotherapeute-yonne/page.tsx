import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Psychothérapeute dans l\'Yonne (89) | David Duquenne - Psypnos',
  description:
    'Psychothérapeute dans l\'Yonne. David Duquenne vous accompagne à Saint-Julien-du-Sault pour l\'anxiété, le burn-out, le deuil et les crises de vie. Consultations sur RDV.',
  keywords: [
    'psychothérapeute Yonne',
    'psychothérapie 89',
    'thérapeute Yonne',
    'psy Bourgogne',
    'psychothérapeute Saint-Julien-du-Sault',
    'thérapie anxiété Yonne',
    'burn-out Yonne',
    'deuil Yonne',
  ],
  openGraph: {
    title: 'Psychothérapeute dans l\'Yonne - David Duquenne',
    description: 'Cabinet de psychothérapie à Saint-Julien-du-Sault. Accompagnement personnalisé pour les habitants de l\'Yonne.',
    url: 'https://psypnos.fr/psychotherapeute-yonne',
    type: 'website',
  },
  alternates: {
    canonical: 'https://psypnos.fr/psychotherapeute-yonne',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/psychotherapeute-yonne',
  name: 'Psypnos - Psychothérapeute Yonne',
  description: 'Cabinet de psychothérapie au service de l\'Yonne',
  url: 'https://psypnos.fr/psychotherapeute-yonne',
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Yonne',
    sameAs: 'https://fr.wikipedia.org/wiki/Yonne_(d%C3%A9partement)',
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
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 48.0324,
    longitude: 3.2917,
  },
  priceRange: '40€ - 70€',
};

const mainContent = `
<p>Vous recherchez un <strong>psychothérapeute dans l'Yonne</strong> ? David Duquenne vous accueille dans son cabinet de Saint-Julien-du-Sault, au cœur du département de l'Yonne (89), pour un accompagnement thérapeutique personnalisé.</p>

<p>Situé dans un cadre paisible et ressourçant au Moulin d'en Bas, le cabinet est facilement accessible depuis toutes les villes de l'Yonne : Auxerre, Sens, Joigny, Migennes, Villeneuve-sur-Yonne, Tonnerre, Avallon...</p>

<h3>Une approche thérapeutique globale</h3>

<p>La <strong>psychothérapie transpersonnelle</strong> que je pratique intègre plusieurs dimensions de l'être humain : psychologique, émotionnelle, corporelle et spirituelle. Cette approche holistique permet d'explorer les racines profondes des difficultés et d'accompagner une transformation durable.</p>

<p>Chaque parcours est unique. Que vous traversiez une période difficile, que vous cherchiez à mieux vous comprendre ou que vous souhaitiez évoluer dans votre vie, je vous propose un espace d'écoute et d'accompagnement adapté à vos besoins.</p>

<h3>Les motifs de consultation les plus fréquents</h3>

<p>Les habitants de l'Yonne me consultent pour diverses problématiques :</p>
<ul>
  <li><strong>Anxiété et stress</strong> : crises d'angoisse, anxiété généralisée, stress professionnel</li>
  <li><strong>Dépression et burn-out</strong> : épuisement, perte de sens, difficultés à se relever</li>
  <li><strong>Deuil et séparation</strong> : accompagnement dans les moments de perte</li>
  <li><strong>Crises de vie</strong> : transitions difficiles, questionnements existentiels</li>
  <li><strong>Traumatismes</strong> : événements traumatiques, blessures du passé</li>
  <li><strong>Développement personnel</strong> : connaissance de soi, évolution personnelle</li>
</ul>

<h3>Un cadre adapté aux habitants de l'Yonne</h3>

<p>Le cabinet est idéalement situé pour les habitants de tout le département de l'Yonne. Que vous veniez d'Auxerre (35 km), de Sens (25 km), de Joigny (12 km) ou de Migennes (20 km), vous trouverez un stationnement gratuit sur place et un accueil dans un environnement calme et préservé.</p>

<p>Pour ceux qui préfèrent éviter le déplacement, des consultations en <strong>visioconférence</strong> sont également possibles.</p>
`;

const benefits = [
  'Accompagnement personnalisé et adapté à votre situation',
  'Approche intégrative et holistique',
  'Cabinet accessible depuis tout le département',
  'Parking gratuit et cadre paisible',
  'Consultations en présentiel ou visioconférence',
  'Tarif solidaire disponible',
  'Flexibilité des horaires (soir et samedi)',
  'Confidentialité et bienveillance',
];

const researchStats = [
  {
    stat: 'g = 0.96',
    description: "Effet large de la psychothérapie sur la dépression selon une méta-analyse de 252 études cliniques.",
    source: 'Administration and Policy in Mental Health, 2022',
    sourceUrl: 'https://link.springer.com/article/10.1007/s10488-022-01225-y',
  },
  {
    stat: 'g = 0.80',
    description: "Effet large de la psychothérapie sur les troubles anxieux, confirmé par plusieurs méta-analyses.",
    source: 'World Psychiatry, 2024',
    sourceUrl: 'https://onlinelibrary.wiley.com/doi/full/10.1002/wps.21203',
  },
];

const practicalInfo = {
  distance: 'Centre de l\'Yonne',
  duration: '15-45 min selon votre ville',
  directions: 'Le cabinet est situé à Saint-Julien-du-Sault, accessible facilement depuis l\'A6 (sortie Joigny) ou la D606. Parking gratuit sur place.',
};

const relatedLinks = [
  { label: 'Psychothérapeute Auxerre', href: '/psychotherapeute-auxerre' },
  { label: 'Psychothérapeute Sens', href: '/psychotherapeute-sens' },
  { label: 'Psychothérapeute Joigny', href: '/psychotherapeute-joigny' },
  { label: 'Hypnose Yonne', href: '/hypnose-yonne' },
];

export default function PsychotherapeuteYonnePage() {
  return (
    <GeoPage
      title="Psychothérapeute dans l'Yonne"
      subtitle="Accompagnement thérapeutique pour les habitants du département 89"
      description="David Duquenne, psychothérapeute à Saint-Julien-du-Sault, accompagne les habitants de l'Yonne dans leur parcours de guérison et d'évolution personnelle."
      service="psychotherapie"
      location={{
        city: "l'Yonne",
        department: '89',
        region: 'Bourgogne-Franche-Comté',
      }}
      breadcrumbItems={[
        { name: 'Psychothérapie', href: '/psychotherapie' },
        { name: 'Psychothérapeute Yonne', href: '/psychotherapeute-yonne' },
      ]}
      mainContent={mainContent}
      benefits={benefits}
      researchStats={researchStats}
      practicalInfo={practicalInfo}
      relatedLinks={relatedLinks}
      schemaData={schemaData}
    />
  );
}
