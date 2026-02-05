import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Brain, Sparkles, Wind, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

import { NavigationMenu } from '@/components/NavigationMenu';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Nos Thérapies - Psychothérapie, Hypnose & Respiration Holotropique',
  description:
    'Découvrez nos trois approches thérapeutiques complémentaires : psychothérapie transpersonnelle, hypnose ericksonienne et respiration holotropique. David Duquenne vous accompagne à Saint-Julien-du-Sault dans l\'Yonne.',
  keywords: [
    'thérapies',
    'psychothérapie',
    'hypnose ericksonienne',
    'respiration holotropique',
    'thérapie holistique',
    'accompagnement thérapeutique',
    'bien-être',
    'développement personnel',
    'David Duquenne',
    'Yonne',
    'Bourgogne',
  ],
  openGraph: {
    title: 'Nos Thérapies - Psypnos',
    description:
      'Trois approches thérapeutiques complémentaires pour votre bien-être : psychothérapie, hypnose et respiration holotropique.',
    url: 'https://psypnos.fr/therapies',
    type: 'website',
    images: [
      {
        url: 'https://psypnos.fr/images/David_Duquenne.webp',
        width: 1200,
        height: 630,
        alt: 'David Duquenne - Thérapeute',
      },
    ],
  },
  alternates: {
    canonical: 'https://psypnos.fr/therapies',
  },
};

const therapies = [
  {
    id: 'psychotherapie',
    title: 'Psychothérapie',
    subtitle: 'Un accompagnement vers la transformation intérieure',
    description:
      'La psychothérapie transpersonnelle vous accompagne dans les moments difficiles de la vie : crises existentielles, burn-out, anxiété, deuil. Elle offre un espace sécurisé pour explorer vos pensées, émotions et comportements.',
    icon: Brain,
    href: '/psychotherapie',
    benefits: [
      'Traverser les crises de vie avec soutien',
      'Comprendre et gérer l\'anxiété',
      'Retrouver du sens et de la sérénité',
      'Développer une meilleure connaissance de soi',
    ],
    indications: [
      'Anxiété et stress',
      'Dépression et burn-out',
      'Deuil et séparation',
      'Crises existentielles',
      'Traumatismes',
    ],
    format: 'Séances individuelles de 1h à 1h30',
    geoLinks: [
      { label: 'Psychothérapie Yonne', href: '/psychotherapie-yonne' },
      { label: 'Psychothérapie Auxerre', href: '/psychotherapie-auxerre' },
      { label: 'Psychothérapie Sens', href: '/psychotherapie-sens' },
      { label: 'Psychothérapie Joigny', href: '/psychotherapie-joigny' },
      { label: 'Psychothérapie Migennes', href: '/psychotherapie-migennes' },
    ],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'hypnose',
    title: 'Hypnose Ericksonienne',
    subtitle: 'Un voyage vers vos ressources internes',
    description:
      'L\'hypnose ericksonienne est une approche douce qui permet d\'accéder à vos ressources inconscientes. En état de conscience modifiée, vous pouvez libérer vos blocages et activer votre potentiel de changement.',
    icon: Sparkles,
    href: '/hypnose',
    benefits: [
      'Libérer les blocages émotionnels',
      'Activer vos ressources internes',
      'Faciliter le changement',
      'Réduire le stress et l\'anxiété',
    ],
    indications: [
      'Stress et anxiété',
      'Phobies',
      'Manque de confiance',
      'Addictions (tabac...)',
      'Troubles du sommeil',
    ],
    format: 'Séances individuelles de 1h à 1h30',
    geoLinks: [
      { label: 'Hypnose Yonne', href: '/hypnose-yonne' },
      { label: 'Hypnose Auxerre', href: '/hypnose-auxerre' },
      { label: 'Hypnose Sens', href: '/hypnose-sens' },
      { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
      { label: 'Hypnose Migennes', href: '/hypnose-migennes' },
    ],
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 'respiration',
    title: 'Respiration Holotropique',
    subtitle: 'Un voyage intérieur transformateur',
    description:
      'La respiration holotropique, développée par Stanislav Grof, utilise une respiration profonde et accélérée pour accéder à des états modifiés de conscience. Cette technique puissante favorise la guérison et la transformation personnelle.',
    icon: Wind,
    href: '/respiration-holotropique',
    benefits: [
      'Explorer votre monde intérieur',
      'Libérer les blocages profonds',
      'Accéder à des états de conscience élargie',
      'Favoriser la transformation personnelle',
    ],
    indications: [
      'Recherche de sens',
      'Transformation personnelle',
      'Libération émotionnelle',
      'Exploration spirituelle',
      'Développement personnel',
    ],
    format: 'Séminaires de week-end en groupe',
    geoLinks: [
      { label: 'Respiration Yonne', href: '/respiration-holotropique-yonne' },
      { label: 'Respiration Bourgogne', href: '/respiration-holotropique-bourgogne' },
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
        '@id': 'https://psypnos.fr/therapies#webpage',
        url: 'https://psypnos.fr/therapies',
        name: 'Nos Thérapies - Psychothérapie, Hypnose & Respiration Holotropique',
        description:
          'Découvrez nos trois approches thérapeutiques complémentaires pour votre bien-être.',
        isPartOf: {
          '@id': 'https://psypnos.fr/#website',
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Accueil',
              item: 'https://psypnos.fr',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Thérapies',
              item: 'https://psypnos.fr/therapies',
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
              url: `https://psypnos.fr${therapy.href}`,
              provider: {
                '@id': 'https://psypnos.fr/#organization',
              },
            },
          })),
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://psypnos.fr/therapies#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Quelle thérapie choisir ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Le choix dépend de vos besoins. La psychothérapie convient pour un travail en profondeur sur la durée. L\'hypnose est efficace pour des objectifs précis (phobies, stress). La respiration holotropique offre une expérience transformatrice intense. Un premier entretien permet de définir ensemble l\'approche la plus adaptée.',
            },
          },
          {
            '@type': 'Question',
            name: 'Peut-on combiner plusieurs approches ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui, les trois approches sont complémentaires. Il est fréquent de combiner psychothérapie et hypnose, ou de participer à un séminaire de respiration holotropique en complément d\'un suivi régulier.',
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
                Nos approches thérapeutiques
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-ivory/70 leading-relaxed">
                Trois voies complémentaires pour votre bien-être et votre transformation personnelle.
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
                  Quelle thérapie choisir ?
                </summary>
                <p className="mt-4 text-ivory/70 leading-relaxed">
                  Le choix dépend de vos besoins. La <strong>psychothérapie</strong> convient pour un
                  travail en profondeur sur la durée. L'<strong>hypnose</strong> est efficace pour
                  des objectifs précis (phobies, stress). La <strong>respiration holotropique</strong>
                  offre une expérience transformatrice intense. Un premier entretien permet de
                  définir ensemble l'approche la plus adaptée.
                </p>
              </details>

              <details className="group rounded-xl border border-ivory/10 bg-night/50 p-6">
                <summary className="cursor-pointer font-semibold text-ivory marker:text-gold">
                  Peut-on combiner plusieurs approches ?
                </summary>
                <p className="mt-4 text-ivory/70 leading-relaxed">
                  Oui, les trois approches sont complémentaires. Il est fréquent de combiner
                  psychothérapie et hypnose, ou de participer à un séminaire de respiration
                  holotropique en complément d'un suivi régulier.
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
