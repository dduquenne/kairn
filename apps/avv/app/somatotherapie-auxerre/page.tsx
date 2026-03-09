import type { Metadata } from 'next';

import { GeoPage } from '@/components/GeoPage';

export const metadata: Metadata = {
  title: 'Somatothérapie Auxerre | Somatothérapeute | Appréciez Votre Vie',
  description:
    'Somatothérapie pour les Auxerrois. Nathalie Duquenne, somatothérapeute à 40 min d\'Auxerre. Séances pour arrêt tabac, anxiété, phobies, sommeil.',
  keywords: [
    'somatothérapie Auxerre',
    'somatothérapeute Auxerre',
    'somatothérapie Auxerre',
    'arrêt tabac somatothérapie Auxerre',
    'somatothérapie anxiété Auxerre',
  ],
  openGraph: {
    title: 'Somatothérapie pour Auxerre - Nathalie Duquenne',
    description: 'Cabinet de somatothérapie accessible depuis Auxerre.',
    url: 'https://appreciezvotrevie.fr/somatotherapie-auxerre',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/somatotherapie-auxerre',
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  '@id': 'https://appreciezvotrevie.fr/somatotherapie-auxerre',
  name: 'Appréciez Votre Vie - Somatothérapie pour Auxerre',
  medicalSpecialty: 'Somatotherapy',
  areaServed: { '@type': 'City', name: 'Auxerre' },
  provider: { '@type': 'Person', name: 'Nathalie Duquenne' },
};

const mainContent = `
<p>Vous habitez <strong>Auxerre</strong> et souhaitez essayer la somatothérapie ? Le cabinet Appréciez Votre Vie vous accueille à Saint-Julien-du-Sault, à environ <strong>40 minutes</strong> de la préfecture de l'Yonne.</p>

<p>La <strong>somatothérapie</strong> est une approche thérapeutique reconnue, utilisée dans de nombreux domaines de la santé et du bien-être.</p>

<h3>Pourquoi consulter un somatothérapeute ?</h3>

<p>Les Auxerrois me consultent en somatothérapie pour des problématiques variées :</p>
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

<p>Pour certains Auxerrois, consulter un somatothérapeute en dehors de la ville présente des avantages :</p>
<ul>
  <li><strong>Discrétion</strong> : moins de risque de croiser des connaissances</li>
  <li><strong>Changement de cadre</strong> : le trajet favorise la transition vers un état d'esprit propice</li>
  <li><strong>Environnement naturel</strong> : le Moulin d'en Bas offre un cadre idéal pour la somatothérapie</li>
</ul>

<h3>La somatothérapie, comment ça marche ?</h3>

<p>La somatothérapie utilise des techniques de communication et de suggestion pour guider vers un état modifié de conscience. Dans cet état, vous êtes :</p>
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
  'Cadre naturel propice à la somatothérapie',
  'Somatothérapeute certifiée',
  'Visioconférence possible',
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
  distance: '35 km',
  duration: '40 min',
  directions: 'Depuis Auxerre, A6 direction Paris, sortie Joigny, puis D943 vers Sens.',
};

const relatedLinks = [
  { label: 'Somatothérapie Yonne', href: '/somatotherapie-yonne' },
  { label: 'Somatothérapie Joigny', href: '/somatotherapie-joigny' },
  { label: 'Sophrologie Auxerre', href: '/sophrologie-auxerre' },
];

export default function SomatotherapieAuxerrePage() {
  return (
    <GeoPage
      title="Somatothérapie pour Auxerre"
      subtitle="Séances de somatothérapie accessibles depuis Auxerre"
      description="Nathalie Duquenne, somatothérapeute, accompagne les Auxerrois par la somatothérapie dans un cadre naturel et apaisant."
      service="somatotherapie"
      location={{ city: 'Auxerre', department: '89' }}
      breadcrumbItems={[
        { name: 'Somatothérapie', href: '/somatotherapie' },
        { name: 'Somatothérapie Auxerre', href: '/somatotherapie-auxerre' },
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
