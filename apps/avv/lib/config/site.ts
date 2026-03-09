/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * ============================================================================
 * CONFIGURATION CENTRALISÉE DU SITE
 * ============================================================================
 *
 * Ce fichier centralise toutes les informations du site qui sont actuellement
 * dispersées dans:
 * - app/layout.tsx (métadonnées, JSON-LD)
 * - Divers composants (URLs hardcodées, contact)
 *
 * Source unique de vérité pour:
 * - URLs du site
 * - Métadonnées (titre, description, keywords)
 * - Informations de contact
 * - Localisation et horaires
 * - Réseaux sociaux et liens externes
 *
 * Utilisation:
 * - import { SITE_CONFIG } from '@/lib/config'
 * - import { getMetadataBase, getBusinessHours } from '@/lib/config'
 *
 * @module lib/config/site
 * @version 1.0.0
 * @date 2025-12-08
 */

/**
 * CONFIGURATION GLOBALE DU SITE
 */
export const SITE_CONFIG = {
  // URLs et domaines
  siteUrl: 'https://appreciezvotrevie.fr',
  siteName: 'Appréciez Votre Vie',
  siteLanguage: 'fr',

  // Informations du propriétaire/créateur
  owner: {
    name: 'Nathalie Duquenne',
    title: 'Sophrologue, Relaxologue & Somatothérapeute',
    email: 'dduquenne@appreciezvotrevie.fr',
    image: '/images/Nathalie_Duquenne.webp',
  },

  // Description du site
  description: {
    short:
      'Nathalie Duquenne, sophrologue et somatothérapeute. Accompagnement en sophrologie, relaxation, somatothérapie, breathwork, cohérence cardiaque et reiki.',
    full: 'Accompagnement bien-être avec Nathalie Duquenne : sophrologie, relaxation, somatothérapie, breathwork et reiki dans l\'Yonne.',
    medical:
      'Cabinet de sophrologie, relaxation et somatothérapie',
  },

  // Mots-clés
  keywords: [
    'sophrologie',
    'relaxation',
    'somatothérapie',
    'breathwork',
    'cohérence cardiaque',
    'reiki',
    'sophrologue Yonne',
    'relaxation Saint-Julien-du-Sault',
    'bien-être',
    'développement personnel',
    'pratiques psycho-corporelles',
    'Nathalie Duquenne',
  ],

  // Informations de contact
  contact: {
    email: 'dduquenne@appreciezvotrevie.fr',
    phone: '06 10 09 22 49',
    website: 'https://appreciezvotrevie.fr',
  },

  // Localisation
  location: {
    streetAddress: 'Le Moulin d\'en Bas',
    city: 'Saint-Julien-du-Sault',
    region: 'Yonne',
    postalCode: '89330',
    country: 'FR',
    countryName: 'France',
    // Coordonnées GPS
    coordinates: {
      latitude: 48.0167,
      longitude: 3.2833,
    },
  },

  // Horaires d'ouverture
  businessHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '19:00',
    timezone: 'Europe/Paris',
  },

  // Images pour les partages sociaux
  images: {
    default: '/images/Nathalie_Duquenne.webp',
    dimensions: {
      width: 1029,
      height: 973,
    },
  },

  // Configuration des robots
  robots: {
    index: true,
    follow: true,
    googleBotIndex: true,
    googleBotFollow: true,
    maxVideoPreview: -1,
    maxImagePreview: 'large',
    maxSnippet: -1,
  },

  // Icônes et favicon
  favicon: {
    svg: '/favicon.svg',
    ico: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Theme et couleurs
  theme: {
    color: '#1C1526',
    colorScheme: 'dark',
  },

  // Informations commerciales
  business: {
    type: 'HealthAndBeautyBusiness',
    specialties: ['Sophrologie', 'Somatothérapie', 'Breathwork'],
    priceRange: '€€', // €, €€, €€€, €€€€
    acceptedLanguage: 'French',
  },
} as const;

/**
 * TYPE POUR LES MÉTADONNÉES TITLE
 */
export interface MetadataTitle {
  default: string;
  template: string;
}

/**
 * Génère l'objet de titre pour Next.js Metadata
 * @returns Objet title pour export const metadata
 */
