import type { Metadata } from 'next';
import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Hypnose Auxerre | Hypnothérapeute | Psypnos',
  description:
    'Hypnose ericksonienne pour les Auxerrois. David Duquenne, hypnothérapeute à 40 min d\'Auxerre. Séances pour arrêt tabac, anxiété, phobies, sommeil.',
  keywords: [
    'hypnose Auxerre',
    'hypnothérapeute Auxerre',
    'hypnose ericksonienne Auxerre',
    'arrêt tabac hypnose Auxerre',
    'hypnose anxiété Auxerre',
  ],
  openGraph: {
    title: 'Hypnose pour Auxerre - David Duquenne',
    description: 'Cabinet d\'hypnose ericksonienne accessible depuis Auxerre.',
    url: 'https://psypnos.fr/hypnose-auxerre',
  },
  alternates: {
    canonical: 'https://psypnos.fr/hypnose-auxerre',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://psypnos.fr/hypnose-auxerre',
  name: 'Psypnos - Hypnose pour Auxerre',
  medicalSpecialty: 'Hypnotherapy',
  areaServed: { '@type': 'City', name: 'Auxerre' },
  provider: { '@type': 'Person', name: 'David Duquenne' },
};

const mainContent = `
<p>Vous habitez <strong>Auxerre</strong> et souhaitez essayer l'hypnose ? Le cabinet Psypnos vous accueille à Saint-Julien-du-Sault, à environ <strong>40 minutes</strong> de la préfecture de l'Yonne.</p>

<p>L'<strong>hypnose ericksonienne</strong> est une approche thérapeutique reconnue, utilisée dans de nombreux domaines de la santé et du bien-être.</p>

<h3>Pourquoi consulter un hypnothérapeute ?</h3>

<p>Les Auxerrois me consultent en hypnose pour des problématiques variées :</p>
<ul>
  <li><strong>Addictions</strong> : arrêt du tabac, gestion de l'alcool, comportements compulsifs</li>
  <li><strong>Troubles anxieux</strong> : stress chronique, crises d'angoisse, anxiété généralisée</li>
  <li><strong>Phobies</strong> : peur de l'avion, claustrophobie, arachnophobie...</li>
  <li><strong>Troubles du sommeil</strong> : insomnie, cauchemars, difficultés d'endormissement</li>
  <li><strong>Gestion du poids</strong> : comportement alimentaire, relation à la nourriture</li>
  <li><strong>Douleurs chroniques</strong> : accompagnement de la douleur</li>
  <li><strong>Préparation mentale</strong> : examens, entretiens, événements importants</li>
  <li><strong>Confiance en soi</strong> : estime de soi, affirmation, prise de parole</li>
</ul>

<h3>L'avantage de consulter hors d'Auxerre</h3>

<p>Pour certains Auxerrois, consulter un hypnothérapeute en dehors de la ville présente des avantages :</p>
<ul>
  <li><strong>Discrétion</strong> : moins de risque de croiser des connaissances</li>
  <li><strong>Changement de cadre</strong> : le trajet favorise la transition vers un état d'esprit propice</li>
  <li><strong>Environnement naturel</strong> : le Moulin d'en Bas offre un cadre idéal pour l'hypnose</li>
</ul>

<h3>L'hypnose, comment ça marche ?</h3>

<p>L'hypnose ericksonienne utilise des techniques de communication et de suggestion pour guider vers un état modifié de conscience. Dans cet état, vous êtes :</p>
<ul>
  <li>Parfaitement conscient de ce qui se passe</li>
  <li>En contrôle et libre de refuser toute suggestion</li>
  <li>Dans un état de relaxation profonde</li>
  <li>Plus réceptif aux changements positifs</li>
</ul>

<p>C'est un état naturel, comparable à celui que vous vivez lors d'une rêverie ou d'une absorption dans une activité plaisante.</p>

<h3>Visioconférence possible</h3>

<p>Pour les Auxerrois qui préfèrent éviter le déplacement, certaines séances peuvent se faire en <strong>visioconférence</strong>, notamment pour le suivi après une première rencontre en présentiel.</p>
`;

const benefits = [
  'Accessible depuis Auxerre (40 min)',
  'Cadre naturel propice à l\'hypnose',
  'Hypnothérapeute certifié',
  'Visioconférence possible',
  'Parking gratuit',
  'Horaires flexibles',
  'Tarif solidaire disponible',
  'Résultats souvent rapides',
];

const testimonials = [
  {
    content: 'J\'ai arrêté de fumer après 2 séances d\'hypnose. Le trajet depuis Auxerre est devenu mon rituel de transition vers le changement.',
    author: 'Patrick L.',
    location: 'Auxerre',
  },
  {
    content: 'L\'hypnose m\'a aidée à gérer mon stress au travail. Le cadre du cabinet est vraiment apaisant, idéal pour se poser.',
    author: 'Marine D.',
    location: 'Auxerre',
  },
];

const practicalInfo = {
  distance: '35 km',
  duration: '40 min',
  directions: 'Depuis Auxerre, A6 direction Paris, sortie Joigny, puis D943 vers Sens.',
};

const relatedLinks = [
  { label: 'Hypnose Yonne', href: '/hypnose-yonne' },
  { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
  { label: 'Psychothérapeute Auxerre', href: '/psychotherapeute-auxerre' },
];

export default function HypnoseAuxerrePage() {
  return (
    <GeoPage
      title="Hypnose pour Auxerre"
      subtitle="Séances d'hypnose ericksonienne accessibles depuis Auxerre"
      description="David Duquenne, hypnothérapeute, accompagne les Auxerrois par l'hypnose dans un cadre naturel et apaisant."
      service="hypnose"
      location={{ city: 'Auxerre', department: '89' }}
      breadcrumbItems={[
        { name: 'Hypnose', href: '/hypnose' },
        { name: 'Hypnose Auxerre', href: '/hypnose-auxerre' },
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
