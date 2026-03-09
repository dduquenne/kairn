import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Sophrologie Migennes | Cabinet proche | Appréciez Votre Vie',
  description:
    'Sophrologie près de Migennes (89). Nathalie Duquenne, sophrologue certifiée, vous accueille à 25 min pour anxiété, burn-out. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'sophrologie Migennes',
    'sophrologue Migennes',
    'thérapie Migennes 89',
    'anxiété Migennes',
    'sophrologie Migennes',
  ],
  openGraph: {
    title: 'Sophrologie près de Migennes - Nathalie Duquenne',
    description: 'Cabinet de sophrologie accessible depuis Migennes. Accompagnement personnalisé.',
    url: 'https://appreciezvotrevie.fr/sophrologie-migennes',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/sophrologie-migennes',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://appreciezvotrevie.fr/sophrologie-migennes',
  name: 'Appréciez Votre Vie - Sophrologie près de Migennes',
  description: 'Cabinet de sophrologie accessible depuis Migennes',
  url: 'https://appreciezvotrevie.fr/sophrologie-migennes',
  areaServed: {
    '@type': 'City',
    name: 'Migennes',
    sameAs: 'https://fr.wikipedia.org/wiki/Migennes',
  },
  provider: {
    '@type': 'Person',
    name: 'Nathalie Duquenne',
    jobTitle: 'Sophrologue, Relaxologue & Somatothérapeute',
  },
};

const mainContent = `
<p>Vous habitez <strong>Migennes</strong> et cherchez un accompagnement en sophrologie ? Le cabinet Appréciez Votre Vie est situé à Saint-Julien-du-Sault, à seulement <strong>25 minutes en voiture</strong> de Migennes.</p>

<p>Migennes, carrefour ferroviaire de l'Yonne, est une ville en pleine transformation. Ses habitants, entre tradition cheminote et nouvelles dynamiques, peuvent avoir besoin d'un espace pour se poser et faire le point.</p>

<h3>Un accompagnement pour les Migennois</h3>

<p>En tant que sophrologue certifiée, j'accueille régulièrement des habitants de Migennes et des communes voisines : Cheny, Laroche-Saint-Cydroine, Bassou, Bonnard...</p>

<p>Les motifs de consultation sont variés :</p>
<ul>
  <li><strong>Difficultés professionnelles</strong> : restructurations, changements d'organisation, stress au travail</li>
  <li><strong>Anxiété et dépression</strong> : mal-être, perte de sens, difficultés à avancer</li>
  <li><strong>Problématiques relationnelles</strong> : couple, famille, isolement</li>
  <li><strong>Deuil et séparation</strong> : accompagnement dans les moments de perte</li>
  <li><strong>Questionnements de vie</strong> : transitions, reconversion, retraite</li>
</ul>

<h3>Le cadre thérapeutique</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un environnement propice au travail sur soi. Installé dans un ancien moulin au bord de l'eau, il offre calme et sérénité, loin du tumulte quotidien.</p>

<p>Le trajet depuis Migennes (environ 20 km via la D943) prend une vingtaine de minutes. Ce temps de route peut devenir un rituel, une transition entre le quotidien et l'espace de la thérapie.</p>

<h3>Ma démarche thérapeutique</h3>

<p>Je pratique la <strong>sophrologie</strong>, une approche qui considère l'être humain dans sa globalité. Elle permet :</p>
<ul>
  <li>Comprendre ses schémas et ses blocages</li>
  <li>Accueillir et transformer les émotions</li>
  <li>Accéder à ses ressources profondes</li>
  <li>Favoriser le changement en douceur</li>
</ul>

<p>Cette approche intégrative s'adapte aux besoins de chacun et permet un travail en profondeur.</p>
`;

const benefits = [
  'Sophrologue certifiée',
  'À 25 min de Migennes',
  'Cadre calme et naturel',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Visioconférence possible',
  'Confidentialité assurée',
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
  distance: '20 km',
  duration: '25 min',
  directions: 'Depuis Migennes, prendre la D943 direction Sens. Le cabinet se trouve à l\'entrée de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Sophrologie Yonne', href: '/sophrologie-yonne' },
  { label: 'Sophrologie Joigny', href: '/sophrologie-joigny' },
  { label: 'Somatothérapie Migennes', href: '/somatotherapie-migennes' },
];

export default function SophrologieMigennesPage() {
  return (
    <GeoPage
      title="Sophrologie près de Migennes"
      subtitle="Cabinet de sophrologie accessible depuis Migennes"
      description="Nathalie Duquenne, sophrologue certifiée, accompagne les habitants de Migennes dans un cadre apaisant, à 25 minutes de la ville."
      service="sophrologie"
      location={{
        city: 'Migennes',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Sophrologie', href: '/sophrologie' },
        { name: 'Sophrologie Migennes', href: '/sophrologie-migennes' },
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
