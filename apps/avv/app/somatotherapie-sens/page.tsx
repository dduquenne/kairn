import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Somatothérapie Sens | Somatothérapeute à 25 min | Appréciez Votre Vie',
  description:
    'Somatothérapie près de Sens. Nathalie Duquenne, somatothérapeute à 25 min. Séances pour arrêt tabac, anxiété, phobies, confiance en soi.',
  keywords: [
    'somatothérapie Sens',
    'somatothérapeute Sens',
    'somatothérapie Sens',
    'arrêt tabac somatothérapie Sens',
    'somatothérapie anxiété Sens',
  ],
  openGraph: {
    title: 'Somatothérapie près de Sens - Nathalie Duquenne',
    description: 'Cabinet de somatothérapie à 25 min de Sens.',
    url: 'https://appreciezvotrevie.fr/somatotherapie-sens',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/somatotherapie-sens',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://appreciezvotrevie.fr/somatotherapie-sens',
  name: 'Appréciez Votre Vie - Somatothérapie près de Sens',
  medicalSpecialty: 'Somatotherapy',
  areaServed: { '@type': 'City', name: 'Sens' },
  provider: { '@type': 'Person', name: 'Nathalie Duquenne' },
};

const mainContent = `
<p>Vous cherchez un <strong>somatothérapeute près de Sens</strong> ? Le cabinet Appréciez Votre Vie vous accueille à Saint-Julien-du-Sault, à seulement <strong>25 minutes</strong> de Sens via la D606.</p>

<p>La <strong>somatothérapie</strong> est une approche thérapeutique efficace et respectueuse, adaptée à de nombreuses problématiques.</p>

<h3>La somatothérapie pour les Sénonais</h3>

<p>Les habitants de Sens et de son agglomération (Paron, Saint-Clément, Maillot, Villeneuve-sur-Yonne...) me consultent en somatothérapie pour :</p>
<ul>
  <li><strong>Arrêter de fumer</strong> : méthode efficace et naturelle</li>
  <li><strong>Réduire l'anxiété</strong> : retrouver la sérénité au quotidien</li>
  <li><strong>Dépasser les phobies</strong> : se libérer des peurs irrationnelles</li>
  <li><strong>Améliorer le sommeil</strong> : retrouver des nuits réparatrices</li>
  <li><strong>Gérer le stress</strong> : notamment lié aux trajets domicile-travail</li>
  <li><strong>Renforcer la confiance</strong> : estime de soi, prise de parole</li>
</ul>

<h3>Une approche douce et efficace</h3>

<p>La somatothérapie se distingue par son approche <strong>permissive et collaborative</strong>. Contrairement aux idées reçues :</p>
<ul>
  <li>Vous restez conscient tout au long de la séance</li>
  <li>Vous gardez le contrôle et pouvez interrompre à tout moment</li>
  <li>La somatothérapie n'est pas du sommeil mais un état de conscience modifié</li>
  <li>Chaque séance est adaptée à votre personnalité</li>
</ul>

<h3>Le cadre idéal pour la somatothérapie</h3>

<p>Le Moulin d'en Bas offre un environnement particulièrement propice à la pratique de la somatothérapie :</p>
<ul>
  <li>Silence et calme de la campagne</li>
  <li>Cadre naturel apaisant</li>
  <li>Isolation du stress urbain</li>
  <li>Espace confortable et chaleureux</li>
</ul>

<p>Le court trajet depuis Sens (25 km) peut devenir un temps de préparation, une transition entre le quotidien et l'espace de transformation.</p>

<h3>Pour les navetteurs Sens-Paris</h3>

<p>Beaucoup de Sénonais font la navette vers Paris et subissent un stress important. La somatothérapie peut aider à :</p>
<ul>
  <li>Gérer l'anxiété liée aux transports</li>
  <li>Améliorer la qualité du sommeil</li>
  <li>Prévenir le burn-out</li>
  <li>Retrouver un équilibre vie pro/vie perso</li>
</ul>
`;

const benefits = [
  'À 25 min de Sens',
  'Somatothérapie certifiée',
  'Cadre naturel apaisant',
  'Parking gratuit',
  'Horaires flexibles',
  'Séances en soirée',
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
  distance: '25 km',
  duration: '25 min',
  directions: 'Depuis Sens, D606 direction Joigny. Le cabinet est dans le village de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Somatothérapie Yonne', href: '/somatotherapie-yonne' },
  { label: 'Somatothérapie Joigny', href: '/somatotherapie-joigny' },
  { label: 'Sophrologie Sens', href: '/sophrologie-sens' },
];

export default function SomatotherapieSensPage() {
  return (
    <GeoPage
      title="Somatothérapie près de Sens"
      subtitle="Séances de somatothérapie à 25 minutes de Sens"
      description="Nathalie Duquenne, somatothérapeute, accompagne les Sénonais par la somatothérapie dans un cadre apaisant."
      service="somatotherapie"
      location={{ city: 'Sens', department: '89' }}
      breadcrumbItems={[
        { name: 'Somatothérapie', href: '/somatotherapie' },
        { name: 'Somatothérapie Sens', href: '/somatotherapie-sens' },
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
