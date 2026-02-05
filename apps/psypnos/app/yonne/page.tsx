import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin, Brain, Sparkles, Wind, Building2, Car, Clock } from 'lucide-react';

import { NavigationMenu } from '@/components/NavigationMenu';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Psychothérapie & Hypnose dans l\'Yonne (89) | Toutes nos localisations',
  description:
    'Cabinet de psychothérapie, hypnose et respiration holotropique à Saint-Julien-du-Sault, au service de l\'Yonne (89). Accessible depuis Auxerre, Sens, Joigny, Migennes et toute la Bourgogne.',
  keywords: [
    'psychothérapie Yonne',
    'hypnose Yonne',
    'thérapeute 89',
    'psychologue Auxerre',
    'hypnose Sens',
    'thérapie Joigny',
    'respiration holotropique Bourgogne',
    'David Duquenne',
    'Saint-Julien-du-Sault',
    'cabinet thérapie Yonne',
  ],
  openGraph: {
    title: 'Psychothérapie & Hypnose dans l\'Yonne - Psypnos',
    description:
      'Retrouvez nos services de thérapie partout dans l\'Yonne : Auxerre, Sens, Joigny, Migennes et alentours.',
    url: 'https://psypnos.fr/yonne',
    type: 'website',
    images: [
      {
        url: 'https://psypnos.fr/images/cabinet-moulin.webp',
        width: 1200,
        height: 630,
        alt: 'Cabinet de psychothérapie - Le Moulin d\'en Bas',
      },
    ],
  },
  alternates: {
    canonical: 'https://psypnos.fr/yonne',
  },
};

const cities = [
  {
    name: 'Auxerre',
    distance: '35 km',
    duration: '35 min',
    population: '35 000 hab.',
    description: 'Préfecture de l\'Yonne, accessible par la D606 ou l\'A6',
    services: [
      { label: 'Psychothérapie Auxerre', href: '/psychotherapie-auxerre' },
      { label: 'Hypnose Auxerre', href: '/hypnose-auxerre' },
    ],
  },
  {
    name: 'Sens',
    distance: '25 km',
    duration: '25 min',
    population: '26 000 hab.',
    description: 'Sous-préfecture au nord de l\'Yonne, proche de la région parisienne',
    services: [
      { label: 'Psychothérapie Sens', href: '/psychotherapie-sens' },
      { label: 'Hypnose Sens', href: '/hypnose-sens' },
    ],
  },
  {
    name: 'Joigny',
    distance: '12 km',
    duration: '15 min',
    population: '10 000 hab.',
    description: 'Ville proche du cabinet, facilement accessible depuis l\'A6',
    services: [
      { label: 'Psychothérapie Joigny', href: '/psychotherapie-joigny' },
      { label: 'Hypnose Joigny', href: '/hypnose-joigny' },
    ],
  },
  {
    name: 'Migennes',
    distance: '20 km',
    duration: '20 min',
    population: '7 500 hab.',
    description: 'Nœud ferroviaire important, bien desservi par le train',
    services: [
      { label: 'Psychothérapie Migennes', href: '/psychotherapie-migennes' },
      { label: 'Hypnose Migennes', href: '/hypnose-migennes' },
    ],
  },
];

const departmentServices = [
  {
    service: 'Psychothérapie',
    icon: Brain,
    href: '/psychotherapie-yonne',
    description: 'Accompagnement des crises de vie, anxiété, burn-out et deuil',
  },
  {
    service: 'Hypnose',
    icon: Sparkles,
    href: '/hypnose-yonne',
    description: 'Libération des blocages, gestion du stress et des phobies',
  },
  {
    service: 'Respiration Holotropique',
    icon: Wind,
    href: '/respiration-holotropique-yonne',
    description: 'Séminaires de transformation personnelle en Bourgogne',
  },
];

function getJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://psypnos.fr/yonne#webpage',
        url: 'https://psypnos.fr/yonne',
        name: 'Psychothérapie & Hypnose dans l\'Yonne - Toutes nos localisations',
        description:
          'Cabinet de psychothérapie et hypnose au service de l\'Yonne : Auxerre, Sens, Joigny, Migennes et alentours.',
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
              name: 'Yonne',
              item: 'https://psypnos.fr/yonne',
            },
          ],
        },
      },
      {
        '@type': 'MedicalBusiness',
        '@id': 'https://psypnos.fr/yonne#business',
        name: 'Psypnos - Thérapies dans l\'Yonne',
        description:
          'Services de psychothérapie, hypnose et respiration holotropique pour les habitants de l\'Yonne',
        url: 'https://psypnos.fr/yonne',
        areaServed: [
          {
            '@type': 'AdministrativeArea',
            name: 'Yonne',
            sameAs: 'https://fr.wikipedia.org/wiki/Yonne_(d%C3%A9partement)',
          },
          ...cities.map((city) => ({
            '@type': 'City',
            name: city.name,
          })),
        ],
        provider: {
          '@type': 'Person',
          name: 'David Duquenne',
          '@id': 'https://psypnos.fr/#david-duquenne',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: "Le Moulin d'en Bas",
          addressLocality: 'Saint-Julien-du-Sault',
          postalCode: '89330',
          addressCountry: 'FR',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 48.0324,
          longitude: 3.2917,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://psypnos.fr/yonne#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Où se situe le cabinet ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Le cabinet est situé au Moulin d\'en Bas à Saint-Julien-du-Sault (89330), un lieu paisible et ressourçant. Il est accessible en 15 à 40 minutes depuis les principales villes de l\'Yonne : Joigny (15 min), Migennes (20 min), Sens (25 min), Auxerre (35 min).',
            },
          },
          {
            '@type': 'Question',
            name: 'Proposez-vous des consultations en ligne ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui, des consultations en visioconférence sont proposées pour la psychothérapie et l\'hypnose. Cette option est idéale si vous habitez loin du cabinet ou si vous avez des difficultés à vous déplacer.',
            },
          },
          {
            '@type': 'Question',
            name: 'Quels sont les tarifs ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'La séance standard est à 70€ (1h à 1h30). Un tarif solidaire de 40 à 50€ est disponible pour les étudiants, demandeurs d\'emploi et personnes en difficulté financière, sur justificatif.',
            },
          },
        ],
      },
    ],
  };
}

