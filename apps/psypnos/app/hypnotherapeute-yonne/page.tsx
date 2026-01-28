import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnothérapeute dans l\'Yonne (89) | David Duquenne - Psypnos',
  description:
    'Hypnothérapeute certifié dans l\'Yonne. David Duquenne vous accompagne à Saint-Julien-du-Sault pour l\'anxiété, le burn-out, le deuil et les crises de vie. Consultations sur RDV.',
  keywords: [
    'hypnothérapeute Yonne',
    'hypnose ericksonienne 89',
    'hypnothérapeute Bourgogne',
    'hypnose Saint-Julien-du-Sault',
    'thérapie anxiété Yonne',
    'burn-out Yonne',
    'deuil Yonne',
  ],
  openGraph: {
    title: 'Hypnothérapeute dans l\'Yonne - David Duquenne',
    description: 'Cabinet d\'hypnothérapie à Saint-Julien-du-Sault. Accompagnement personnalisé pour les habitants de l\'Yonne.',
    url: 'https://psypnos.fr/hypnotherapeute-yonne',
    type: 'website',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnotherapeute-yonne',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnotherapeute-yonne',
  name: 'Psypnos - Hypnothérapeute Yonne',
  description: 'Cabinet d\'hypnothérapie au service de l\'Yonne',
  url: 'https://psypnos.fr/hypnotherapeute-yonne',
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Yonne',
    sameAs: 'https://fr.wikipedia.org/wiki/Yonne_(d%C3%A9partement)',
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
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 48.0324,
    longitude: 3.2917,
  },
  priceRange: '40€ - 70€',
};

const mainContent = `
<p>Vous recherchez un <strong>hypnothérapeute dans l'Yonne</strong> ? David Duquenne vous accueille dans son cabinet de Saint-Julien-du-Sault, au cœur du département de l'Yonne (89), pour un accompagnement thérapeutique personnalisé par l'hypnose ericksonienne.</p>

<p>Situé dans un cadre paisible et ressourçant au Moulin d'en Bas, le cabinet est facilement accessible depuis toutes les villes de l'Yonne : Auxerre, Sens, Joigny, Migennes, Villeneuve-sur-Yonne, Tonnerre, Avallon...</p>

<h3>L'hypnose ericksonienne : une approche douce et efficace</h3>

<p>L'<strong>hypnose ericksonienne</strong> que je pratique est une forme d'hypnose thérapeutique douce et respectueuse. Elle permet d'accéder aux ressources de l'inconscient pour favoriser le changement et accompagner une transformation durable.</p>

<p>Chaque parcours est unique. Que vous traversiez une période difficile, que vous cherchiez à dépasser des blocages ou que vous souhaitiez évoluer dans votre vie, je vous propose un espace d'écoute et d'accompagnement adapté à vos besoins.</p>

<h3>Les motifs de consultation les plus fréquents</h3>

<p>Les habitants de l'Yonne me consultent pour diverses problématiques :</p>
<ul>
  <li><strong>Anxiété et stress</strong> : crises d'angoisse, anxiété généralisée, stress professionnel</li>
  <li><strong>Dépression et burn-out</strong> : épuisement, perte de sens, difficultés à se relever</li>
  <li><strong>Deuil et séparation</strong> : accompagnement dans les moments de perte</li>
  <li><strong>Crises de vie</strong> : transitions difficiles, questionnements existentiels</li>
  <li><strong>Phobies et blocages</strong> : peurs irrationnelles, comportements limitants</li>
  <li><strong>Développement personnel</strong> : confiance en soi, évolution personnelle</li>
</ul>

<h3>Un cadre adapté aux habitants de l'Yonne</h3>

<p>Le cabinet est idéalement situé pour les habitants de tout le département de l'Yonne. Que vous veniez d'Auxerre (35 km), de Sens (25 km), de Joigny (12 km) ou de Migennes (20 km), vous trouverez un stationnement gratuit sur place et un accueil dans un environnement calme et préservé.</p>

<p>Pour ceux qui préfèrent éviter le déplacement, des consultations en <strong>visioconférence</strong> sont également possibles.</p>
`;

const benefits = [
  'Hypnothérapeute certifié en hypnose ericksonienne',
  'Accompagnement personnalisé et adapté à votre situation',
  'Cabinet accessible depuis tout le département',
  'Parking gratuit et cadre paisible',
  'Consultations en présentiel ou visioconférence',
  'Tarif solidaire disponible',
  'Flexibilité des horaires (soir et samedi)',
  'Confidentialité et bienveillance',
];

const testimonials = [
  {
    content: 'Après des mois de burn-out, j\'ai trouvé chez David Duquenne une écoute et un accompagnement par l\'hypnose qui m\'ont permis de me reconstruire. Le trajet depuis Auxerre en vaut vraiment la peine.',
    author: 'Marie L.',
    location: 'Auxerre',
  },
  {
    content: 'Un thérapeute à l\'écoute qui prend le temps de comprendre. L\'hypnose m\'a beaucoup aidée. Le cadre du Moulin d\'en Bas est apaisant et aide vraiment à se poser.',
    author: 'Thomas R.',
    location: 'Sens',
  },
];

const practicalInfo = {
  distance: 'Centre de l\'Yonne',
  duration: '15-45 min selon votre ville',
  directions: 'Le cabinet est situé à Saint-Julien-du-Sault, accessible facilement depuis l\'A6 (sortie Joigny) ou la D606. Parking gratuit sur place.',
};

const relatedLinks = [
  { label: 'Hypnothérapeute Auxerre', href: '/hypnotherapeute-auxerre' },
  { label: 'Hypnothérapeute Sens', href: '/hypnotherapeute-sens' },
  { label: 'Hypnothérapeute Joigny', href: '/hypnotherapeute-joigny' },
  { label: 'Hypnose Yonne', href: '/hypnose-yonne' },
];

export default function HypnotherapeuteYonnePage() {
  return (
    <GeoPage
      title="Hypnothérapeute dans l'Yonne"
      subtitle="Accompagnement par l'hypnose ericksonienne pour les habitants du département 89"
      description="David Duquenne, hypnothérapeute certifié à Saint-Julien-du-Sault, accompagne les habitants de l'Yonne dans leur parcours de guérison et d'évolution personnelle."
      service="hypnose"
      location={{
        city: "l'Yonne",
        department: '89',
        region: 'Bourgogne-Franche-Comté',
      }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnothérapeute Yonne', href: '/hypnotherapeute-yonne' },
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
