import type { Metadata, Viewport } from 'next';

import { Analytics, SectionTracker } from '@/components/Analytics';
import { PsypnosChatWidget } from '@/components/ChatWidgetWrapper';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { PsypnosFloatingContactButton } from '@/components/FloatingContactButtonWrapper';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';
import { CustomizationProvider } from '@/lib/customization-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/lib/toast-context';

import { MotionWrapper } from '../components/MotionWrapper';

import './globals.css';

// PERFORMANCE : ISR avec revalidation toutes les 24h
export const revalidate = 86400;

// Metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://psypnos.fr'),

  title: {
    default:
      'Psypnos - Psychothérapie, Hypnose & Respiration Holotropique | Saint-Julien-du-Sault, Yonne',
    template: '%s | Psypnos',
  },

  description:
    "David Duquenne, thérapeute certifié en hypnose ericksonienne. Accompagnement des crises de vie, anxiété, deuil, burn-out. Séminaires de respiration holotropique dans l'Yonne (89).",

  keywords: [
    'psychothérapie',
    'hypnose ericksonienne',
    'respiration holotropique',
    'psychothérapie Yonne',
    'hypnose Saint-Julien-du-Sault',
    'thérapie anxiété',
    'accompagnement burn-out',
    'gestion deuil',
    'crise de vie',
    'séminaire respiration',
    'David Duquenne',
  ],

  authors: [{ name: 'David Duquenne' }],
  creator: 'Psypnos',

  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://psypnos.fr',
    title: 'Psypnos - Psychothérapie & Hypnose avec David Duquenne',
    description:
      'Accompagnement thérapeutique personnalisé : psychothérapie transpersonnelle, hypnose ericksonienne et respiration holotropique. Consultations à Saint-Julien-du-Sault et en visio.',
    siteName: 'Psypnos',
    images: [
      {
        url: '/images/David_Duquenne.webp',
        width: 1029,
        height: 973,
        alt: 'David Duquenne - Thérapeute certifié en hypnose',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Psypnos - Psychothérapie & Hypnose',
    description:
      "Accompagnement thérapeutique avec David Duquenne : psychothérapie, hypnose et respiration holotropique dans l'Yonne.",
    images: ['/images/David_Duquenne.webp'],
  },

  alternates: {
    canonical: 'https://psypnos.fr',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        url: '/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Psypnos',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0e1f2f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
};

// JSON-LD Structured Data
function generateStructuredData() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'PsychiatricCounseling', 'LocalBusiness'],
    '@id': 'https://psypnos.fr/#organization',
    name: 'Psypnos - David Duquenne',
    alternateName: [
      'Psypnos',
      'Cabinet David Duquenne',
      'Psychothérapie Yonne',
      'Hypnose Saint-Julien-du-Sault',
    ],
    description:
      "Cabinet de psychothérapie transpersonnelle, hypnose ericksonienne et respiration holotropique à Saint-Julien-du-Sault dans l'Yonne (89). Accompagnement personnalisé pour anxiété, burn-out, deuil et crises de vie. Consultations sur rendez-vous du lundi au samedi.",
    url: 'https://psypnos.fr',
    telephone: '+33 6 XX XX XX XX',
    email: 'contact@psypnos.fr',
    logo: {
      '@type': 'ImageObject',
      url: 'https://psypnos.fr/favicon.svg',
      width: 512,
      height: 512,
    },
    image: [
      {
        '@type': 'ImageObject',
        url: 'https://psypnos.fr/images/David_Duquenne.webp',
        width: 1029,
        height: 973,
        caption: 'David Duquenne - Thérapeute certifié en hypnose',
      },
      {
        '@type': 'ImageObject',
        url: 'https://psypnos.fr/images/cabinet-moulin.webp',
        caption: "Le Moulin d'en Bas - Cabinet de psychothérapie",
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: "Le Moulin d'en Bas",
      addressLocality: 'Saint-Julien-du-Sault',
      addressRegion: 'Bourgogne-Franche-Comté',
      postalCode: '89330',
      addressCountry: 'FR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 48.0324,
      longitude: 3.2917,
    },
    hasMap: "https://maps.google.com/?q=Le+Moulin+d'en+Bas,+89330+Saint-Julien-du-Sault",
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+33 6 XX XX XX XX',
        email: 'contact@psypnos.fr',
        contactType: 'customer service',
        availableLanguage: ['French'],
        areaServed: ['FR-89', 'FR-21', 'FR-58', 'FR-71'],
      },
      {
        '@type': 'ContactPoint',
        telephone: '+33 6 XX XX XX XX',
        contactType: 'reservations',
        availableLanguage: ['French'],
      },
    ],
    founder: {
      '@type': 'Person',
      '@id': 'https://psypnos.fr/#david-duquenne',
      name: 'David Duquenne',
      jobTitle: 'Thérapeute',
      description:
        'Thérapeute certifié en hypnose ericksonienne et facilitateur de respiration holotropique',
      image: 'https://psypnos.fr/images/David_Duquenne.webp',
      sameAs: ['https://www.linkedin.com/in/david-duquenne', 'https://www.facebook.com/psypnos'],
    },
    medicalSpecialty: ['Psychotherapy', 'Hypnotherapy', 'TranspersonalPsychology'],
    // Services avec tarifs détaillés
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services thérapeutiques',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Séance de psychothérapie',
          description: 'Séance individuelle de psychothérapie transpersonnelle (1h à 1h30)',
          price: '70',
          priceCurrency: 'EUR',
          priceValidUntil: '2025-12-31',
          itemOffered: {
            '@type': 'Service',
            '@id': 'https://psypnos.fr/#psychotherapie',
            name: 'Psychothérapie transpersonnelle',
            description:
              'Accompagnement thérapeutique personnalisé pour traverser les épreuves de vie : anxiété, dépression, burn-out, deuil, trauma',
            serviceType: 'Psychothérapie',
            provider: { '@id': 'https://psypnos.fr/#organization' },
            areaServed: {
              '@type': 'GeoCircle',
              geoMidpoint: {
                '@type': 'GeoCoordinates',
                latitude: 48.0324,
                longitude: 3.2917,
              },
              geoRadius: '50000',
            },
          },
        },
        {
          '@type': 'Offer',
          name: "Séance d'hypnose ericksonienne",
          description: "Séance individuelle d'hypnose ericksonienne (1h à 1h30)",
          price: '70',
          priceCurrency: 'EUR',
          priceValidUntil: '2025-12-31',
          itemOffered: {
            '@type': 'Service',
            '@id': 'https://psypnos.fr/#hypnose',
            name: 'Hypnose ericksonienne',
            description:
              "Séances d'hypnose thérapeutique pour anxiété, phobies, addictions et changement comportemental",
            serviceType: 'Hypnothérapie',
            provider: { '@id': 'https://psypnos.fr/#organization' },
          },
        },
        {
          '@type': 'Offer',
          name: 'Tarif solidaire',
          description:
            "Tarif réduit pour étudiants, demandeurs d'emploi et personnes en difficulté financière",
          price: '40',
          priceCurrency: 'EUR',
          priceValidUntil: '2025-12-31',
          eligibleCustomerType: 'Student',
        },
        {
          '@type': 'Offer',
          name: 'Séminaire de respiration holotropique',
          description: 'Atelier collectif de respiration holotropique sur un week-end (2 jours)',
          itemOffered: {
            '@type': 'Service',
            '@id': 'https://psypnos.fr/#respiration',
            name: 'Respiration holotropique',
            description:
              'Ateliers collectifs de respiration holotropique pour exploration intérieure et développement personnel',
            serviceType: 'Développement personnel',
            provider: { '@id': 'https://psypnos.fr/#organization' },
          },
        },
      ],
    },
    priceRange: '40€ - 70€',
    // Horaires d'ouverture détaillés
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Monday',
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Tuesday',
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Wednesday',
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Thursday',
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Friday',
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '17:00',
      },
    ],
    // Zone desservie
    areaServed: [
      {
        '@type': 'City',
        name: 'Saint-Julien-du-Sault',
        sameAs: 'https://fr.wikipedia.org/wiki/Saint-Julien-du-Sault',
      },
      {
        '@type': 'City',
        name: 'Joigny',
        sameAs: 'https://fr.wikipedia.org/wiki/Joigny',
      },
      {
        '@type': 'City',
        name: 'Sens',
        sameAs: 'https://fr.wikipedia.org/wiki/Sens_(Yonne)',
      },
      {
        '@type': 'City',
        name: 'Auxerre',
        sameAs: 'https://fr.wikipedia.org/wiki/Auxerre',
      },
      {
        '@type': 'City',
        name: 'Migennes',
        sameAs: 'https://fr.wikipedia.org/wiki/Migennes',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Yonne',
        sameAs: 'https://fr.wikipedia.org/wiki/Yonne_(d%C3%A9partement)',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Bourgogne-Franche-Comté',
        sameAs: 'https://fr.wikipedia.org/wiki/Bourgogne-Franche-Comt%C3%A9',
      },
    ],
    paymentAccepted: ['Cash', 'Check', 'Bank Transfer'],
    currenciesAccepted: 'EUR',
    // Accessibilité
    publicAccess: true,
    isAccessibleForFree: false,
    smokingAllowed: false,
    // Attributs supplémentaires
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Parking',
        value: 'Parking gratuit sur place',
      },
      {
        '@type': 'PropertyValue',
        name: 'Accessibilité',
        value: 'Accessible aux personnes à mobilité réduite',
      },
      {
        '@type': 'PropertyValue',
        name: 'Consultation en ligne',
        value: 'Disponible en visioconférence',
      },
    ],
    // Langues
    availableLanguage: [
      {
        '@type': 'Language',
        name: 'French',
        alternateName: 'fr',
      },
    ],
    // Liens vers profils
    sameAs: [
      'https://www.facebook.com/psypnos',
      'https://www.instagram.com/psypnos',
      'https://www.linkedin.com/company/psypnos',
    ],
    // Mots-clés
    keywords: [
      'psychothérapie Yonne',
      'hypnose ericksonienne Sens',
      'psychothérapie Auxerre',
      'respiration holotropique Bourgogne',
      'thérapie anxiété Joigny',
      'hypnose Migennes',
      'burn-out Saint-Julien-du-Sault',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://psypnos.fr/#website',
    url: 'https://psypnos.fr',
    name: 'Psypnos',
    description:
      "Site officiel de Psypnos - Psychothérapie, Hypnose et Respiration Holotropique dans l'Yonne",
    publisher: {
      '@id': 'https://psypnos.fr/#organization',
    },
    inLanguage: 'fr-FR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://psypnos.fr/blog?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const professionalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': 'https://psypnos.fr/#professional-service',
    name: 'Psypnos - David Duquenne',
    description: 'Services de psychothérapie, hypnose ericksonienne et respiration holotropique',
    provider: { '@id': 'https://psypnos.fr/#organization' },
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 48.0324,
        longitude: 3.2917,
      },
      geoRadius: '60000',
    },
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '19:00',
    },
  };

  return [localBusinessSchema, websiteSchema, professionalServiceSchema];
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load fonts via stylesheet (more reliable than next/font during build) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://api.resend.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData()),
          }}
        />
      </head>
      <body className="bg-night text-ivory antialiased" suppressHydrationWarning>
        <CustomizationProvider>
          <ThemeProvider defaultTheme="dark">
            <ToastProvider position="top-right">
              <MotionWrapper>{children}</MotionWrapper>
              <Analytics />
              <SectionTracker />
              <CookieConsentBanner />
              <PsypnosChatWidget />
              <PsypnosFloatingContactButton />
              <WebVitalsReporter />
            </ToastProvider>
          </ThemeProvider>
        </CustomizationProvider>
      </body>
    </html>
  );
}
