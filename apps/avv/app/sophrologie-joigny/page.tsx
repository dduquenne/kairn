import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Sophrologie Joigny | Cabinet proche de chez vous | Appréciez Votre Vie',
  description:
    'Sophrologie près de Joigny (89). Nathalie Duquenne, sophrologue certifiée, vous accueille à 15 min en voiture pour anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'sophrologie Joigny',
    'sophrologue Joigny',
    'thérapie Joigny 89',
    'anxiété Joigny',
    'burn-out Joigny',
    'sophrologie Joigny',
  ],
  openGraph: {
    title: 'Sophrologie près de Joigny - Nathalie Duquenne',
    description: 'Cabinet de sophrologie à 15 min de Joigny. Accompagnement personnalisé par Nathalie Duquenne.',
    url: 'https://appreciezvotrevie.fr/sophrologie-joigny',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/sophrologie-joigny',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://appreciezvotrevie.fr/sophrologie-joigny',
  name: 'Appréciez Votre Vie - Sophrologie près de Joigny',
  description: 'Cabinet de sophrologie accessible depuis Joigny',
  url: 'https://appreciezvotrevie.fr/sophrologie-joigny',
  areaServed: {
    '@type': 'City',
    name: 'Joigny',
    sameAs: 'https://fr.wikipedia.org/wiki/Joigny',
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
};

const mainContent = `
<p>Vous habitez <strong>Joigny</strong> ou ses environs et recherchez un accompagnement en sophrologie ? Le cabinet Appréciez Votre Vie vous accueille à Saint-Julien-du-Sault, à seulement <strong>15 minutes en voiture</strong> de Joigny.</p>

<p>Joigny, ville historique de l'Yonne, est connue pour ses maisons à pans de bois et son dynamisme. Ses habitants méritent un accompagnement thérapeutique de qualité, accessible et personnalisé.</p>

<h3>Un accompagnement adapté aux Joviniennes et Joviniens</h3>

<p>En tant que <strong>sophrologue certifiée</strong>, j'accompagne depuis de nombreuses années les habitants de Joigny et de ses communes voisines : Villecien, Chamvres, Migennes, Saint-Aubin-sur-Yonne, Looze...</p>

<p>Les motifs de consultation sont variés :</p>
<ul>
  <li>Difficultés relationnelles (couple, famille, travail)</li>
  <li>Anxiété et crises d'angoisse</li>
  <li>Burn-out et épuisement professionnel</li>
  <li>Deuil et séparation</li>
  <li>Questionnements existentiels</li>
  <li>Traumatismes et blessures du passé</li>
</ul>

<h3>Pourquoi choisir un cabinet proche de Joigny ?</h3>

<p>La proximité géographique est un atout pour un suivi thérapeutique régulier. À seulement 12 km de Joigny, le cabinet de Saint-Julien-du-Sault offre un cadre idéal : un ancien moulin rénové, au calme, propice à l'introspection et au travail thérapeutique.</p>

<p>Le trajet depuis Joigny se fait en suivant la D943 direction Sens. Le cabinet est situé à l'entrée de Saint-Julien-du-Sault, avec un parking gratuit.</p>

<h3>Première séance : créer l'alliance thérapeutique</h3>

<p>La première rencontre est essentielle. Elle permet de faire connaissance, de clarifier votre demande et d'établir ensemble les bases de notre travail. C'est aussi l'occasion de voir si le courant passe et si ma manière de travailler vous convient.</p>

<p>Je pratique la <strong>sophrologie</strong>, une approche qui permet d'accéder aux ressources profondes et de favoriser le changement en douceur.</p>
`;

const benefits = [
  'Sophrologue certifiée',
  'À seulement 15 min de Joigny',
  'Parking gratuit sur place',
  'Cadre apaisant au Moulin d\'en Bas',
  'Horaires flexibles (soir et samedi)',
  'Tarif solidaire disponible',
  'Consultations visio possibles',
  'Première séance pour faire connaissance',
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
  distance: '12 km',
  duration: '15 min',
  directions: 'Depuis Joigny, prendre la D943 direction Sens. Traverser Saint-Julien-du-Sault, le cabinet est à la sortie du village sur la gauche.',
};

const relatedLinks = [
  { label: 'Sophrologie Yonne', href: '/sophrologie-yonne' },
  { label: 'Sophrologie Migennes', href: '/sophrologie-migennes' },
  { label: 'Somatothérapie Joigny', href: '/somatotherapie-joigny' },
];

export default function SophrologieJoignyPage() {
  return (
    <GeoPage
      title="Sophrologie près de Joigny"
      subtitle="Cabinet à 15 minutes de Joigny pour un accompagnement de proximité"
      description="Nathalie Duquenne, sophrologue certifiée, accompagne les habitants de Joigny et environs dans un cadre apaisant à Saint-Julien-du-Sault."
      service="sophrologie"
      location={{
        city: 'Joigny',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Sophrologie', href: '/sophrologie' },
        { name: 'Sophrologie Joigny', href: '/sophrologie-joigny' },
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
