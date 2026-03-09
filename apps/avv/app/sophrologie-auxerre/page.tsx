import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Sophrologie Auxerre | Nathalie Duquenne | Cabinet Yonne',
  description:
    'Sophrologie accessible depuis Auxerre. Nathalie Duquenne, sophrologue certifiée, vous accueille à 40 min pour anxiété, burn-out, deuil. Cabinet à Saint-Julien-du-Sault.',
  keywords: [
    'sophrologie Auxerre',
    'sophrologue Auxerre',
    'thérapie Auxerre 89',
    'anxiété Auxerre',
    'burn-out Auxerre',
    'dépression Auxerre',
    'sophrologie Auxerre',
  ],
  openGraph: {
    title: 'Sophrologie accessible depuis Auxerre - Nathalie Duquenne',
    description: 'Cabinet de sophrologie pour les Auxerrois. Accompagnement personnalisé pour anxiété, burn-out, deuil.',
    url: 'https://appreciezvotrevie.fr/sophrologie-auxerre',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/sophrologie-auxerre',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://appreciezvotrevie.fr/sophrologie-auxerre',
  name: 'Appréciez Votre Vie - Sophrologie pour Auxerre',
  description: 'Cabinet de sophrologie accessible depuis Auxerre',
  url: 'https://appreciezvotrevie.fr/sophrologie-auxerre',
  areaServed: {
    '@type': 'City',
    name: 'Auxerre',
    sameAs: 'https://fr.wikipedia.org/wiki/Auxerre',
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
<p>Vous recherchez un accompagnement en <strong>sophrologie depuis Auxerre</strong> ? Nathalie Duquenne vous accueille dans son cabinet de Saint-Julien-du-Sault, à environ <strong>40 minutes en voiture</strong> de la préfecture de l'Yonne.</p>

<p>Auxerre, capitale de l'Yonne, est une ville dynamique où le rythme de vie peut parfois être source de stress et de questionnements. Le cabinet Appréciez Votre Vie offre un espace de respiration, un lieu préservé pour prendre soin de soi.</p>

<h3>Un espace de thérapie hors de la ville</h3>

<p>Pour les Auxerrois, consulter un sophrologue en dehors de leur ville présente des avantages :</p>
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

<p>Ma pratique de la <strong>sophrologie</strong> permet d'accéder aux ressources profondes et de favoriser le changement de manière douce et respectueuse.</p>

<p>Elle s'appuie sur différents outils selon les besoins : écoute active, travail sur les émotions, techniques de sophrologie, exploration des ressources intérieures...</p>

<h3>Consultations en visioconférence</h3>

<p>Pour les Auxerrois qui préfèrent éviter le déplacement ou dont l'emploi du temps ne le permet pas, je propose également des <strong>séances en visioconférence</strong>. Cette modalité est particulièrement adaptée pour un suivi régulier.</p>
`;

const benefits = [
  'Sophrologue certifiée',
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
  distance: '35 km',
  duration: '40 min',
  directions: 'Depuis Auxerre, prendre l\'A6 direction Paris, sortie Joigny. Puis D943 vers Sens jusqu\'à Saint-Julien-du-Sault.',
};

const relatedLinks = [
  { label: 'Sophrologie Yonne', href: '/sophrologie-yonne' },
  { label: 'Sophrologie Joigny', href: '/sophrologie-joigny' },
  { label: 'Somatothérapie Auxerre', href: '/somatotherapie-auxerre' },
];

export default function SophrologieAuxerrePage() {
  return (
    <GeoPage
      title="Sophrologie pour Auxerre"
      subtitle="Un espace de thérapie ressourçant pour les Auxerrois"
      description="Nathalie Duquenne, sophrologue certifiée, accompagne les habitants d'Auxerre dans un cabinet situé à 40 min, dans un cadre naturel propice au travail thérapeutique."
      service="sophrologie"
      location={{
        city: 'Auxerre',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Sophrologie', href: '/sophrologie' },
        { name: 'Sophrologie Auxerre', href: '/sophrologie-auxerre' },
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
