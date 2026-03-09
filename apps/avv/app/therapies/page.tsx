import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Brain, Sparkles, Wind, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

import { NavigationMenu } from '@/components/NavigationMenu';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Nos Approches - Sophrologie, Somatothérapie & Breathwork',
  description:
    'Découvrez nos trois approches complémentaires : sophrologie & relaxation, somatothérapie et breathwork & rebirth. Nathalie Duquenne vous accompagne à Saint-Julien-du-Sault dans l\'Yonne.',
  keywords: [
    'thérapies',
    'sophrologie',
    'relaxation',
    'somatothérapie',
    'breathwork',
    'rebirth',
    'bien-être',
    'développement personnel',
    'Nathalie Duquenne',
    'Yonne',
    'Bourgogne',
  ],
  openGraph: {
    title: 'Nos Approches - Appréciez Votre Vie',
    description:
      'Trois approches complémentaires pour votre bien-être : sophrologie & relaxation, somatothérapie et breathwork & rebirth.',
    url: 'https://appreciezvotrevie.fr/therapies',
    type: 'website',
    images: [
      {
        url: 'https://appreciezvotrevie.fr/images/Nathalie_Duquenne.webp',
        width: 1029,
        height: 973,
        alt: 'Nathalie Duquenne - Sophrologue & Somatothérapeute',
      },
    ],
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/therapies',
  },
};

const therapies = [
  {
    id: 'sophrologie',
    title: 'Sophrologie & Relaxation',
    subtitle: 'Un chemin vers la sérénité et l\'équilibre intérieur',
    description:
      'La sophrologie et la relaxation évolutive vous accompagnent vers un mieux-être global. Par des exercices de respiration, de détente musculaire et de visualisation positive, vous apprenez à gérer le stress, retrouver le calme et développer vos ressources intérieures.',
    icon: Brain,
    href: '/sophrologie',
    benefits: [
      'Gérer le stress et l\'anxiété au quotidien',
      'Améliorer la qualité du sommeil',
      'Retrouver confiance et sérénité',
      'Développer une meilleure conscience corporelle',
    ],
    indications: [
      'Stress et anxiété',
      'Troubles du sommeil',
      'Manque de confiance',
      'Préparation mentale',
      'Gestion des émotions',
    ],
    format: 'Séances individuelles de 1h à 1h30',
    geoLinks: [
      { label: 'Sophrologie Yonne', href: '/sophrologie-yonne' },
      { label: 'Sophrologie Auxerre', href: '/sophrologie-auxerre' },
      { label: 'Sophrologie Sens', href: '/sophrologie-sens' },
      { label: 'Sophrologie Joigny', href: '/sophrologie-joigny' },
      { label: 'Sophrologie Migennes', href: '/sophrologie-migennes' },
    ],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'somatotherapie',
    title: 'Somatothérapie',
    subtitle: 'Libérer le corps pour apaiser l\'esprit',
    description:
      'La somatothérapie et les techniques psycho-corporelles permettent de libérer les tensions inscrites dans le corps. En travaillant sur le lien corps-esprit, cette approche favorise la libération des blocages émotionnels et physiques pour retrouver harmonie et vitalité.',
    icon: Sparkles,
    href: '/somatotherapie',
    benefits: [
      'Libérer les tensions corporelles profondes',
      'Apaiser les douleurs psychosomatiques',
      'Retrouver harmonie corps-esprit',
      'Favoriser la libération émotionnelle',
    ],
    indications: [
      'Tensions musculaires chroniques',
      'Douleurs psychosomatiques',
      'Stress post-traumatique',
      'Fatigue chronique',
      'Blocages émotionnels',
    ],
    format: 'Séances individuelles de 1h à 1h30',
    geoLinks: [
      { label: 'Somatothérapie Yonne', href: '/somatotherapie-yonne' },
      { label: 'Somatothérapie Auxerre', href: '/somatotherapie-auxerre' },
      { label: 'Somatothérapie Sens', href: '/somatotherapie-sens' },
      { label: 'Somatothérapie Joigny', href: '/somatotherapie-joigny' },
      { label: 'Somatothérapie Migennes', href: '/somatotherapie-migennes' },
    ],
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 'breathwork',
    title: 'Breathwork & Rebirth',
    subtitle: 'Un voyage intérieur par le souffle',
    description:
      'Le breathwork et le rebirth utilisent la puissance du souffle pour accéder à des états modifiés de conscience. Ces techniques de respiration connectée favorisent la libération des mémoires corporelles, la transformation personnelle et une profonde reconnexion à soi.',
    icon: Wind,
    href: '/breathwork',
    benefits: [
      'Explorer votre monde intérieur par le souffle',
      'Libérer les mémoires corporelles',
      'Accéder à une profonde détente',
      'Favoriser la transformation personnelle',
    ],
    indications: [
      'Recherche de sens',
      'Transformation personnelle',
      'Libération émotionnelle',
      'Reconnexion à soi',
      'Développement personnel',
    ],
    format: 'Séminaires de week-end en groupe',
    geoLinks: [
      { label: 'Breathwork Yonne', href: '/breathwork-yonne' },
      { label: 'Breathwork Bourgogne', href: '/breathwork-bourgogne' },
    ],
    color: 'from-teal-500 to-emerald-600',
  },
];

function getJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://appreciezvotrevie.fr/therapies#webpage',
        url: 'https://appreciezvotrevie.fr/therapies',
        name: 'Nos Approches - Sophrologie, Somatothérapie & Breathwork',
        description:
          'Découvrez nos trois approches complémentaires pour votre bien-être.',
        isPartOf: {
          '@id': 'https://appreciezvotrevie.fr/#website',
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Accueil',
              item: 'https://appreciezvotrevie.fr',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Thérapies',
              item: 'https://appreciezvotrevie.fr/therapies',
            },
          ],
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: therapies.map((therapy, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Service',
              name: therapy.title,
              description: therapy.description,
              url: `https://appreciezvotrevie.fr${therapy.href}`,
              provider: {
                '@id': 'https://appreciezvotrevie.fr/#organization',
              },
            },
          })),
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://appreciezvotrevie.fr/therapies#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Quelle approche choisir ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Le choix dépend de vos besoins. La sophrologie convient pour la gestion du stress et le développement de la sérénité au quotidien. La somatothérapie est adaptée pour libérer les tensions inscrites dans le corps. Le breathwork & rebirth offre une expérience transformatrice intense par le souffle. Un premier entretien permet de définir ensemble l\'approche la plus adaptée.',
            },
          },
          {
            '@type': 'Question',
            name: 'Peut-on combiner plusieurs approches ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui, les trois approches sont complémentaires. Il est fréquent de combiner sophrologie et somatothérapie, ou de participer à un séminaire de breathwork & rebirth en complément d\'un suivi régulier.',
            },
          },
          {
            '@type': 'Question',
            name: 'Comment se déroule un premier rendez-vous ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Le premier rendez-vous est un temps d\'écoute et d\'échange. Nous explorons ensemble votre situation, vos besoins et définissons les objectifs de l\'accompagnement. C\'est aussi l\'occasion de poser vos questions et de vérifier que le courant passe.',
            },
          },
        ],
      },
    ],
  };
}