export function getMetadataTitle(): MetadataTitle {
  return {
    default: `${SITE_CONFIG.siteName} - Sophrologie, Relaxation & Somatothérapie | ${SITE_CONFIG.location.city}, ${SITE_CONFIG.location.region}`,
    template: `%s | ${SITE_CONFIG.siteName}`,
  };
}

/**
 * Génère l'objet Open Graph pour Next.js Metadata
 * @returns Objet OpenGraph pour export const metadata
 */
export function getOpenGraphConfig() {
  return {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_CONFIG.siteUrl,
    title: `${SITE_CONFIG.siteName} - Sophrologie & Bien-être avec ${SITE_CONFIG.owner.name}`,
    description: SITE_CONFIG.description.full,
    siteName: SITE_CONFIG.siteName,
    images: [
      {
        url: SITE_CONFIG.images.default,
        width: SITE_CONFIG.images.dimensions.width,
        height: SITE_CONFIG.images.dimensions.height,
        alt: `${SITE_CONFIG.owner.name} - Sophrologue et Somatothérapeute`,
      },
    ],
  };
}

/**
 * Génère l'objet Twitter Card pour Next.js Metadata
 * @returns Objet Twitter pour export const metadata
 */
export function getTwitterConfig() {
  return {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.siteName} - Sophrologie & Bien-être`,
    description: SITE_CONFIG.description.full,
    images: [SITE_CONFIG.images.default],
  };
}

/**
 * Génère l'objet JSON-LD Schema pour SEO structuré
 * @returns Objet JSON-LD au format schema.org/MedicalBusiness
 */
export function getJSONLDSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': SITE_CONFIG.business.type,
    '@id': SITE_CONFIG.siteUrl,
    name: SITE_CONFIG.siteName,
    description: SITE_CONFIG.description.medical,
    url: SITE_CONFIG.siteUrl,
    logo: `${SITE_CONFIG.siteUrl}${SITE_CONFIG.favicon.svg}`,
    image: `${SITE_CONFIG.siteUrl}${SITE_CONFIG.images.default}`,

    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.location.streetAddress,
      addressLocality: SITE_CONFIG.location.city,
      addressRegion: SITE_CONFIG.location.region,
      postalCode: SITE_CONFIG.location.postalCode,
      addressCountry: SITE_CONFIG.location.country,
    },

    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.location.coordinates.latitude,
      longitude: SITE_CONFIG.location.coordinates.longitude,
    },

    contactPoint: {
      '@type': 'ContactPoint',
      email: SITE_CONFIG.contact.email,
      contactType: 'customer service',
      availableLanguage: 'French',
    },

    founder: {
      '@type': 'Person',
      name: SITE_CONFIG.owner.name,
      jobTitle: SITE_CONFIG.owner.title,
      description: `Sophrologue certifiée, somatothérapeute et praticienne en breathwork, cohérence cardiaque et reiki`,
      image: `${SITE_CONFIG.siteUrl}${SITE_CONFIG.owner.image}`,
    },

    medicalSpecialty: SITE_CONFIG.business.specialties,
    priceRange: SITE_CONFIG.business.priceRange,

    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SITE_CONFIG.businessHours.days,
      opens: SITE_CONFIG.businessHours.opens,
      closes: SITE_CONFIG.businessHours.closes,
    },
  };
}

/**
 * Obtient les horaires d'ouverture formatés pour affichage
 * @returns Objet avec jours et horaires
 */
export function getBusinessHours() {
  return {
    days: SITE_CONFIG.businessHours.days,
    opens: SITE_CONFIG.businessHours.opens,
    closes: SITE_CONFIG.businessHours.closes,
    timezone: SITE_CONFIG.businessHours.timezone,
  };
}

/**
 * Obtient l'adresse complète formatée
 * @param format - 'short' ou 'full'
 * @returns Adresse formatée en string
 */
export function getFormattedAddress(format: 'short' | 'full' = 'full'): string {
  const { streetAddress, postalCode, city, region, country } = SITE_CONFIG.location;

  if (format === 'short') {
    return `${city}, ${region}`;
  }

  return `${streetAddress}, ${postalCode} ${city}, ${region}, ${country}`;
}

/**
 * Obtient l'URL canonique complète
 * @param path - Chemin optionnel à ajouter à l'URL du site
 * @returns URL complète
 */
export function getCanonicalUrl(path?: string): string {
  const baseUrl = SITE_CONFIG.siteUrl;
  if (!path) return baseUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
