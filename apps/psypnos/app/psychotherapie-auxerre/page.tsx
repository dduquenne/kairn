import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Psychothérapie Auxerre | David Duquenne | Cabinet Yonne',
  description:
    'Psychothérapie accessible depuis Auxerre. David Duquenne, thérapeute certifié, vous accueille à 40 min pour anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'psychothérapie Auxerre',
    'thérapeute Auxerre',
    'thérapie Auxerre 89',
    'anxiété Auxerre',
    'burn-out Auxerre',
    'dépression Auxerre',
    'hypnose ericksonienne Auxerre',
  ],
  openGraph: {
    title: 'Psychothérapie accessible depuis Auxerre - David Duquenne',
    description: 'Cabinet de psychothérapie pour les Auxerrois. Accompagnement personnalisé pour anxiété, burn-out, deuil.',
    url: 'https://psypnos.fr/psychotherapie-auxerre',
  },
  alternates: {
    canonical: 'https://psypnos.fr/psychotherapie-auxerre',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/psychotherapie-auxerre',
  name: 'Psypnos - Psychothérapie pour Auxerre',
  description: 'Cabinet de psychothérapie accessible depuis Auxerre',
  url: 'https://psypnos.fr/psychotherapie-auxerre',
  areaServed: {
    '@type': 'City',
    name: 'Auxerre',
    sameAs: 'https://fr.wikipedia.org/wiki/Auxerre',
  },
  provider: {
    '@type': 'Person',
    name: 'David Duquenne',
    jobTitle: 'Thérapeute',
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
<p>Vous recherchez un accompagnement en <strong>psychothérapie depuis Auxerre</strong> ? David Duquenne vous accueille dans son cabinet de Saint-Julien-du-Sault, à environ <strong>40 minutes en voiture</strong> de la préfecture de l'Yonne.</p>

<p>Auxerre, capitale de l'Yonne, est une ville dynamique où le rythme de vie peut parfois être source de stress et de questionnements. Le cabinet Psypnos offre un espace de respiration, un lieu préservé pour prendre soin de soi.</p>

<h3>Un espace de thérapie hors de la ville</h3>

<p>Pour les Auxerrois, consulter un thérapeute en dehors de leur ville présente des avantages :</p>
<ul>
  <li><strong>Anonymat</strong> : moins de risque de croiser des connaissances</li>
  <li><strong>Coupure</strong> : le trajet permet une transition entre le quotidien et l'espace thérapeutique</li>
  <li><strong>Cadre ressourçant</strong> : le Moulin d'en Bas offre un environnement naturel apaisant</li>
</ul>

<p>Le trajet depuis Auxerre (environ 35 km via l'A6 puis la D943) peut devenir un temps de préparation à la séance, un moment pour soi.</p>

<h3>Mes domaines d'accompagnement</h3>

<p>Je reçois régulièrement des patients d'Auxerre pour diverses problématiques :</p>
<ul>
  <li><strong>Burn-out professionnel</strong> : de nombreux actifs auxerrois traversent des périodes d'épuisement</li>
  <li><strong>Anxiété et stress</strong> : gestion des émotions, crises d'angoisse</li>
  <li><strong>Transitions de vie</strong> : séparation, deuil, changement professionnel</li>
  <li><strong>Développement personnel</strong> : mieux se connaître, évoluer</li>
  <li><strong>Traumatismes</strong> : événements difficiles du passé</li>
</ul>

<h3>Une approche intégrative</h3>

<p>Ma pratique de la <strong>psychothérapie</strong> intègre l'<strong>hypnose ericksonienne</strong>, dans laquelle je suis certifié. Cette approche permet d'accéder aux ressources profondes et de favoriser le changement de manière douce et respectueuse.</p>

<p>Elle s'appuie sur différents outils selon les besoins : écoute active, travail sur les émotions, techniques hypnotiques, exploration des ressources intérieures...</p>

<h3>Consultations en visioconférence</h3>

<p>Pour les Auxerrois qui préfèrent éviter le déplacement ou dont l'emploi du temps ne le permet pas, je propose également des <strong>séances en visioconférence</strong>. Cette modalité est particulièrement adaptée pour un suivi régulier.</p>
`;

const benefits = [
  'Thérapeute certifié en hypnose ericksonienne',
  'Cadre naturel hors de la ville',
  'Discrétion et anonymat',
  'Parking gratuit sur place',
  'Accessible via A6',
  'Consultations visio disponibles',
  'Horaires flexibles',
  'Tarif solidaire possible',
];

const researchStats = [
  {
    stat: '75% d\'amélioration',
    description: 'des patients montrent une amélioration significative après une psychothérapie, selon les méta-analyses de référence.',
    source: 'Lambert & Ogles - Handbook of Psychotherapy',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/15796678/',
  },
  {
    stat: 'Efficacité prouvée',
    description: 'La psychothérapie est reconnue par l\'INSERM comme efficace pour la dépression, les troubles anxieux et le stress post-traumatique.',
    source: 'INSERM - Expertise collective Psychothérapie',
    sourceUrl: 'https://www.inserm.fr/expertise-collective/psychotherapie-trois-approches-evaluees/',
  },
  {
    stat: 'Effets durables',
    description: 'Les bénéfices de la psychothérapie se maintiennent dans le temps, avec moins de rechutes qu\'avec les traitements médicamenteux seuls.',
    source: 'Hollon et al. - Archives of General Psychiatry',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16061768/',
  },
];

const practicalInfo = {
  distance: '35 km',
  duration: '40 min',
  directions: 'Depuis Auxerre, prendre l\'A6 direction Paris, sortie Joigny. Puis D943 vers Sens jusqu\'à Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Psychothérapie Yonne', href: '/psychotherapie-yonne' },
  { label: 'Psychothérapie Joigny', href: '/psychotherapie-joigny' },
  { label: 'Hypnose Auxerre', href: '/hypnose-auxerre' },
];

export default function PsychotherapieAuxerrePage() {
  return (
    <GeoPage
      title="Psychothérapie pour Auxerre"
      subtitle="Un espace de thérapie ressourçant pour les Auxerrois"
      description="David Duquenne, thérapeute certifié, accompagne les habitants d'Auxerre dans un cabinet situé à 40 min, dans un cadre naturel propice au travail thérapeutique."
      service="psychotherapie"
      location={{
        city: 'Auxerre',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Psychothérapie', href: '/psychotherapie' },
        { name: 'Psychothérapie Auxerre', href: '/psychotherapie-auxerre' },
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
