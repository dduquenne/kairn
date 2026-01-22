import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ToastProvider } from "@kairn/ui";
import "./globals.css";

// PERFORMANCE : ISR avec revalidation toutes les 24h
export const revalidate = 86400;

// Fonts configuration - identique au projet source
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

// Metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://psypnos.fr"),

  title: {
    default:
      "Psypnos - Psychothérapie, Hypnose & Respiration Holotropique | Saint-Julien-du-Sault, Yonne",
    template: "%s | Psypnos",
  },

  description:
    "David Duquenne, psychothérapeute et praticien en hypnose ericksonienne. Accompagnement des crises de vie, anxiété, deuil, burn-out. Séminaires de respiration holotropique dans l'Yonne (89).",

  keywords: [
    "psychothérapie",
    "hypnose ericksonienne",
    "respiration holotropique",
    "psychothérapeute Yonne",
    "hypnose Saint-Julien-du-Sault",
    "thérapie anxiété",
    "accompagnement burn-out",
    "gestion deuil",
    "crise de vie",
    "séminaire respiration",
    "David Duquenne",
  ],

  authors: [{ name: "David Duquenne" }],
  creator: "Psypnos",

  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://psypnos.fr",
    title: "Psypnos - Psychothérapie & Hypnose avec David Duquenne",
    description:
      "Accompagnement thérapeutique personnalisé : psychothérapie transpersonnelle, hypnose ericksonienne et respiration holotropique. Consultations à Saint-Julien-du-Sault et en visio.",
    siteName: "Psypnos",
    images: [
      {
        url: "/images/David_Duquenne.webp",
        width: 1029,
        height: 973,
        alt: "David Duquenne - Psychothérapeute et Praticien en Hypnose",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Psypnos - Psychothérapie & Hypnose",
    description:
      "Accompagnement thérapeutique avec David Duquenne : psychothérapie, hypnose et respiration holotropique dans l'Yonne.",
    images: ["/images/David_Duquenne.webp"],
  },

  alternates: {
    canonical: "https://psypnos.fr",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
      {
        url: "/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/favicon-16x16.png",
        type: "image/png",
        sizes: "16x16",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Psypnos",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0e1f2f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

// JSON-LD Structured Data
function generateStructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "LocalBusiness", "HealthAndBeautyBusiness"],
    "@id": "https://psypnos.fr/#organization",
    name: "Psypnos",
    alternateName: "Psypnos - David Duquenne Psychothérapeute",
    description:
      "Cabinet de psychothérapie transpersonnelle, hypnose ericksonienne et respiration holotropique à Saint-Julien-du-Sault dans l'Yonne (89). Accompagnement personnalisé pour anxiété, burn-out, deuil et crises de vie.",
    url: "https://psypnos.fr",
    logo: {
      "@type": "ImageObject",
      url: "https://psypnos.fr/favicon.svg",
      width: 512,
      height: 512,
    },
    image: {
      "@type": "ImageObject",
      url: "https://psypnos.fr/images/David_Duquenne.webp",
      width: 1029,
      height: 973,
      caption: "David Duquenne - Psychothérapeute et Praticien en Hypnose",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Le Moulin d'en Bas",
      addressLocality: "Saint-Julien-du-Sault",
      addressRegion: "Bourgogne-Franche-Comté",
      postalCode: "89330",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 48.0167,
      longitude: 3.2833,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@psypnos.fr",
      contactType: "customer service",
      availableLanguage: ["French"],
    },
    founder: {
      "@type": "Person",
      "@id": "https://psypnos.fr/#david-duquenne",
      name: "David Duquenne",
      jobTitle: "Psychothérapeute",
      description:
        "Praticien certifié en psychothérapie transpersonnelle et hypnose ericksonienne",
      image: "https://psypnos.fr/images/David_Duquenne.webp",
    },
    medicalSpecialty: ["Psychotherapy", "Hypnotherapy"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services thérapeutiques",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Psychothérapie transpersonnelle",
            description:
              "Accompagnement thérapeutique personnalisé pour traverser les épreuves de vie",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Hypnose ericksonienne",
            description:
              "Séances d'hypnose pour anxiété, phobies et changement comportemental",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Séminaires de respiration holotropique",
            description:
              "Ateliers collectifs de respiration holotropique pour exploration intérieure",
          },
        },
      ],
    },
    priceRange: "€€",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    paymentAccepted: ["Cash", "Check"],
    currenciesAccepted: "EUR",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://psypnos.fr/#website",
    url: "https://psypnos.fr",
    name: "Psypnos",
    description:
      "Site officiel de Psypnos - Psychothérapie, Hypnose et Respiration Holotropique",
    publisher: {
      "@id": "https://psypnos.fr/#organization",
    },
    inLanguage: "fr-FR",
  };

  return [organizationSchema, websiteSchema];
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData()),
          }}
        />
      </head>
      <body className="bg-night text-ivory antialiased">
        <ToastProvider position="top-right">{children}</ToastProvider>
      </body>
    </html>
  );
}
