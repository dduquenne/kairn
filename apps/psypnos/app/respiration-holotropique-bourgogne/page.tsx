import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Respiration Holotropique Bourgogne | Séminaires Psypnos',
  description:
    'Séminaires de respiration holotropique en Bourgogne. David Duquenne, facilitateur certifié. Ateliers de groupe pour exploration intérieure et développement personnel.',
  keywords: [
    'respiration holotropique Bourgogne',
    'séminaire respiration holotropique',
    'holotropique Bourgogne-Franche-Comté',
    'breathwork Bourgogne',
    'atelier respiration',
    'Grof Bourgogne',
    'développement personnel Bourgogne',
  ],
  openGraph: {
    title: 'Respiration Holotropique en Bourgogne - Séminaires Psypnos',
    description: 'Séminaires de respiration holotropique en Bourgogne. Ateliers de groupe pour exploration intérieure.',
    url: 'https://psypnos.fr/respiration-holotropique-bourgogne',
  },
  alternates: {
    canonical: 'https://psypnos.fr/respiration-holotropique-bourgogne',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  '@id': 'https://psypnos.fr/respiration-holotropique-bourgogne',
  name: 'Séminaires de Respiration Holotropique en Bourgogne',
  description: 'Ateliers de respiration holotropique pour exploration intérieure',
  url: 'https://psypnos.fr/respiration-holotropique-bourgogne',
  location: {
    '@type': 'Place',
    name: "Le Moulin d'en Bas",
    address: {
      '@type': 'PostalAddress',
      streetAddress: "Le Moulin d'en Bas",
      addressLocality: 'Saint-Julien-du-Sault',
      postalCode: '89330',
      addressCountry: 'FR',
    },
  },
  organizer: {
    '@type': 'Person',
    name: 'David Duquenne',
    jobTitle: 'Facilitateur de respiration holotropique',
  },
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
};

const mainContent = `
<p>Vous cherchez des <strong>séminaires de respiration holotropique en Bourgogne</strong> ? Le cabinet Psypnos organise régulièrement des ateliers au Moulin d'en Bas à Saint-Julien-du-Sault, dans l'Yonne.</p>

<p>La <strong>respiration holotropique</strong> est une technique puissante de travail sur soi, développée par le psychiatre Stanislav Grof. Elle utilise la respiration amplifiée, la musique évocatrice et le travail corporel pour induire des états modifiés de conscience propices à l'exploration intérieure.</p>

<h3>Qu'est-ce que la respiration holotropique ?</h3>

<p>Le terme "holotropique" vient du grec et signifie "se diriger vers la totalité". Cette pratique permet d'accéder à des dimensions de soi habituellement inaccessibles à la conscience ordinaire :</p>
<ul>
  <li><strong>Mémoires biographiques</strong> : événements oubliés de l'enfance</li>
  <li><strong>Mémoires périnatales</strong> : expériences liées à la naissance</li>
  <li><strong>Dimensions transpersonnelles</strong> : connexion à quelque chose de plus grand</li>
  <li><strong>Expériences de guérison</strong> : libération émotionnelle et corporelle</li>
</ul>

<h3>Le déroulement d'un séminaire</h3>

<p>Les séminaires de respiration holotropique se déroulent généralement sur <strong>un week-end</strong> (samedi et dimanche) :</p>
<ul>
  <li><strong>Samedi matin</strong> : accueil, présentation de la méthode, préparation</li>
  <li><strong>Samedi après-midi</strong> : première session de respiration (3h)</li>
  <li><strong>Samedi soir</strong> : partage en groupe, expression créative (mandala)</li>
  <li><strong>Dimanche matin</strong> : deuxième session de respiration (3h)</li>
  <li><strong>Dimanche après-midi</strong> : intégration, partage final</li>
</ul>

<h3>Le travail en binôme</h3>

<p>Chaque participant alterne entre les rôles de <strong>respirant</strong> et d'<strong>accompagnant</strong> (sitter). Cette structure garantit un cadre sécurisé et une attention personnalisée pour chaque participant.</p>

<h3>Un cadre exceptionnel en Bourgogne</h3>

<p>Le Moulin d'en Bas offre un environnement idéal pour la pratique de la respiration holotropique :</p>
<ul>
  <li>Un lieu préservé au cœur de la nature bourguignonne</li>
  <li>Un espace suffisamment grand pour accueillir un groupe</li>
  <li>Une atmosphère propice à l'introspection</li>
  <li>L'énergie particulière d'un ancien moulin</li>
</ul>

<p>Les participants viennent de toute la Bourgogne-Franche-Comté (Auxerre, Dijon, Sens, Nevers...) et même de Paris pour ces séminaires uniques.</p>

<h3>Pour qui est la respiration holotropique ?</h3>

<p>La respiration holotropique s'adresse à toute personne en quête d'évolution personnelle :</p>
<ul>
  <li>Ceux qui souhaitent explorer leur monde intérieur</li>
  <li>Ceux qui cherchent à dépasser des blocages anciens</li>
  <li>Ceux qui veulent vivre une expérience transformatrice</li>
  <li>Ceux qui s'intéressent aux approches transpersonnelles</li>
</ul>

<p><strong>Contre-indications</strong> : grossesse, problèmes cardiovasculaires, épilepsie, certains troubles psychiatriques. Un entretien préalable permet de vérifier l'adéquation de la pratique.</p>

<h3>Prochains séminaires</h3>

<p>Les dates des prochains séminaires sont annoncées sur la page <a href="/respiration-holotropique">Respiration holotropique</a> et sur la newsletter. Pour être informé, contactez-moi ou inscrivez-vous à la liste de diffusion.</p>
`;

