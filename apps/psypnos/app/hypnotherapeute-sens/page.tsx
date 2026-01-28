import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnothérapeute Sens | David Duquenne | Cabinet à 25 min',
  description:
    'Hypnothérapeute près de Sens (89). David Duquenne vous accueille à 25 min pour hypnose ericksonienne, anxiété, burn-out, deuil. Cabinet au Moulin d\'en Bas.',
  keywords: [
    'hypnothérapeute Sens',
    'hypnose Sens',
    'hypnose ericksonienne Sens 89',
    'anxiété Sens',
    'burn-out Sens',
  ],
  openGraph: {
    title: 'Hypnothérapeute près de Sens - David Duquenne',
    description: 'Cabinet d\'hypnothérapie à 25 min de Sens. Accompagnement par hypnose ericksonienne pour anxiété, burn-out, transitions de vie.',
    url: 'https://psypnos.fr/hypnotherapeute-sens',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnotherapeute-sens',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnotherapeute-sens',
  name: 'Psypnos - Hypnothérapeute près de Sens',
  description: 'Cabinet d\'hypnothérapie accessible depuis Sens',
  url: 'https://psypnos.fr/hypnotherapeute-sens',
  areaServed: {
    '@type': 'City',
    name: 'Sens',
    sameAs: 'https://fr.wikipedia.org/wiki/Sens_(Yonne)',
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
<p>Vous cherchez un <strong>hypnothérapeute près de Sens</strong> ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à seulement <strong>25 minutes en voiture</strong> de Sens via la D606.</p>

<p>Sens, ville historique aux portes de la Bourgogne, est la sous-préfecture la plus proche de Paris. Ses habitants vivent souvent au rythme effréné des allers-retours vers la capitale. L'hypnose ericksonienne peut aider à retrouver l'équilibre.</p>

<h3>Hypnothérapie pour les Sénonais</h3>

<p>En tant qu'hypnothérapeute certifié, j'accompagne de nombreux habitants de Sens et de son agglomération : Paron, Saint-Clément, Maillot, Gron, Villeneuve-sur-Yonne...</p>

<p>Les Sénonais me consultent souvent pour :</p>
<ul>
  <li><strong>L'épuisement lié aux trajets</strong> : les navettes quotidiennes vers Paris génèrent stress et fatigue</li>
  <li><strong>Les transitions professionnelles</strong> : reconversion, perte d'emploi, retraite</li>
  <li><strong>L'anxiété et le stress</strong> : crises d'angoisse, ruminations</li>
  <li><strong>Les phobies et blocages</strong> : peurs irrationnelles, comportements limitants</li>
  <li><strong>Le deuil et la séparation</strong> : accompagnement dans les moments difficiles</li>
</ul>

<h3>Un cadre propice au travail sur soi</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un cadre très différent de l'environnement urbain de Sens. Situé dans un ancien moulin rénové, au bord de l'eau, il invite au calme et à l'introspection.</p>

<p>Ce changement de décor, même pour un court trajet, peut faciliter la transition vers un état de conscience modifié, propice au travail hypnotique.</p>

<h3>L'hypnose ericksonienne</h3>

<p>L'<strong>hypnose ericksonienne</strong> que je pratique est une approche douce et respectueuse qui permet :</p>
<ul>
  <li>D'accéder à vos ressources intérieures</li>
  <li>De dépasser les blocages et les peurs</li>
  <li>De favoriser le changement en profondeur</li>
  <li>De retrouver confiance et sérénité</li>
</ul>

<p>Vous restez conscient et acteur de votre séance. L'hypnose amplifie vos capacités naturelles de guérison et de transformation.</p>

<h3>Flexibilité pour les Sénonais</h3>

<p>Je comprends les contraintes des habitants de Sens, notamment ceux qui travaillent à Paris. Je propose donc des <strong>horaires adaptés</strong> (fin de journée, samedi) et des <strong>consultations en visioconférence</strong> pour ceux qui ne peuvent pas se déplacer.</p>
`;

const benefits = [
  'Hypnothérapeute certifié',
  'À 25 min de Sens',
  'Horaires adaptés aux navetteurs',
  'Consultations en soirée',
  'Séances le samedi',
  'Visioconférence possible',
  'Parking gratuit',
  'Cadre naturel apaisant',
];

const testimonials = [
  {
    content: 'Entre Paris et Sens, j\'avais l\'impression de courir sans cesse. Les séances d\'hypnose avec David m\'ont aidée à retrouver un équilibre et à prendre soin de moi.',
    author: 'Sophie T.',
    location: 'Sens',
  },
  {
    content: 'Le cadre du cabinet change de tout ce que je connais. L\'hypnose m\'a permis de dépasser mes angoisses. Je repars toujours plus serein.',
    author: 'Antoine L.',
    location: 'Paron',
  },
];

const practicalInfo = {
  distance: '25 km',
  duration: '25 min',
  directions: 'Depuis Sens, prendre la D606 direction Joigny. À Saint-Julien-du-Sault, suivre les panneaux "Le Moulin".',
};

const relatedLinks = [
  { label: 'Hypnothérapeute Yonne', href: '/hypnotherapeute-yonne' },
  { label: 'Hypnothérapeute Joigny', href: '/hypnotherapeute-joigny' },
  { label: 'Hypnose Sens', href: '/hypnose-sens' },
];

export default function HypnotherapeuteSensPage() {
  return (
    <GeoPage
      title="Hypnothérapeute près de Sens"
      subtitle="Cabinet d'hypnothérapie à 25 minutes de Sens"
      description="David Duquenne, hypnothérapeute certifié, accompagne les Sénonais dans un cabinet accessible, avec des horaires adaptés aux contraintes de chacun."
      service="hypnose"
      location={{
        city: 'Sens',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnothérapeute Sens', href: '/hypnotherapeute-sens' },
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
