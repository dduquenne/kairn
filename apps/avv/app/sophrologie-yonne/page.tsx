import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Sophrologie dans l\'Yonne (89) | Nathalie Duquenne - Appréciez Votre Vie',
  description:
    'Sophrologie dans l\'Yonne. Nathalie Duquenne, sophrologue certifiée, vous accompagne à Saint-Julien-du-Sault pour l\'anxiété, le burn-out, le deuil et les crises de vie. Consultations sur RDV.',
  keywords: [
    'sophrologie Yonne',
    'sophrologue Yonne',
    'sophrologie 89',
    'thérapie Saint-Julien-du-Sault',
    'anxiété Yonne',
    'burn-out Yonne',
    'deuil Yonne',
    'sophrologie Yonne',
  ],
  openGraph: {
    title: 'Sophrologie dans l\'Yonne - Nathalie Duquenne',
    description: 'Cabinet de sophrologie à Saint-Julien-du-Sault. Accompagnement personnalisé pour les habitants de l\'Yonne.',
    url: 'https://appreciezvotrevie.fr/sophrologie-yonne',
    type: 'website',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/sophrologie-yonne',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://appreciezvotrevie.fr/sophrologie-yonne',
  name: 'Appréciez Votre Vie - Sophrologie Yonne',
  description: 'Cabinet de sophrologie au service de l\'Yonne',
  url: 'https://appreciezvotrevie.fr/sophrologie-yonne',
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Yonne',
    sameAs: 'https://fr.wikipedia.org/wiki/Yonne_(d%C3%A9partement)',
  },
  provider: {
    '@type': 'Person',
    name: 'Nathalie Duquenne',
    jobTitle: 'Sophrologue, Relaxologue & Somatothérapeute',
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
<p>Vous recherchez un accompagnement en <strong>sophrologie dans l'Yonne</strong> ? Nathalie Duquenne vous accueille dans son cabinet de Saint-Julien-du-Sault, au cœur du département de l'Yonne (89), pour un accompagnement thérapeutique personnalisé.</p>

<p>Situé dans un cadre paisible et ressourçant au Moulin d'en Bas, le cabinet est facilement accessible depuis toutes les villes de l'Yonne : Auxerre, Sens, Joigny, Migennes, Villeneuve-sur-Yonne, Tonnerre, Avallon...</p>

<h3>Une approche thérapeutique intégrative</h3>

<p>Ma pratique de la <strong>sophrologie</strong> s'appuie sur plusieurs approches complémentaires. Cette approche douce et respectueuse permet d'accéder aux ressources profondes pour favoriser le changement.</p>

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
  'Sophrologue certifiée',
  'Accompagnement personnalisé et adapté',
  'Cabinet accessible depuis tout le département',
  'Parking gratuit et cadre paisible',
  'Consultations en présentiel ou visioconférence',
  'Tarif solidaire disponible',
  'Flexibilité des horaires (soir et samedi)',
  'Confidentialité et bienveillance',
];

const researchStats = [
  {
    stat: '75% d\'amélioration',
    description: 'des patients montrent une amélioration significative après une sophrologie, selon les méta-analyses de référence.',
    source: 'Lambert & Ogles - Handbook of Psychotherapy',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/15796678/',
  },
  {
    stat: 'Efficacité prouvée',
    description: 'La sophrologie est reconnue par l\'INSERM comme efficace pour la dépression, les troubles anxieux et le stress post-traumatique.',
    source: 'INSERM - Expertise collective Sophrologie',
    sourceUrl: 'https://www.inserm.fr/expertise-collective/sophrologie-trois-approches-evaluees/',
  },
  {
    stat: 'Effets durables',
    description: 'Les bénéfices de la sophrologie se maintiennent dans le temps, avec moins de rechutes qu\'avec les traitements médicamenteux seuls.',
    source: 'Hollon et al. - Archives of General Psychiatry',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16061768/',
  },
];

const practicalInfo = {
  distance: 'Centre de l\'Yonne',
  duration: '15-45 min selon votre ville',
  directions: 'Le cabinet est situé à Saint-Julien-du-Sault, accessible facilement depuis l\'A6 (sortie Joigny) ou la D606. Parking gratuit sur place.',
};

const relatedLinks = [
  { label: 'Toutes nos thérapies', href: '/therapies' },
  { label: 'Thérapies dans l\'Yonne', href: '/yonne' },
  { label: 'Sophrologie Auxerre', href: '/sophrologie-auxerre' },
  { label: 'Sophrologie Sens', href: '/sophrologie-sens' },
  { label: 'Sophrologie Joigny', href: '/sophrologie-joigny' },
  { label: 'Sophrologie Migennes', href: '/sophrologie-migennes' },
  { label: 'Somatothérapie Yonne', href: '/somatotherapie-yonne' },
];

export default function SophrologieYonnePage() {
  return (
    <GeoPage
      title="Sophrologie dans l'Yonne"
      subtitle="Accompagnement thérapeutique personnalisé pour les habitants du département 89"
      description="Nathalie Duquenne, sophrologue certifiée à Saint-Julien-du-Sault, accompagne les habitants de l'Yonne dans leur parcours de guérison et d'évolution personnelle."
      service="sophrologie"
      location={{
        city: "l'Yonne",
        department: '89',
        region: 'Bourgogne-Franche-Comté',
      }}
      breadcrumbItems={[
        { name: 'Sophrologie', href: '/sophrologie' },
        { name: 'Sophrologie Yonne', href: '/sophrologie-yonne' },
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