const benefits = [
  'Facilitateur certifié GTT',
  'Cadre naturel exceptionnel',
  'Petits groupes (8-12 personnes)',
  'Week-end complet d\'immersion',
  'Accompagnement personnalisé',
  'Hébergement possible à proximité',
  'Formation Grof authentique',
  'Suivi post-séminaire',
];

const testimonials = [
  {
    content: 'Une expérience profondément transformatrice. Le cadre du Moulin d\'en Bas et l\'accompagnement de David créent un espace de confiance unique. Je reviens pour chaque séminaire.',
    author: 'Laurent K.',
    location: 'Dijon',
  },
  {
    content: 'J\'ai découvert la respiration holotropique lors d\'un séminaire ici. Cette pratique a changé ma façon de voir la vie et de me comprendre.',
    author: 'Anne-Marie P.',
    location: 'Auxerre',
  },
];

const practicalInfo = {
  distance: 'Centre de la Bourgogne',
  duration: 'Variable selon votre ville',
  directions: 'Le Moulin d\'en Bas est situé à Saint-Julien-du-Sault (89), accessible depuis l\'A6 (sortie Joigny) ou la D606 depuis Sens.',
};

const relatedLinks = [
  { label: 'Respiration holotropique Yonne', href: '/respiration-holotropique-yonne' },
  { label: 'En savoir plus sur la respiration', href: '/respiration-holotropique' },
  { label: 'Psychothérapie Yonne', href: '/psychotherapie-yonne' },
];

export default function RespirationHolotropiqueBourgognePage() {
  return (
    <GeoPage
      title="Respiration Holotropique en Bourgogne"
      subtitle="Séminaires de breathwork au cœur de la Bourgogne"
      description="David Duquenne organise des séminaires de respiration holotropique au Moulin d'en Bas, accessibles depuis toute la Bourgogne-Franche-Comté."
      service="respiration"
      location={{
        city: 'Bourgogne',
        region: 'Bourgogne-Franche-Comté',
      }}
      breadcrumbItems={[
        { name: 'Respiration holotropique', href: '/respiration-holotropique' },
        { name: 'Respiration holotropique Bourgogne', href: '/respiration-holotropique-bourgogne' },
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