export default function TherapiesPage() {
  const jsonLd = getJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NavigationMenu />
      <main className="min-h-screen bg-night">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <nav aria-label="Fil d'Ariane" className="mb-8">
              <ol className="flex items-center gap-2 text-sm text-ivory/60">
                <li>
                  <Link href="/" className="hover:text-gold transition-colors">
                    Accueil
                  </Link>
                </li>
                <li>/</li>
                <li className="text-gold">Thérapies</li>
              </ol>
            </nav>

            <div className="text-center">
              <h1 className="font-display text-4xl font-bold text-ivory sm:text-5xl lg:text-6xl">
                Nos approches
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-ivory/70 leading-relaxed">
                Trois voies complémentaires pour votre bien-être et votre reconnexion à soi.
                Chaque approche répond à des besoins spécifiques, et elles peuvent se combiner
                pour un accompagnement sur mesure.
              </p>
            </div>
          </div>
        </section>

        {/* Therapies Grid */}
        <section className="px-6 pb-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl space-y-16">
            {therapies.map((therapy, index) => {
              const Icon = therapy.icon;
              const isReversed = index % 2 === 1;

              return (
                <article
                  key={therapy.id}
                  id={therapy.id}
                  className={`flex flex-col gap-8 lg:flex-row lg:gap-16 ${
                    isReversed ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${therapy.color} text-white`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-ivory">{therapy.title}</h2>
                        <p className="text-gold">{therapy.subtitle}</p>
                      </div>
                    </div>

                    <p className="text-ivory/70 leading-relaxed">{therapy.description}</p>

                    {/* Benefits */}
                    <div>
                      <h3 className="mb-3 font-semibold text-ivory">Bénéfices</h3>
                      <ul className="space-y-2">
                        {therapy.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-3 text-ivory/70">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Format */}
                    <div className="flex items-center gap-2 text-ivory/60">
                      <Calendar className="h-5 w-5" />
                      <span>{therapy.format}</span>
                    </div>

                    {/* CTA */}
                    <Link
                      href={therapy.href}
                      className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-medium text-night transition-all hover:bg-gold/90 hover:gap-3"
                    >
                      <span>En savoir plus</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>

                  {/* Sidebar */}
                  <aside className="lg:w-80">
                    {/* Indications */}
                    <div className="mb-6 rounded-xl border border-ivory/10 bg-night/50 p-6">
                      <h3 className="mb-4 font-semibold text-ivory">Indications</h3>
                      <ul className="space-y-2">
                        {therapy.indications.map((indication) => (
                          <li
                            key={indication}
                            className="rounded-full bg-ivory/5 px-3 py-1.5 text-sm text-ivory/70"
                          >
                            {indication}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Geo Links */}
                    <div className="rounded-xl border border-ivory/10 bg-night/50 p-6">
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-ivory">
                        <MapPin className="h-5 w-5 text-gold" />
                        <span>Proche de chez vous</span>
                      </h3>
                      <ul className="space-y-2">
                        {therapy.geoLinks.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              className="flex items-center gap-2 text-sm text-ivory/60 hover:text-gold transition-colors"
                            >
                              <ArrowRight className="h-4 w-4" />
                              <span>{link.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>
                </article>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-ivory/10 px-6 py-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-ivory">
              Questions fréquentes
            </h2>
            <div className="space-y-6">
              <details className="group rounded-xl border border-ivory/10 bg-night/50 p-6">
                <summary className="cursor-pointer font-semibold text-ivory marker:text-gold">
                  Quelle approche choisir ?
                </summary>
                <p className="mt-4 text-ivory/70 leading-relaxed">
                  Le choix dépend de vos besoins. La <strong>sophrologie</strong> convient pour la
                  gestion du stress et le développement de la sérénité au quotidien. La{' '}
                  <strong>somatothérapie</strong> est adaptée pour libérer les tensions inscrites dans
                  le corps. Le <strong>breathwork & rebirth</strong> offre une expérience
                  transformatrice intense par le souffle. Un premier entretien permet de définir
                  ensemble l'approche la plus adaptée.
                </p>
              </details>

              <details className="group rounded-xl border border-ivory/10 bg-night/50 p-6">
                <summary className="cursor-pointer font-semibold text-ivory marker:text-gold">
                  Peut-on combiner plusieurs approches ?
                </summary>
                <p className="mt-4 text-ivory/70 leading-relaxed">
                  Oui, les trois approches sont complémentaires. Il est fréquent de combiner
                  sophrologie et somatothérapie, ou de participer à un séminaire de breathwork
                  & rebirth en complément d'un suivi régulier.
                </p>
              </details>

              <details className="group rounded-xl border border-ivory/10 bg-night/50 p-6">
                <summary className="cursor-pointer font-semibold text-ivory marker:text-gold">
                  Comment se déroule un premier rendez-vous ?
                </summary>
                <p className="mt-4 text-ivory/70 leading-relaxed">
                  Le premier rendez-vous est un temps d'écoute et d'échange. Nous explorons ensemble
                  votre situation, vos besoins et définissons les objectifs de l'accompagnement.
                  C'est aussi l'occasion de poser vos questions et de vérifier que le courant passe.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-ivory/10 px-6 py-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-ivory">
              Prêt à commencer votre parcours ?
            </h2>
            <p className="mb-8 text-ivory/70">
              Prenez rendez-vous pour un premier entretien et découvrez l'approche
              qui vous correspond.
            </p>
            <Link
              href="/demande-rendez-vous"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-8 py-4 text-lg font-medium text-night transition-all hover:bg-gold/90 hover:gap-3"
            >
              <span>Demander un rendez-vous</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
