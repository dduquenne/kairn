import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Somatothérapie Joigny | Somatothérapeute à 15 min | Appréciez Votre Vie',
  description:
    'Somatothérapie près de Joigny. Nathalie Duquenne, somatothérapeute à 15 min. Séances pour anxiété, arrêt tabac, phobies, confiance en soi.',
  keywords: [
    'somatothérapie Joigny',
    'somatothérapeute Joigny',
    'somatothérapie Joigny',
    'arrêt tabac somatothérapie Joigny',
    'somatothérapie anxiété Joigny',
  ],
  openGraph: {
    title: 'Somatothérapie près de Joigny - Nathalie Duquenne',
    description: 'Séances de somatothérapie à 15 min de Joigny. Cabinet au Moulin d\'en Bas.',
    url: 'https://appreciezvotrevie.fr/somatotherapie-joigny',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/somatotherapie-joigny',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://appreciezvotrevie.fr/somatotherapie-joigny',
  name: 'Appréciez Votre Vie - Somatothérapie près de Joigny',
  medicalSpecialty: 'Somatotherapy',
  areaServed: { '@type': 'City', name: 'Joigny' },
  provider: { '@type': 'Person', name: 'Nathalie Duquenne' },
};

const mainContent = `
<p>Vous cherchez un <strong>somatothérapeute près de Joigny</strong> ? Le cabinet Appréciez Votre Vie vous accueille à Saint-Julien-du-Sault, à seulement <strong>15 minutes en voiture</strong>.</p>

<p>La <strong>somatothérapie</strong> est une technique thérapeutique douce et efficace, utilisée pour accompagner le changement et résoudre de nombreuses problématiques.</p>

<h3>La somatothérapie pour les Joviniens</h3>

<p>Les habitants de Joigny et des environs me consultent en somatothérapie pour :</p>
<ul>
  <li><strong>Arrêter de fumer</strong> : la somatothérapie est reconnue pour son efficacité dans le sevrage tabagique</li>
  <li><strong>Gérer l'anxiété</strong> : retrouver le calme intérieur, dépasser les angoisses</li>
  <li><strong>Vaincre les phobies</strong> : peur de conduire, phobie sociale, etc.</li>
  <li><strong>Améliorer le sommeil</strong> : retrouver un sommeil réparateur</li>
  <li><strong>Renforcer la confiance</strong> : développer l'estime de soi</li>
  <li><strong>Perdre du poids</strong> : accompagnement des problématiques alimentaires</li>
</ul>

<h3>Comment fonctionne la somatothérapie ?</h3>

<p>La somatothérapie utilise un <strong>état de détente profonde</strong> pour accéder aux ressources de l'inconscient. Cet état, comparable à celui que vous vivez quand vous êtes absorbé par un bon livre, permet :</p>
<ul>
  <li>De contourner les résistances conscientes</li>
  <li>D'activer des ressources insoupçonnées</li>
  <li>De modifier des comportements automatiques</li>
  <li>De libérer des émotions bloquées</li>
</ul>

<p>Vous restez conscient et en contrôle tout au long de la séance. La somatothérapie est une collaboration, pas une prise de pouvoir.</p>

<h3>Un cadre idéal pour la somatothérapie</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un environnement parfaitement adapté à la pratique de la somatothérapie : calme, naturel, isolé des distractions de la ville. Le cadre du Moulin d'en Bas favorise la détente et l'ouverture nécessaires au travail somatothérapeutique.</p>

<h3>Combien de séances sont nécessaires ?</h3>

<p>Le nombre de séances varie selon les problématiques :</p>
<ul>
  <li><strong>Arrêt du tabac</strong> : souvent 1 à 3 séances</li>
  <li><strong>Phobies simples</strong> : 2 à 5 séances</li>
  <li><strong>Anxiété chronique</strong> : un suivi de plusieurs séances</li>
  <li><strong>Travail en profondeur</strong> : variable selon les besoins</li>
</ul>
`;

const benefits = [
  'À 15 min de Joigny',
  'Somatothérapie certifiée',
  'Résultats souvent rapides',
  'Cadre naturel et apaisant',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Première séance découverte',
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
  distance: '12 km',
  duration: '15 min',
  directions: 'Depuis Joigny, D943 direction Sens. Le cabinet est à l\'entrée de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Somatothérapie Yonne', href: '/somatotherapie-yonne' },
  { label: 'Somatothérapie Migennes', href: '/somatotherapie-migennes' },
  { label: 'Sophrologie Joigny', href: '/sophrologie-joigny' },
];

export default function SomatotherapieJoignyPage() {
  return (
    <GeoPage
      title="Somatothérapie près de Joigny"
      subtitle="Séances de somatothérapie à 15 minutes de Joigny"
      description="Nathalie Duquenne, somatothérapeute, accompagne les Joviniens par la somatothérapie."
      service="somatotherapie"
      location={{ city: 'Joigny', department: '89' }}
      breadcrumbItems={[
        { name: 'Somatothérapie', href: '/somatotherapie' },
        { name: 'Somatothérapie Joigny', href: '/somatotherapie-joigny' },
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
