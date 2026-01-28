import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Psychothérapeute Auxerre | David Duquenne | Cabinet Yonne',
  description:
    'Psychothérapeute accessible depuis Auxerre. David Duquenne vous accueille à 40 min pour psychothérapie, anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'psychothérapeute Auxerre',
    'psy Auxerre',
    'thérapeute Auxerre 89',
    'psychothérapie Auxerre',
    'anxiété Auxerre',
    'burn-out Auxerre',
    'dépression Auxerre',
  ],
  openGraph: {
    title: 'Psychothérapeute accessible depuis Auxerre - David Duquenne',
    description: 'Cabinet de psychothérapie pour les Auxerrois. Accompagnement personnalisé pour anxiété, burn-out, deuil.',
    url: 'https://psypnos.fr/psychotherapeute-auxerre',
  },
  alternates: {
    canonical: 'https://psypnos.fr/psychotherapeute-auxerre',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/psychotherapeute-auxerre',
  name: 'Psypnos - Psychothérapeute pour Auxerre',
  description: 'Cabinet de psychothérapie accessible depuis Auxerre',
  url: 'https://psypnos.fr/psychotherapeute-auxerre',
  areaServed: {
    '@type': 'City',
    name: 'Auxerre',
    sameAs: 'https://fr.wikipedia.org/wiki/Auxerre',
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
<p>Vous recherchez un <strong>psychothérapeute depuis Auxerre</strong> ? David Duquenne vous accueille dans son cabinet de Saint-Julien-du-Sault, à environ <strong>40 minutes en voiture</strong> de la préfecture de l'Yonne.</p>

<p>Auxerre, capitale de l'Yonne, est une ville dynamique où le rythme de vie peut parfois être source de stress et de questionnements. Le cabinet Psypnos offre un espace de respiration, un lieu préservé pour prendre soin de soi.</p>

<h3>Un espace de thérapie hors de la ville</h3>

<p>Pour les Auxerrois, consulter un psychothérapeute en dehors de leur ville présente des avantages :</p>
<ul>
  <li><strong>Anonymat</strong> : moins de risque de croiser des connaissances</li>
  <li><strong>Coupure</strong> : le trajet permet une transition entre le quotidien et l'espace thérapeutique</li>
  <li><strong>Cadre ressourçant</strong> : le Moulin d'en Bas offre un environnement naturel apaisant</li>
</ul>

<p>Le trajet depuis Auxerre (environ 35 km via l'A6 puis la D943) peut devenir un temps de préparation à la séance, un moment pour soi.</p>

<h3>Mes domaines d'accompagnement</h3>

<p>Je reçois régulièrement des patients d'Auxerre pour diverses problématiques :</p>
<ul>
  <li><strong>Burn-out professionnel</strong> : de nombreux actifs auxerrois traversent des périodes d'épuisement</li>
  <li><strong>Anxiété et stress</strong> : gestion des émotions, crises d'angoisse</li>
  <li><strong>Transitions de vie</strong> : séparation, deuil, changement professionnel</li>
  <li><strong>Développement personnel</strong> : mieux se connaître, évoluer</li>
  <li><strong>Traumatismes</strong> : événements difficiles du passé</li>
</ul>

<h3>La psychothérapie transpersonnelle</h3>

<p>Ma pratique s'inscrit dans le courant de la <strong>psychothérapie transpersonnelle</strong>. Cette approche intégrative considère l'être humain dans sa globalité : corps, psyché, émotions et dimension spirituelle.</p>

<p>Elle s'appuie sur différents outils selon les besoins : écoute active, travail sur les émotions, techniques corporelles, exploration des rêves, travail sur l'histoire familiale...</p>

<h3>Consultations en visioconférence</h3>

<p>Pour les Auxerrois qui préfèrent éviter le déplacement ou dont l'emploi du temps ne le permet pas, je propose également des <strong>séances en visioconférence</strong>. Cette modalité est particulièrement adaptée pour un suivi régulier.</p>
`;

const benefits = [
  'Cadre naturel hors de la ville',
  'Discrétion et anonymat',
  'Parking gratuit sur place',
  'Accessible via A6',
  'Consultations visio disponibles',
  'Horaires flexibles',
  'Tarif solidaire possible',
  'Approche intégrative',
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
  distance: '35 km',
  duration: '40 min',
  directions: 'Depuis Auxerre, prendre l\'A6 direction Paris, sortie Joigny. Puis D943 vers Sens jusqu\'à Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Psychothérapeute Yonne', href: '/psychotherapeute-yonne' },
  { label: 'Psychothérapeute Joigny', href: '/psychotherapeute-joigny' },
  { label: 'Hypnose Auxerre', href: '/hypnose-auxerre' },
];

export default function PsychotherapeuteAuxerrePage() {
  return (
    <GeoPage
      title="Psychothérapeute pour Auxerre"
      subtitle="Un espace de thérapie ressourçant pour les Auxerrois"
      description="David Duquenne accompagne les habitants d'Auxerre dans un cabinet situé à 40 min, dans un cadre naturel propice au travail thérapeutique."
      service="psychotherapie"
      location={{
        city: 'Auxerre',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Psychothérapie', href: '/psychotherapie' },
        { name: 'Psychothérapeute Auxerre', href: '/psychotherapeute-auxerre' },
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
