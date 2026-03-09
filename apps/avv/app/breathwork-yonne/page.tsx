import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Breathwork & Rebirth Yonne | Séminaires dans le 89 | Appréciez Votre Vie',
  description:
    'Séminaires de breathwork & rebirth dans l\'Yonne (89). Nathalie Duquenne, facilitatrice certifiée à Saint-Julien-du-Sault. Ateliers pour exploration intérieure.',
  keywords: [
    'breathwork & rebirth Yonne',
    'holotropique 89',
    'séminaire respiration Yonne',
    'breathwork Yonne',
    'Grof Yonne',
    'atelier respiration Auxerre',
    'breathwork & rebirth Sens',
  ],
  openGraph: {
    title: 'Breathwork & Rebirth dans l\'Yonne - Séminaires Appréciez Votre Vie',
    description: 'Séminaires de breathwork & rebirth dans l\'Yonne. Ateliers au Moulin d\'en Bas.',
    url: 'https://appreciezvotrevie.fr/breathwork-yonne',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/breathwork-yonne',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  '@id': 'https://appreciezvotrevie.fr/breathwork-yonne',
  name: 'Séminaires de Breathwork & Rebirth dans l\'Yonne',
  description: 'Ateliers de breathwork & rebirth dans le département de l\'Yonne',
  url: 'https://appreciezvotrevie.fr/breathwork-yonne',
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
    name: 'Nathalie Duquenne',
  },
};

const mainContent = `
<p>Vous habitez dans l'<strong>Yonne</strong> et souhaitez découvrir la <strong>breathwork & rebirth</strong> ? Des séminaires sont organisés régulièrement au Moulin d'en Bas à Saint-Julien-du-Sault, au cœur du département.</p>

<p>La breathwork & rebirth est une technique de travail sur soi qui utilise la respiration amplifiée pour induire des états modifiés de conscience. Développée par le psychiatre tchèque Stanislav Grof, elle offre un chemin unique vers l'exploration intérieure et la guérison.</p>

<h3>Une pratique accessible aux Icaunais</h3>

<p>Le cabinet de Saint-Julien-du-Sault est idéalement situé pour les habitants de l'Yonne :</p>
<ul>
  <li><strong>Depuis Sens</strong> : 25 km (25 min)</li>
  <li><strong>Depuis Joigny</strong> : 12 km (15 min)</li>
  <li><strong>Depuis Auxerre</strong> : 35 km (40 min)</li>
  <li><strong>Depuis Migennes</strong> : 20 km (25 min)</li>
</ul>

<p>Le Moulin d'en Bas offre un cadre unique pour cette pratique : un ancien moulin rénové, au calme de la campagne icaunaise, propice à l'introspection et au travail intérieur.</p>

<h3>Qu'est-ce que la breathwork & rebirth ?</h3>

<p>Le terme "holotropique" signifie "se mouvoir vers la totalité". Cette pratique combine :</p>
<ul>
  <li><strong>Une respiration amplifiée</strong> : plus profonde et plus rapide que la normale</li>
  <li><strong>Une musique évocatrice</strong> : spécialement sélectionnée pour accompagner le processus</li>
  <li><strong>Un travail corporel</strong> : pour faciliter la libération des tensions</li>
  <li><strong>L'expression créative</strong> : mandala pour intégrer l'expérience</li>
</ul>

<h3>Les bienfaits de la breathwork & rebirth</h3>

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

<p>Les séminaires de breathwork & rebirth se déroulent sur <strong>un week-end complet</strong> :</p>
<ul>
  <li>Du samedi matin au dimanche après-midi</li>
  <li>Deux sessions de respiration (une par jour)</li>
  <li>Temps de partage et d'intégration</li>
  <li>Petit groupe (8 à 12 personnes)</li>
  <li>Travail en binôme (respirant/accompagnant)</li>
</ul>

<h3>Conditions de participation</h3>

<p>La breathwork & rebirth est une pratique intense qui nécessite une bonne santé physique et psychique. Un entretien préalable est obligatoire pour s'assurer que cette pratique vous convient.</p>

<p><strong>Contre-indications principales</strong> :</p>
<ul>
  <li>Grossesse</li>
  <li>Problèmes cardiovasculaires</li>
  <li>Épilepsie</li>
  <li>Certains troubles psychiatriques</li>
  <li>Asthme sévère</li>
</ul>

<h3>S'inscrire à un séminaire</h3>

<p>Pour connaître les prochaines dates et vous inscrire, consultez la page <a href="/breathwork">Breathwork & Rebirth</a> ou contactez-moi directement. Un entretien téléphonique est prévu avant toute inscription.</p>
`;

const benefits = [
  'Séminaires dans l\'Yonne',
  'Facilitatrice certifiée GTT',
  'Cadre naturel exceptionnel',
  'Petits groupes',
  'Formation Grof authentique',
  'Entretien préalable inclus',
  'Hébergement possible à proximité',
  'Suivi post-séminaire',
];

const researchStats = [
  {
    stat: '82% des participants',
    description: 'rapportent des améliorations significatives de leur bien-être psychologique après des sessions de breathwork & rebirth.',
    source: 'Rhinewine & Williams - Journal of Transpersonal Psychology',
    sourceUrl: 'https://www.atpweb.org/jtparchive/trps-39-01-003.pdf',
  },
  {
    stat: 'Réduction du stress',
    description: 'Les techniques de respiration consciente montrent une diminution significative du cortisol et des marqueurs de stress.',
    source: 'Ma et al. - Frontiers in Psychology',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/28649226/',
  },
  {
    stat: '50 ans de recherche',
    description: 'La breathwork & rebirth, développée par Stanislav Grof, s\'appuie sur des décennies de recherche en psychiatrie transpersonnelle.',
    source: 'Grof Transpersonal Training',
    sourceUrl: 'https://www.holotropic.com/research/',
  },
];

const practicalInfo = {
  distance: 'Centre de l\'Yonne',
  duration: '15-45 min selon votre ville',
  directions: 'Le Moulin d\'en Bas est accessible depuis l\'A6 (sortie Joigny) ou la D606 depuis Sens. Parking gratuit sur place.',
};

const relatedLinks = [
  { label: 'Breathwork & Rebirth Bourgogne', href: '/breathwork-bourgogne' },
  { label: 'En savoir plus sur le breathwork', href: '/breathwork' },
  { label: 'Sophrologie Yonne', href: '/sophrologie-yonne' },
  { label: 'Somatothérapie Yonne', href: '/somatotherapie-yonne' },
];

export default function BreathworkYonnePage() {
  return (
    <GeoPage
      title="Breathwork & Rebirth dans l'Yonne"
      subtitle="Séminaires de breathwork au cœur du département 89"
      description="Nathalie Duquenne organise des séminaires de breathwork & rebirth à Saint-Julien-du-Sault, accessibles depuis toute l'Yonne."
      service="breathwork"
      location={{
        city: "l'Yonne",
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Breathwork & Rebirth', href: '/breathwork' },
        { name: 'Breathwork & Rebirth Yonne', href: '/breathwork-yonne' },
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
