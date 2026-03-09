import type { Metadata, Viewport } from 'next';

import { Analytics, SectionTracker } from '@/components/Analytics';
import { AvvChatWidget } from '@/components/ChatWidgetWrapper';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { AvvFloatingContactButton } from '@/components/FloatingContactButtonWrapper';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';
import { CustomizationProvider } from '@/lib/customization-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/lib/toast-context';

import './globals.css';

// PERFORMANCE : ISR avec revalidation toutes les 24h
export const revalidate = 86400;

// Metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://appreciezvotrevie.fr'),

  title: {
    default:
      'Appréciez Votre Vie - Sophrologie, Relaxation & Somatothérapie | Saint-Julien-du-Sault, Yonne',
    template: '%s | Appréciez Votre Vie',
  },

  description:
    "Nathalie Duquenne, sophrologue et somatothérapeute à Saint-Julien-du-Sault (89). Sophrologie, relaxation, somatothérapie, breathwork, cohérence cardiaque et reiki dans l'Yonne.",

  keywords: [
    'sophrologie',
    'relaxation',
    'somatothérapie',
    'breathwork',
    'rebirth',
    'cohérence cardiaque',
    'reiki',
    'sophrologue Yonne',
    'relaxation Saint-Julien-du-Sault',
    'somatothérapeute Yonne',
    'bien-être',
    'développement personnel',
    'Nathalie Duquenne',
  ],

  authors: [{ name: 'Nathalie Duquenne' }],
  creator: 'Appréciez Votre Vie',

  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://appreciezvotrevie.fr',
    title: 'Appréciez Votre Vie - Sophrologie & Bien-être avec Nathalie Duquenne',
    description:
      'Accompagnement en sophrologie, relaxation, somatothérapie, breathwork, cohérence cardiaque et reiki. Consultations à Saint-Julien-du-Sault et en visio.',
    siteName: 'Appréciez Votre Vie',
    images: [
      {
        url: '/images/Nathalie_Duquenne.webp',
        width: 1029,
        height: 973,
        alt: 'Nathalie Duquenne - Sophrologue et Somatothérapeute',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Appréciez Votre Vie - Sophrologie & Bien-être',
    description:
      "Accompagnement en sophrologie, relaxation et somatothérapie avec Nathalie Duquenne dans l'Yonne.",
    images: ['/images/Nathalie_Duquenne.webp'],
  },

  alternates: {
    canonical: 'https://appreciezvotrevie.fr',
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
    title: 'Appréciez Votre Vie',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#1C1526',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
};

// JSON-LD Structured Data
function generateStructuredData() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': ['HealthAndBeautyBusiness', 'LocalBusiness'],
    '@id': 'https://appreciezvotrevie.fr/#organization',
    name: 'Appréciez Votre Vie - Nathalie Duquenne',
    alternateName: [
      'Appréciez Votre Vie',
      'Cabinet Nathalie Duquenne',
      'Sophrologie Yonne',
      'Relaxation Saint-Julien-du-Sault',
    ],
    description:
      "Cabinet de sophrologie, relaxation, somatothérapie, breathwork, cohérence cardiaque et reiki à Saint-Julien-du-Sault dans l'Yonne (89). Accompagnement personnalisé pour le bien-être, la gestion du stress et le développement personnel. Consultations sur rendez-vous du lundi au samedi.",
    url: 'https://appreciezvotrevie.fr',
    telephone: '+33 6 10 09 22 49',
    email: 'dduquenne@appreciezvotrevie.fr',
    logo: {
      '@type': 'ImageObject',
      url: 'https://appreciezvotrevie.fr/favicon.svg',
      width: 512,
      height: 512,
    },
    image: [
      {
        '@type': 'ImageObject',
        url: 'https://appreciezvotrevie.fr/images/Nathalie_Duquenne.webp',
        width: 1029,
        height: 973,
        caption: 'Nathalie Duquenne - Sophrologue et Somatothérapeute',
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
        telephone: '+33 6 10 09 22 49',
        email: 'dduquenne@appreciezvotrevie.fr',
        contactType: 'customer service',
        availableLanguage: ['French'],
        areaServed: ['FR-89', 'FR-21', 'FR-58', 'FR-71'],
      },
      {
        '@type': 'ContactPoint',
        telephone: '+33 6 10 09 22 49',
        contactType: 'reservations',
        availableLanguage: ['French'],
      },
    ],
    founder: {
      '@type': 'Person',
      '@id': 'https://appreciezvotrevie.fr/#nathalie-duquenne',
      name: 'Nathalie Duquenne',
      jobTitle: 'Sophrologue, Relaxologue & Somatothérapeute',
      description:
        'Sophrologue certifiée, somatothérapeute et praticienne en breathwork, cohérence cardiaque et reiki',
      image: 'https://appreciezvotrevie.fr/images/Nathalie_Duquenne.webp',
    },
    // Services avec tarifs détaillés
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services bien-être',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Séance de sophrologie / relaxation',
          description: 'Séance individuelle de sophrologie ou relaxation (1h à 1h30)',
          price: '70',
          priceCurrency: 'EUR',
          priceValidUntil: '2027-12-31',
          itemOffered: {
            '@type': 'Service',
            '@id': 'https://appreciezvotrevie.fr/#sophrologie',
            name: 'Sophrologie & Relaxation',
            description:
              'Techniques de relaxation et de sophrologie pour retrouver calme intérieur et sérénité',
            serviceType: 'Sophrologie',
            provider: { '@id': 'https://appreciezvotrevie.fr/#organization' },
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
          name: 'Séance de somatothérapie',
          description: 'Séance individuelle de somatothérapie (1h à 1h30)',
          price: '70',
          priceCurrency: 'EUR',
          priceValidUntil: '2027-12-31',
          itemOffered: {
            '@type': 'Service',
            '@id': 'https://appreciezvotrevie.fr/#somatotherapie',
            name: 'Somatothérapie',
            description:
              'Approche psycho-corporelle pour libérer les tensions du corps et retrouver son équilibre',
            serviceType: 'Somatothérapie',
            provider: { '@id': 'https://appreciezvotrevie.fr/#organization' },
          },
        },
        {
          '@type': 'Offer',
          name: 'Tarif solidaire',
          description:
            "Tarif réduit pour étudiants, demandeurs d'emploi et personnes en difficulté financière",
          price: '40',
          priceCurrency: 'EUR',
          priceValidUntil: '2027-12-31',
          eligibleCustomerType: 'Student',
        },
        {
          '@type': 'Offer',
          name: 'Séminaire Breathwork & Rebirth',
          description: 'Atelier collectif de breathwork et rebirth sur un week-end (2 jours)',
          itemOffered: {
            '@type': 'Service',
            '@id': 'https://appreciezvotrevie.fr/#breathwork',
            name: 'Breathwork & Rebirth',
            description:
              'Ateliers collectifs de breathwork pour un voyage intérieur profond et libérateur',
            serviceType: 'Développement personnel',
            provider: { '@id': 'https://appreciezvotrevie.fr/#organization' },
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
    // Mots-clés
    keywords: [
      'sophrologie Yonne',
      'relaxation Sens',
      'somatothérapie Auxerre',
      'breathwork Bourgogne',
      'cohérence cardiaque Joigny',
      'reiki Migennes',
      'bien-être Saint-Julien-du-Sault',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://appreciezvotrevie.fr/#website',
    url: 'https://appreciezvotrevie.fr',
    name: 'Appréciez Votre Vie',
    description:
      "Site officiel d'Appréciez Votre Vie - Sophrologie, Relaxation et Somatothérapie dans l'Yonne",
    publisher: {
      '@id': 'https://appreciezvotrevie.fr/#organization',
    },
    inLanguage: 'fr-FR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://appreciezvotrevie.fr/blog?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const professionalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': 'https://appreciezvotrevie.fr/#professional-service',
    name: 'Appréciez Votre Vie - Nathalie Duquenne',
    description:
      'Services de sophrologie, relaxation, somatothérapie, breathwork, cohérence cardiaque et reiki',
    provider: { '@id': 'https://appreciezvotrevie.fr/#organization' },
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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
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
              {children}
              <Analytics />
              <SectionTracker />
              <CookieConsentBanner />
              <AvvChatWidget />
              <AvvFloatingContactButton />
              <WebVitalsReporter />
            </ToastProvider>
          </ThemeProvider>
        </CustomizationProvider>
      </body>
    </html>
  );
}
