import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnothérapeute Auxerre | David Duquenne | Cabinet Yonne',
  description:
    'Hypnothérapeute accessible depuis Auxerre. David Duquenne vous accueille à 40 min pour hypnose ericksonienne, anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'hypnothérapeute Auxerre',
    'hypnose Auxerre',
    'hypnose ericksonienne Auxerre 89',
    'anxiété Auxerre',
    'burn-out Auxerre',
    'dépression Auxerre',
  ],
  openGraph: {
    title: 'Hypnothérapeute accessible depuis Auxerre - David Duquenne',
    description: 'Cabinet d\'hypnothérapie pour les Auxerrois. Accompagnement personnalisé pour anxiété, burn-out, deuil.',
    url: 'https://psypnos.fr/hypnotherapeute-auxerre',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnotherapeute-auxerre',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnotherapeute-auxerre',
  name: 'Psypnos - Hypnothérapeute pour Auxerre',
  description: 'Cabinet d\'hypnothérapie accessible depuis Auxerre',
  url: 'https://psypnos.fr/hypnotherapeute-auxerre',
  areaServed: {
    '@type': 'City',
    name: 'Auxerre',
    sameAs: 'https://fr.wikipedia.org/wiki/Auxerre',
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
<p>Vous recherchez un <strong>hypnothérapeute depuis Auxerre</strong> ? David Duquenne vous accueille dans son cabinet de Saint-Julien-du-Sault, à environ <strong>40 minutes en voiture</strong> de la préfecture de l'Yonne.</p>

<p>Auxerre, capitale de l'Yonne, est une ville dynamique où le rythme de vie peut parfois être source de stress et de questionnements. Le cabinet Psypnos offre un espace de respiration, un lieu préservé pour prendre soin de soi grâce à l'hypnose ericksonienne.</p>

<h3>Un espace thérapeutique hors de la ville</h3>

<p>Pour les Auxerrois, consulter un hypnothérapeute en dehors de leur ville présente des avantages :</p>
<ul>
  <li><strong>Anonymat</strong> : moins de risque de croiser des connaissances</li>
  <li><strong>Coupure</strong> : le trajet permet une transition entre le quotidien et l'espace thérapeutique</li>
  <li><strong>Cadre ressourçant</strong> : le Moulin d'en Bas offre un environnement naturel apaisant</li>
</ul>

<p>Le trajet depuis Auxerre (environ 35 km via l'A6 puis la D943) peut devenir un temps de préparation à la séance, un moment pour soi.</p>

<h3>L'hypnose ericksonienne pour vous accompagner</h3>

<p>Je reçois régulièrement des patients d'Auxerre pour diverses problématiques :</p>
<ul>
  <li><strong>Burn-out professionnel</strong> : de nombreux actifs auxerrois traversent des périodes d'épuisement</li>
  <li><strong>Anxiété et stress</strong> : gestion des émotions, crises d'angoisse</li>
  <li><strong>Transitions de vie</strong> : séparation, deuil, changement professionnel</li>
  <li><strong>Phobies et blocages</strong> : peurs irrationnelles, comportements limitants</li>
  <li><strong>Confiance en soi</strong> : estime de soi, affirmation personnelle</li>
</ul>

<h3>Une approche douce et respectueuse</h3>

<p>L'<strong>hypnose ericksonienne</strong> est une forme d'hypnose thérapeutique non directive. Elle respecte votre rythme et s'appuie sur vos propres ressources intérieures pour favoriser le changement.</p>

<p>Vous restez conscient et acteur de votre séance. L'hypnose permet d'accéder à un état de conscience modifié propice à la transformation et à la résolution des difficultés.</p>

<h3>Consultations en visioconférence</h3>

<p>Pour les Auxerrois qui préfèrent éviter le déplacement ou dont l'emploi du temps ne le permet pas, je propose également des <strong>séances en visioconférence</strong>. Cette modalité est particulièrement adaptée pour un suivi régulier.</p>
`;

const benefits = [
  'Hypnothérapeute certifié',
  'Cadre naturel hors de la ville',
  'Discrétion et anonymat',
  'Parking gratuit sur place',
  'Accessible via A6',
  'Consultations visio disponibles',
  'Horaires flexibles',
  'Tarif solidaire possible',
];

const testimonials = [
  {
    content: 'Le trajet depuis Auxerre est devenu mon rituel. L\'hypnose avec David m\'a vraiment aidée à surmonter mon anxiété. Le cadre du cabinet est vraiment ressourçant.',
    author: 'Nathalie B.',
    location: 'Auxerre',
  },
  {
    content: 'J\'ai choisi de consulter en dehors d\'Auxerre pour avoir un espace vraiment à moi. L\'hypnose ericksonienne m\'accompagne avec justesse depuis plus d\'un an.',
    author: 'Marc S.',
    location: 'Auxerre',
  },
];

const practicalInfo = {
  distance: '35 km',
  duration: '40 min',
  directions: 'Depuis Auxerre, prendre l\'A6 direction Paris, sortie Joigny. Puis D943 vers Sens jusqu\'à Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Hypnothérapeute Yonne', href: '/hypnotherapeute-yonne' },
  { label: 'Hypnothérapeute Joigny', href: '/hypnotherapeute-joigny' },
  { label: 'Hypnose Auxerre', href: '/hypnose-auxerre' },
];

export default function HypnotherapeuteAuxerrePage() {
  return (
    <GeoPage
      title="Hypnothérapeute pour Auxerre"
      subtitle="Un espace d'hypnothérapie ressourçant pour les Auxerrois"
      description="David Duquenne, hypnothérapeute certifié, accompagne les habitants d'Auxerre dans un cabinet situé à 40 min, dans un cadre naturel propice au travail thérapeutique."
      service="hypnose"
      location={{
        city: 'Auxerre',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnothérapeute Auxerre', href: '/hypnotherapeute-auxerre' },
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
