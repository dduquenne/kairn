import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Psychothérapie Sens | David Duquenne | Cabinet à 25 min',
  description:
    'Psychothérapie près de Sens (89). David Duquenne, thérapeute certifié, vous accueille à 25 min pour anxiété, burn-out, deuil. Cabinet au Moulin d\'en Bas.',
  keywords: [
    'psychothérapie Sens',
    'thérapeute Sens',
    'thérapie Sens 89',
    'anxiété Sens',
    'burn-out Sens',
    'hypnose ericksonienne Sens',
  ],
  openGraph: {
    title: 'Psychothérapie près de Sens - David Duquenne',
    description: 'Cabinet de psychothérapie à 25 min de Sens. Accompagnement pour anxiété, burn-out, transitions de vie.',
    url: 'https://psypnos.fr/psychotherapie-sens',
  },
  alternates: {
    canonical: 'https://psypnos.fr/psychotherapie-sens',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/psychotherapie-sens',
  name: 'Psypnos - Psychothérapie près de Sens',
  description: 'Cabinet de psychothérapie accessible depuis Sens',
  url: 'https://psypnos.fr/psychotherapie-sens',
  areaServed: {
    '@type': 'City',
    name: 'Sens',
    sameAs: 'https://fr.wikipedia.org/wiki/Sens_(Yonne)',
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
<p>Vous cherchez un accompagnement en <strong>psychothérapie près de Sens</strong> ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à seulement <strong>25 minutes en voiture</strong> de Sens via la D606.</p>

<p>Sens, ville historique aux portes de la Bourgogne, est la sous-préfecture la plus proche de Paris. Ses habitants vivent souvent au rythme effréné des allers-retours vers la capitale. Un accompagnement thérapeutique peut aider à retrouver l'équilibre.</p>

<h3>Psychothérapie pour les Sénonais</h3>

<p>En tant que thérapeute, j'accompagne de nombreux habitants de Sens et de son agglomération : Paron, Saint-Clément, Maillot, Gron, Villeneuve-sur-Yonne...</p>

<p>Les Sénonais me consultent souvent pour :</p>
<ul>
  <li><strong>L'épuisement lié aux trajets</strong> : les navettes quotidiennes vers Paris génèrent stress et fatigue</li>
  <li><strong>Les transitions professionnelles</strong> : reconversion, perte d'emploi, retraite</li>
  <li><strong>Les difficultés relationnelles</strong> : couple, famille, travail</li>
  <li><strong>L'anxiété et le stress</strong> : crises d'angoisse, ruminations</li>
  <li><strong>Le deuil et la séparation</strong> : accompagnement dans les moments difficiles</li>
</ul>

<h3>Un cadre propice au travail sur soi</h3>

<p>Le cabinet de Saint-Julien-du-Sault offre un cadre très différent de l'environnement urbain de Sens. Situé dans un ancien moulin rénové, au bord de l'eau, il invite au calme et à l'introspection.</p>

<p>Ce changement de décor, même pour un court trajet, peut faciliter la transition vers un espace mental différent, propice au travail thérapeutique.</p>

<h3>Ma pratique thérapeutique</h3>

<p>Je pratique la <strong>psychothérapie</strong> en intégrant l'<strong>hypnose ericksonienne</strong>, une approche qui permet :</p>
<ul>
  <li>L'écoute active et la parole</li>
  <li>Le travail sur les émotions et le corps</li>
  <li>L'accès aux ressources profondes</li>
  <li>Le changement en profondeur</li>
</ul>

<h3>Flexibilité pour les Sénonais</h3>

<p>Je comprends les contraintes des habitants de Sens, notamment ceux qui travaillent à Paris. Je propose donc des <strong>horaires adaptés</strong> (fin de journée, samedi) et des <strong>consultations en visioconférence</strong> pour ceux qui ne peuvent pas se déplacer.</p>
`;

const benefits = [
  'Thérapeute certifié',
  'À 25 min de Sens',
  'Horaires adaptés aux navetteurs',
  'Consultations en soirée',
  'Séances le samedi',
  'Visioconférence possible',
  'Parking gratuit',
  'Cadre naturel apaisant',
  'Tarif solidaire disponible',
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
  distance: '25 km',
  duration: '25 min',
  directions: 'Depuis Sens, prendre la D606 direction Joigny. À Saint-Julien-du-Sault, suivre les panneaux "Le Moulin".',
};

const relatedLinks = [
  { label: 'Psychothérapie Yonne', href: '/psychotherapie-yonne' },
  { label: 'Psychothérapie Joigny', href: '/psychotherapie-joigny' },
  { label: 'Hypnose Sens', href: '/hypnose-sens' },
];

export default function PsychotherapieSensPage() {
  return (
    <GeoPage
      title="Psychothérapie près de Sens"
      subtitle="Cabinet de psychothérapie à 25 minutes de Sens"
      description="David Duquenne, thérapeute certifié, accompagne les Sénonais dans un cabinet accessible, avec des horaires adaptés aux contraintes de chacun."
      service="psychotherapie"
      location={{
        city: 'Sens',
        department: '89',
      }}
      breadcrumbItems={[
        { name: 'Psychothérapie', href: '/psychotherapie' },
        { name: 'Psychothérapie Sens', href: '/psychotherapie-sens' },
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
