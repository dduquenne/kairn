import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Respiration Holotropique Yonne | Séminaires dans le 89 | Psypnos',
  description:
    'Séminaires de respiration holotropique dans l\'Yonne (89). David Duquenne, facilitateur certifié à Saint-Julien-du-Sault. Ateliers pour exploration intérieure.',
  keywords: [
    'respiration holotropique Yonne',
    'holotropique 89',
    'séminaire respiration Yonne',
    'breathwork Yonne',
    'Grof Yonne',
    'atelier respiration Auxerre',
    'respiration holotropique Sens',
  ],
  openGraph: {
    title: 'Respiration Holotropique dans l\'Yonne - Séminaires Psypnos',
    description: 'Séminaires de respiration holotropique dans l\'Yonne. Ateliers au Moulin d\'en Bas.',
    url: 'https://psypnos.fr/respiration-holotropique-yonne',
  },
  alternates: {
    canonical: 'https://psypnos.fr/respiration-holotropique-yonne',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  '@id': 'https://psypnos.fr/respiration-holotropique-yonne',
  name: 'Séminaires de Respiration Holotropique dans l\'Yonne',
  description: 'Ateliers de respiration holotropique dans le département de l\'Yonne',
  url: 'https://psypnos.fr/respiration-holotropique-yonne',
  location: {
    '@type': 'Place',
    name: "Le Moulin d'en Bas",
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Saint-Julien-du-Sault',
      addressRegion: 'Yonne',
      postalCode: '89330',
    },
  },
  organizer: {
    '@type': 'Person',
    name: 'David Duquenne',
  },
};

const mainContent = `
<p>Vous habitez dans l'<strong>Yonne</strong> et souhaitez découvrir la <strong>respiration holotropique</strong> ? Des séminaires sont organisés régulièrement au Moulin d'en Bas à Saint-Julien-du-Sault, au cœur du département.</p>

<p>La respiration holotropique est une technique de travail sur soi qui utilise la respiration amplifiée pour induire des états modifiés de conscience. Développée par le psychiatre tchèque Stanislav Grof, elle offre un chemin unique vers l'exploration intérieure et la guérison.</p>

<h3>Une pratique accessible aux Icaunais</h3>

<p>Le cabinet de Saint-Julien-du-Sault est idéalement situé pour les habitants de l'Yonne :</p>
<ul>
  <li><strong>Depuis Sens</strong> : 25 km (25 min)</li>
  <li><strong>Depuis Joigny</strong> : 12 km (15 min)</li>
  <li><strong>Depuis Auxerre</strong> : 35 km (40 min)</li>
  <li><strong>Depuis Migennes</strong> : 20 km (25 min)</li>
</ul>

<p>Le Moulin d'en Bas offre un cadre unique pour cette pratique : un ancien moulin rénové, au calme de la campagne icaunaise, propice à l'introspection et au travail intérieur.</p>

<h3>Qu'est-ce que la respiration holotropique ?</h3>

<p>Le terme "holotropique" signifie "se mouvoir vers la totalité". Cette pratique combine :</p>
<ul>
  <li><strong>Une respiration amplifiée</strong> : plus profonde et plus rapide que la normale</li>
  <li><strong>Une musique évocatrice</strong> : spécialement sélectionnée pour accompagner le processus</li>
  <li><strong>Un travail corporel</strong> : pour faciliter la libération des tensions</li>
  <li><strong>L'expression créative</strong> : mandala pour intégrer l'expérience</li>
</ul>

<h3>Les bienfaits de la respiration holotropique</h3>

<p>Cette pratique peut permettre :</p>
<ul>
  <li>La libération de tensions et d'émotions anciennes</li>
  <li>L'accès à des mémoires oubliées</li>
  <li>Une meilleure connaissance de soi</li>
  <li>Des prises de conscience transformatrices</li>
  <li>Un sentiment de connexion et d'unité</li>
  <li>La résolution de schémas répétitifs</li>
</ul>

<h3>Format des séminaires</h3>

<p>Les séminaires de respiration holotropique se déroulent sur <strong>un week-end complet</strong> :</p>
<ul>
  <li>Du samedi matin au dimanche après-midi</li>
  <li>Deux sessions de respiration (une par jour)</li>
  <li>Temps de partage et d'intégration</li>
  <li>Petit groupe (8 à 12 personnes)</li>
  <li>Travail en binôme (respirant/accompagnant)</li>
</ul>

<h3>Conditions de participation</h3>

<p>La respiration holotropique est une pratique intense qui nécessite une bonne santé physique et psychique. Un entretien préalable est obligatoire pour s'assurer que cette pratique vous convient.</p>

<p><strong>Contre-indications principales</strong> :</p>
<ul>
  <li>Grossesse</li>
  <li>Problèmes cardiovasculaires</li>
  <li>Épilepsie</li>
  <li>Certains troubles psychiatriques</li>
  <li>Asthme sévère</li>
</ul>

<h3>S'inscrire à un séminaire</h3>

<p>Pour connaître les prochaines dates et vous inscrire, consultez la page <a href="/respiration-holotropique">Respiration holotropique</a> ou contactez-moi directement. Un entretien téléphonique est prévu avant toute inscription.</p>
`;

const benefits = [
  'Séminaires dans l\'Yonne',
  'Facilitateur certifié GTT',
  'Cadre naturel exceptionnel',
  'Petits groupes',
  'Formation Grof authentique',
  'Entretien préalable inclus',
  'Hébergement possible à proximité',
  'Suivi post-séminaire',
];

const testimonials = [
  {
    content: 'Habitant l\'Yonne, j\'étais ravi de trouver un séminaire de respiration holotropique près de chez moi. L\'expérience a dépassé toutes mes attentes.',
    author: 'Stéphane M.',
    location: 'Auxerre',
  },
  {
    content: 'Le cadre du Moulin d\'en Bas est parfait pour cette pratique. On est vraiment coupé du monde, dans un cocon propice à l\'exploration intérieure.',
    author: 'Karine D.',
    location: 'Sens',
  },
];

const practicalInfo = {
  distance: 'Centre de l\'Yonne',
  duration: '15-45 min selon votre ville',
  directions: 'Le Moulin d\'en Bas est accessible depuis l\'A6 (sortie Joigny) ou la D606 depuis Sens. Parking gratuit sur place.',
};

const relatedLinks = [
  { label: 'Respiration holotropique Bourgogne', href: '/respiration-holotropique-bourgogne' },
  { label: 'En savoir plus sur la respiration', href: '/respiration-holotropique' },
  { label: 'Hypnothérapeute Yonne', href: '/hypnotherapeute-yonne' },
  { label: 'Hypnose Yonne', href: '/hypnose-yonne' },
];

export default function RespirationHolotropiqueYonnePage() {
  return (
    <GeoPage
      title="Respiration Holotropique dans l'Yonne"
      subtitle="Séminaires de breathwork au cœur du département 89"
      description="David Duquenne organise des séminaires de respiration holotropique à Saint-Julien-du-Sault, accessibles depuis toute l'Yonne."
      service="respiration"
      location={{
        city: "l'Yonne",
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Respiration holotropique', href: '/respiration-holotropique' },
        { name: 'Respiration holotropique Yonne', href: '/respiration-holotropique-yonne' },
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
