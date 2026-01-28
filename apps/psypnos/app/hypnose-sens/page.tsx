import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnose Sens | Hypnothérapeute à 25 min | Psypnos',
  description:
    'Hypnose ericksonienne près de Sens. David Duquenne, hypnothérapeute à 25 min. Séances pour arrêt tabac, anxiété, phobies, confiance en soi.',
  keywords: [
    'hypnose Sens',
    'hypnothérapeute Sens',
    'hypnose ericksonienne Sens',
    'arrêt tabac hypnose Sens',
    'hypnose anxiété Sens',
  ],
  openGraph: {
    title: 'Hypnose près de Sens - David Duquenne',
    description: 'Cabinet d\'hypnose ericksonienne à 25 min de Sens.',
    url: 'https://psypnos.fr/hypnose-sens',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnose-sens',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnose-sens',
  name: 'Psypnos - Hypnose près de Sens',
  medicalSpecialty: 'Hypnotherapy',
  areaServed: { '@type': 'City', name: 'Sens' },
  provider: { '@type': 'Person', name: 'David Duquenne' },
};

const mainContent = `
<p>Vous cherchez un <strong>hypnothérapeute près de Sens</strong> ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à seulement <strong>25 minutes</strong> de Sens via la D606.</p>

<p>L'<strong>hypnose ericksonienne</strong> est une approche thérapeutique efficace et respectueuse, adaptée à de nombreuses problématiques.</p>

<h3>L'hypnose pour les Sénonais</h3>

<p>Les habitants de Sens et de son agglomération (Paron, Saint-Clément, Maillot, Villeneuve-sur-Yonne...) me consultent en hypnose pour :</p>
<ul>
  <li><strong>Arrêter de fumer</strong> : méthode efficace et naturelle</li>
  <li><strong>Réduire l'anxiété</strong> : retrouver la sérénité au quotidien</li>
  <li><strong>Dépasser les phobies</strong> : se libérer des peurs irrationnelles</li>
  <li><strong>Améliorer le sommeil</strong> : retrouver des nuits réparatrices</li>
  <li><strong>Gérer le stress</strong> : notamment lié aux trajets domicile-travail</li>
  <li><strong>Renforcer la confiance</strong> : estime de soi, prise de parole</li>
</ul>

<h3>Une approche douce et efficace</h3>

<p>L'hypnose ericksonienne se distingue par son approche <strong>permissive et collaborative</strong>. Contrairement aux idées reçues :</p>
<ul>
  <li>Vous restez conscient tout au long de la séance</li>
  <li>Vous gardez le contrôle et pouvez interrompre à tout moment</li>
  <li>L'hypnose n'est pas du sommeil mais un état de conscience modifié</li>
  <li>Chaque séance est adaptée à votre personnalité</li>
</ul>

<h3>Le cadre idéal pour l'hypnose</h3>

<p>Le Moulin d'en Bas offre un environnement particulièrement propice à la pratique de l'hypnose :</p>
<ul>
  <li>Silence et calme de la campagne</li>
  <li>Cadre naturel apaisant</li>
  <li>Isolation du stress urbain</li>
  <li>Espace confortable et chaleureux</li>
</ul>

<p>Le court trajet depuis Sens (25 km) peut devenir un temps de préparation, une transition entre le quotidien et l'espace de transformation.</p>

<h3>Pour les navetteurs Sens-Paris</h3>

<p>Beaucoup de Sénonais font la navette vers Paris et subissent un stress important. L'hypnose peut aider à :</p>
<ul>
  <li>Gérer l'anxiété liée aux transports</li>
  <li>Améliorer la qualité du sommeil</li>
  <li>Prévenir le burn-out</li>
  <li>Retrouver un équilibre vie pro/vie perso</li>
</ul>
`;

const benefits = [
  'À 25 min de Sens',
  'Hypnose ericksonienne certifiée',
  'Cadre naturel apaisant',
  'Parking gratuit',
  'Horaires flexibles',
  'Séances en soirée',
  'Tarif solidaire disponible',
  'Résultats souvent rapides',
];

const testimonials = [
  {
    content: 'Navetteur Sens-Paris, j\'étais au bord du burn-out. L\'hypnose m\'a aidé à retrouver un équilibre et à mieux gérer le stress.',
    author: 'David M.',
    location: 'Sens',
  },
  {
    content: 'Ma phobie de l\'avion m\'empêchait de voyager. Après quelques séances d\'hypnose, j\'ai pu partir en vacances sereinement.',
    author: 'Céline T.',
    location: 'Paron',
  },
];

const practicalInfo = {
  distance: '25 km',
  duration: '25 min',
  directions: 'Depuis Sens, D606 direction Joigny. Le cabinet est dans le village de Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Hypnose Yonne', href: '/hypnose-yonne' },
  { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
  { label: 'Hypnothérapeute Sens', href: '/hypnotherapeute-sens' },
];

export default function HypnoseSensPage() {
  return (
    <GeoPage
      title="Hypnose près de Sens"
      subtitle="Séances d'hypnose ericksonienne à 25 minutes de Sens"
      description="David Duquenne, hypnothérapeute, accompagne les Sénonais par l'hypnose dans un cadre apaisant."
      service="hypnose"
      location={{ city: 'Sens', department: '89' }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnose Sens', href: '/hypnose-sens' },
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
