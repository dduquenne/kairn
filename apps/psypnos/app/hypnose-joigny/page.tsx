import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnose Joigny | Hypnothérapeute à 15 min | Psypnos',
  description:
    'Hypnose ericksonienne près de Joigny. David Duquenne, hypnothérapeute à 15 min. Séances pour anxiété, arrêt tabac, phobies, confiance en soi.',
  keywords: [
    'hypnose Joigny',
    'hypnothérapeute Joigny',
    'hypnose ericksonienne Joigny',
    'arrêt tabac hypnose Joigny',
    'hypnose anxiété Joigny',
  ],
  openGraph: {
    title: 'Hypnose près de Joigny - David Duquenne',
    description: 'Séances d\'hypnose ericksonienne à 15 min de Joigny. Cabinet au Moulin d\'en Bas.',
    url: 'https://psypnos.fr/hypnose-joigny',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnose-joigny',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnose-joigny',
  name: 'Psypnos - Hypnose près de Joigny',
  medicalSpecialty: 'Hypnotherapy',
  areaServed: { '@type': 'City', name: 'Joigny' },
  provider: { '@type': 'Person', name: 'David Duquenne' },
};

const mainContent = `
<p>Vous cherchez un <strong>hypnothérapeute près de Joigny</strong> ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à seulement <strong>15 minutes en voiture</strong>.</p>

<p>L'<strong>hypnose ericksonienne</strong> est une technique thérapeutique douce et efficace, utilisée pour accompagner le changement et résoudre de nombreuses problématiques.</p>

<h3>L'hypnose pour les Joviniens</h3>

<p>Les habitants de Joigny et des environs me consultent en hypnose pour :</p>
<ul>
  <li><strong>Arrêter de fumer</strong> : l'hypnose est reconnue pour son efficacité dans le sevrage tabagique</li>
  <li><strong>Gérer l'anxiété</strong> : retrouver le calme intérieur, dépasser les angoisses</li>
  <li><strong>Vaincre les phobies</strong> : peur de conduire, phobie sociale, etc.</li>
  <li><strong>Améliorer le sommeil</strong> : retrouver un sommeil réparateur</li>
  <li><strong>Renforcer la confiance</strong> : développer l'estime de soi</li>
  <li><strong>Perdre du poids</strong> : accompagnement des problématiques alimentaires</li>
</ul>

<h3>Comment fonctionne l'hypnose ?</h3>

<p>L'hypnose ericksonienne utilise l'état naturel de <strong>transe hypnotique</strong> pour accéder aux ressources de l'inconscient. Cet état, comparable à celui que vous vivez quand vous êtes absorbé par un bon livre, permet :</p>
<ul>
  <li>De contourner les résistances conscientes</li>
  <li>D'activer des ressources insoupçonnées</li>
  <li>De modifier des comportements automatiques</li>
  <li>De libérer des émotions bloquées</li>
</ul>

<p>Vous restez conscient et en contrôle tout au long de la séance. L'hypnose est une collaboration, pas une prise de pouvoir.</p>

<h3>Un cadre idéal pour l'hypnose</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un environnement parfaitement adapté à la pratique de l'hypnose : calme, naturel, isolé des distractions de la ville. Le cadre du Moulin d'en Bas favorise la détente et l'ouverture nécessaires au travail hypnotique.</p>

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
  'Hypnose ericksonienne certifiée',
  'Résultats souvent rapides',
  'Cadre naturel et apaisant',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Première séance découverte',
];

const researchStats = [
  {
    stat: '67%',
    description: "des études scientifiques rapportent un impact positif de l'hypnose sur l'arrêt du tabac.",
    source: 'Frontiers in Psychology, 2024',
    sourceUrl: 'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1330238/full',
  },
  {
    stat: 'Effet large',
    description: "L'hypnose montre des effets moyens à larges dans la réduction de l'anxiété selon les méta-analyses.",
    source: 'PMC/NCBI, 2024',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10807512/',
  },
];

const practicalInfo = {
  distance: '12 km',
  duration: '15 min',
  directions: 'Depuis Joigny, D943 direction Sens. Le cabinet est à l\'entrée de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Hypnose Yonne', href: '/hypnose-yonne' },
  { label: 'Hypnose Migennes', href: '/hypnose-migennes' },
  { label: 'Psychothérapeute Joigny', href: '/psychotherapeute-joigny' },
];

export default function HypnoseJoignyPage() {
  return (
    <GeoPage
      title="Hypnose près de Joigny"
      subtitle="Séances d'hypnose ericksonienne à 15 minutes de Joigny"
      description="David Duquenne, hypnothérapeute, accompagne les Joviniens par l'hypnose ericksonienne."
      service="hypnose"
      location={{ city: 'Joigny', department: '89' }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnose Joigny', href: '/hypnose-joigny' },
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
