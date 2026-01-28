import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Psychothérapie Auxerre | David Duquenne | Cabinet Yonne',
  description:
    'Psychothérapie accessible depuis Auxerre. David Duquenne, thérapeute certifié, vous accueille à 40 min pour anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'psychothérapie Auxerre',
    'thérapeute Auxerre',
    'thérapie Auxerre 89',
    'anxiété Auxerre',
    'burn-out Auxerre',
  ],
  openGraph: {
    title: 'Psychothérapie accessible depuis Auxerre - David Duquenne',
    description: 'Cabinet de psychothérapie à 40 min d\'Auxerre. Accompagnement personnalisé.',
    url: 'https://psypnos.fr/psychotherapie-auxerre',
  },
  alternates: {
    canonical: 'https://psypnos.fr/psychotherapie-auxerre',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/psychotherapie-auxerre',
  name: 'Psypnos - Psychothérapie pour Auxerre',
  description: 'Cabinet de psychothérapie accessible depuis Auxerre',
  url: 'https://psypnos.fr/psychotherapie-auxerre',
  areaServed: {
    '@type': 'City',
    name: 'Auxerre',
    sameAs: 'https://fr.wikipedia.org/wiki/Auxerre',
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
<p>Vous recherchez un accompagnement en <strong>psychothérapie depuis Auxerre</strong> ? David Duquenne vous accueille dans son cabinet de Saint-Julien-du-Sault, à environ <strong>40 minutes en voiture</strong> de la préfecture de l'Yonne.</p>

<p>Auxerre, préfecture de l'Yonne, est une ville dynamique où le rythme de vie peut être source de stress et de questionnements. Un accompagnement thérapeutique peut vous aider à traverser les difficultés et à retrouver votre équilibre.</p>

<h3>Un espace de ressourcement hors de la ville</h3>

<p>Pour les Auxerrois, consulter un thérapeute en dehors de leur ville présente des avantages :</p>
<ul>
  <li><strong>Discrétion</strong> : loin de votre environnement quotidien</li>
  <li><strong>Coupure</strong> : le trajet devient un temps de transition</li>
  <li><strong>Cadre apaisant</strong> : un ancien moulin au bord de l'eau</li>
</ul>

<h3>Ma pratique thérapeutique</h3>

<p>Je pratique la <strong>psychothérapie</strong> en intégrant l'<strong>hypnose ericksonienne</strong>, une approche douce qui permet d'accompagner le changement en profondeur.</p>

<p>Les motifs de consultation fréquents chez les Auxerrois :</p>
<ul>
  <li>Anxiété et stress professionnel</li>
  <li>Burn-out et épuisement</li>
  <li>Transitions de vie (séparation, deuil, reconversion)</li>
  <li>Difficultés relationnelles</li>
  <li>Quête de sens et développement personnel</li>
</ul>

<h3>Accessibilité et horaires adaptés</h3>

<p>Je comprends les contraintes des habitants d'Auxerre. Je propose donc des <strong>horaires flexibles</strong> (consultations en soirée et le samedi) et des <strong>consultations en visioconférence</strong> pour ceux qui ne peuvent pas se déplacer.</p>
`;

const benefits = [
  'Thérapeute certifié',
  'À 40 min d\'Auxerre',
  'Cadre naturel ressourçant',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Visioconférence possible',
  'Discrétion assurée',
];

const testimonials = [
  {
    content: 'Le cadre du cabinet change de l\'atmosphère d\'Auxerre. C\'est vraiment un lieu propice au travail sur soi. David m\'a accompagnée avec beaucoup de bienveillance.',
    author: 'Catherine M.',
    location: 'Auxerre',
  },
  {
    content: 'Le trajet depuis Auxerre me permet de faire une vraie coupure. Les séances m\'aident énormément à gérer mon anxiété.',
    author: 'Laurent D.',
    location: 'Auxerre',
  },
];

const practicalInfo = {
  distance: '40 km',
  duration: '40 min',
  directions: 'Depuis Auxerre, prendre l\'A6 direction Paris, sortie Joigny, puis D943 vers Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Psychothérapie Yonne', href: '/psychotherapie-yonne' },
  { label: 'Psychothérapie Joigny', href: '/psychotherapie-joigny' },
  { label: 'Hypnose Auxerre', href: '/hypnose-auxerre' },
];

export default function PsychotherapieAuxerrePage() {
  return (
    <GeoPage
      title="Psychothérapie pour Auxerre"
      subtitle="Cabinet de psychothérapie accessible depuis Auxerre"
      description="David Duquenne, thérapeute certifié, accompagne les habitants d'Auxerre dans un cadre apaisant à Saint-Julien-du-Sault."
      service="psychotherapie"
      location={{
        city: 'Auxerre',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Psychothérapie', href: '/psychotherapie' },
        { name: 'Psychothérapie Auxerre', href: '/psychotherapie-auxerre' },
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
