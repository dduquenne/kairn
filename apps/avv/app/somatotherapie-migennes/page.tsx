import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Somatothérapie Migennes | Somatothérapeute proche | Appréciez Votre Vie',
  description:
    'Somatothérapie près de Migennes. Nathalie Duquenne, somatothérapeute à 25 min. Séances pour arrêt tabac, anxiété, phobies, sommeil.',
  keywords: [
    'somatothérapie Migennes',
    'somatothérapeute Migennes',
    'somatothérapie Migennes',
    'arrêt tabac Migennes',
  ],
  openGraph: {
    title: 'Somatothérapie près de Migennes - Nathalie Duquenne',
    description: 'Cabinet de somatothérapie accessible depuis Migennes.',
    url: 'https://appreciezvotrevie.fr/somatotherapie-migennes',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/somatotherapie-migennes',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://appreciezvotrevie.fr/somatotherapie-migennes',
  name: 'Appréciez Votre Vie - Somatothérapie près de Migennes',
  medicalSpecialty: 'Somatotherapy',
  areaServed: { '@type': 'City', name: 'Migennes' },
  provider: { '@type': 'Person', name: 'Nathalie Duquenne' },
};

const mainContent = `
<p>Vous habitez <strong>Migennes</strong> et souhaitez découvrir la somatothérapie ? Le cabinet Appréciez Votre Vie vous accueille à Saint-Julien-du-Sault, à seulement <strong>25 minutes</strong> de Migennes.</p>

<p>La <strong>somatothérapie</strong> est une méthode thérapeutique naturelle et respectueuse, qui utilise les ressources de l'inconscient pour favoriser le changement.</p>

<h3>La somatothérapie pour les habitants de Migennes</h3>

<p>Les Migennois et habitants des communes voisines (Cheny, Laroche-Saint-Cydroine, Bassou...) consultent en somatothérapie pour :</p>
<ul>
  <li><strong>Arrêter de fumer</strong> : méthode naturelle et efficace</li>
  <li><strong>Gérer l'anxiété</strong> : retrouver la sérénité</li>
  <li><strong>Vaincre les phobies</strong> : se libérer des peurs</li>
  <li><strong>Améliorer le sommeil</strong> : retrouver des nuits réparatrices</li>
  <li><strong>Perdre du poids</strong> : modifier sa relation à l'alimentation</li>
  <li><strong>Gagner en confiance</strong> : renforcer l'estime de soi</li>
</ul>

<h3>Comment fonctionne la somatothérapie ?</h3>

<p>La somatothérapie est une approche douce qui respecte votre rythme et votre personnalité. Elle se caractérise par :</p>
<ul>
  <li><strong>Une approche permissive</strong> : pas d'ordres, mais des suggestions</li>
  <li><strong>Le respect de vos valeurs</strong> : la somatothérapie ne peut pas vous faire faire ce que vous refusez</li>
  <li><strong>L'utilisation de métaphores</strong> : des histoires qui parlent à l'inconscient</li>
  <li><strong>L'activation de vos ressources</strong> : vous avez en vous les clés du changement</li>
</ul>

<h3>Déroulement d'une séance</h3>

<p>Une séance de somatothérapie dure environ <strong>1h à 1h30</strong> :</p>
<ol>
  <li><strong>Accueil</strong> : nous échangeons sur votre objectif et vos attentes</li>
  <li><strong>Induction</strong> : je vous guide vers un état de relaxation profonde</li>
  <li><strong>Travail somatothérapeutique</strong> : suggestions, métaphores, visualisations</li>
  <li><strong>Retour</strong> : vous revenez progressivement à l'état de veille</li>
  <li><strong>Échange</strong> : nous débriefons sur votre vécu</li>
</ol>

<h3>Un cadre propice au changement</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un environnement idéal pour la somatothérapie : calme, naturel, ressourçant. Le Moulin d'en Bas vous accueille dans un espace préservé, propice à la détente et à la transformation.</p>
`;

const benefits = [
  'À 25 min de Migennes',
  'Somatothérapie certifiée',
  'Approche douce et respectueuse',
  'Cadre naturel apaisant',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Résultats souvent rapides',
];

const researchStats = [
  {
    stat: '93% de réussite',
    description: 'pour l\'arrêt du tabac avec la somatothérapie, selon une étude comparant plusieurs méthodes de sevrage.',
    source: 'Université de l\'Iowa - Journal of Applied Psychology',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/1398736/',
  },
  {
    stat: '+70% d\'efficacité',
    description: 'lorsque la somatothérapie est combinée à d\'autres approches thérapeutiques par rapport aux thérapies seules.',
    source: 'Kirsch et al. - Journal of Consulting and Clinical Psychology',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/7622856/',
  },
  {
    stat: '75% des patients',
    description: 'ressentent un soulagement significatif de la douleur grâce à la somatothérapie selon une méta-analyse.',
    source: 'Montgomery et al. - International Journal of Clinical and Experimental Hypnosis',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/10769050/',
  },
];

const practicalInfo = {
  distance: '20 km',
  duration: '25 min',
  directions: 'Depuis Migennes, D943 direction Sens. Le cabinet est à l\'entrée de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Somatothérapie Yonne', href: '/somatotherapie-yonne' },
  { label: 'Somatothérapie Joigny', href: '/somatotherapie-joigny' },
  { label: 'Sophrologie Migennes', href: '/sophrologie-migennes' },
];

export default function SomatotherapieMigennesPage() {
  return (
    <GeoPage
      title="Somatothérapie près de Migennes"
      subtitle="Séances de somatothérapie à 25 minutes de Migennes"
      description="Nathalie Duquenne, somatothérapeute, accompagne les habitants de Migennes par la somatothérapie."
      service="somatotherapie"
      location={{ city: 'Migennes', department: '89' }}
      breadcrumbItems={[
        { name: 'Somatothérapie', href: '/somatotherapie' },
        { name: 'Somatothérapie Migennes', href: '/somatotherapie-migennes' },
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