export default function YonnePage() {
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
                <li className="text-gold">Yonne</li>
              </ol>
            </nav>

            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-sm text-gold">
                <MapPin className="h-4 w-4" />
                <span>Département de l'Yonne (89)</span>
              </div>
              <h1 className="font-display text-4xl font-bold text-ivory sm:text-5xl lg:text-6xl">
                Thérapies dans l'Yonne
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-ivory/70 leading-relaxed">
                Cabinet de psychothérapie, hypnose et respiration holotropique à Saint-Julien-du-Sault,
                au cœur de l'Yonne. Accessible depuis Auxerre, Sens, Joigny, Migennes et toute la Bourgogne.
              </p>
            </div>
          </div>
        </section>

        {/* Services dans l'Yonne */}
        <section className="border-t border-ivory/10 px-6 py-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-ivory">
              Nos services dans l'Yonne
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {departmentServices.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.service}
                    href={item.href}
                    className="group rounded-xl border border-ivory/10 bg-night/50 p-8 transition-all hover:border-gold/30 hover:bg-night/70"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors group-hover:bg-gold/20">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-ivory transition-colors group-hover:text-gold">
                      {item.service} Yonne
                    </h3>
                    <p className="mb-4 text-sm text-ivory/60">{item.description}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gold transition-all group-hover:gap-3">
                      <span>Découvrir</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Villes */}
        <section className="px-6 py-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-4 text-center text-3xl font-bold text-ivory">
              Depuis votre ville
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-ivory/60">
              Le cabinet est idéalement situé pour les habitants de tout le département.
              Trouvez les informations pour votre ville.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {cities.map((city) => (
                <article
                  key={city.name}
                  className="rounded-xl border border-ivory/10 bg-night/50 p-6"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-ivory">{city.name}</h3>
                      <p className="text-sm text-ivory/50">{city.population}</p>
                    </div>
                    <div className="flex gap-4 text-sm text-ivory/60">
                      <span className="flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        {city.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {city.duration}
                      </span>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-ivory/60">{city.description}</p>
                  <div className="flex flex-wrap gap-3">
                    {city.services.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1.5 text-sm text-gold hover:bg-gold/20 transition-colors"
                      >
                        {service.label}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Le Cabinet */}
        <section className="border-t border-ivory/10 px-6 py-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 text-3xl font-bold text-ivory">
                  Le Moulin d'en Bas
                </h2>
                <p className="mb-6 text-ivory/70 leading-relaxed">
                  Le cabinet est installé dans un ancien moulin au cœur de la campagne bourguignonne.
                  Ce lieu paisible et ressourçant offre un cadre idéal pour un travail thérapeutique
                  en profondeur.
                </p>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center gap-3 text-ivory/70">
                    <Building2 className="h-5 w-5 text-gold" />
                    <span>Le Moulin d'en Bas, 89330 Saint-Julien-du-Sault</span>
                  </li>
                  <li className="flex items-center gap-3 text-ivory/70">
                    <Car className="h-5 w-5 text-gold" />
                    <span>Parking gratuit sur place</span>
                  </li>
                  <li className="flex items-center gap-3 text-ivory/70">
                    <MapPin className="h-5 w-5 text-gold" />
                    <span>Sortie A6 Joigny ou D606</span>
                  </li>
                </ul>
                <Link
                  href="/demande-rendez-vous"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-medium text-night transition-all hover:bg-gold/90 hover:gap-3"
                >
                  <span>Demander un rendez-vous</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="rounded-xl border border-ivory/10 bg-night/50 p-6">
                <h3 className="mb-6 text-xl font-semibold text-ivory">
                  Questions fréquentes
                </h3>
                <div className="space-y-4">
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-ivory marker:text-gold">
                      Proposez-vous des consultations en ligne ?
                    </summary>
                    <p className="mt-2 text-sm text-ivory/60">
                      Oui, des consultations en visioconférence sont proposées pour la psychothérapie
                      et l'hypnose. Cette option est idéale si vous habitez loin ou avez des
                      difficultés à vous déplacer.
                    </p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-ivory marker:text-gold">
                      Quels sont les tarifs ?
                    </summary>
                    <p className="mt-2 text-sm text-ivory/60">
                      La séance standard est à 70€ (1h à 1h30). Un tarif solidaire de 40 à 50€
                      est disponible sur justificatif.
                    </p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-ivory marker:text-gold">
                      Comment prendre rendez-vous ?
                    </summary>
                    <p className="mt-2 text-sm text-ivory/60">
                      Vous pouvez demander un rendez-vous via le formulaire en ligne ou par
                      téléphone. Je vous recontacterai rapidement pour fixer un créneau.
                    </p>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lien vers thérapies */}
        <section className="border-t border-ivory/10 px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-ivory/60">
              Découvrez en détail nos trois approches thérapeutiques
            </p>
            <Link
              href="/therapies"
              className="inline-flex items-center gap-2 text-gold hover:gap-3 transition-all"
            >
              <span>Voir toutes nos thérapies</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
