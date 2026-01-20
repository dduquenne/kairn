/**
 * Configuration du site UNANIMA
 *
 * Ce fichier définit toutes les informations spécifiques au site UNANIMA
 * en utilisant le schéma de configuration @kairn/config.
 */

import { defineSiteConfig } from '@kairn/config';

export const siteConfig = defineSiteConfig({
  // Identité
  id: 'unanima',
  name: 'Unanima',
  domain: 'unanima.fr',
  locale: 'fr',

  // Praticien (à personnaliser)
  practitioner: {
    name: 'Votre Nom',
    title: 'Votre Titre',
    bio: `Description de votre parcours et de votre approche.
À personnaliser selon votre profil et vos spécialités.`,
    image: '/images/practitioner.webp',
    credentials: [
      {
        title: 'Certification 1',
        institution: 'Institution 1',
      },
      {
        title: 'Certification 2',
        institution: 'Institution 2',
      },
    ],
    socialLinks: {
      facebook: '',
      linkedin: '',
      instagram: '',
    },
  },

  // Contact
  contact: {
    email: 'contact@unanima.fr',
    address: {
      street: 'Adresse',
      city: 'Ville',
      postalCode: '00000',
      country: 'France',
    },
    coordinates: {
      lat: 48.8566,
      lng: 2.3522,
    },
    businessHours: {
      monday: '09:00 - 19:00',
      tuesday: '09:00 - 19:00',
      wednesday: '09:00 - 19:00',
      thursday: '09:00 - 19:00',
      friday: '09:00 - 19:00',
    },
    appointmentUrl: 'https://unanima.fr/rendez-vous',
  },

  // Services proposés (à personnaliser)
  services: [
    {
      id: 'service-1',
      name: 'Service 1',
      slug: 'service-1',
      shortDescription: 'Description du premier service proposé.',
      icon: 'Heart',
      enabled: true,
      order: 1,
    },
    {
      id: 'service-2',
      name: 'Service 2',
      slug: 'service-2',
      shortDescription: 'Description du deuxième service proposé.',
      icon: 'Sparkles',
      enabled: true,
      order: 2,
    },
    {
      id: 'service-3',
      name: 'Service 3',
      slug: 'service-3',
      shortDescription: 'Description du troisième service proposé.',
      icon: 'Leaf',
      enabled: true,
      order: 3,
    },
  ],

  // Fonctionnalités activées
  features: {
    blog: true,
    seminars: false,
    analytics: true,
    socialMedia: true,
    appointmentBooking: true,
    testimonials: true,
    newsletter: false,
    contactForm: true,
  },

  // SEO
  seo: {
    defaultTitle: 'Unanima | Votre Titre',
    titleTemplate: '%s | Unanima',
    description: 'Description SEO du site Unanima. À personnaliser selon votre activité.',
    keywords: [
      'unanima',
      'mot-clé-1',
      'mot-clé-2',
      'mot-clé-3',
    ],
    ogImage: '/images/og-image.jpg',
    locale: 'fr_FR',
  },

  // Intégrations (valeurs lues depuis les variables d'environnement)
  integrations: {
    database: {
      url: process.env.DATABASE_URL || '',
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || '',
      jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    },
    email: {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY,
      fromAddress: 'contact@unanima.fr',
      fromName: 'Unanima',
    },
    storage: {
      provider: 'supabase',
      url: process.env.SUPABASE_URL,
    },
    analytics: {
      // Google Analytics désactivé - analytics interne uniquement
    },
    ai: {
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    },
    recaptcha: {
      siteKey: process.env.RECAPTCHA_SITE_KEY || '',
      secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
    },
  },

  // Thème visuel (référence theme.config.ts pour les détails)
  theme: {
    colors: {
      primary: '#6366f1',      // Indigo
      secondary: '#1e293b',    // Slate
      accent: '#a5b4fc',       // Indigo light
      background: '#f8fafc',   // Slate light
      foreground: '#1e293b',   // Slate
      muted: '#94a3b8',
      success: '#10b981',
      warning: '#f97316',
      error: '#ef4444',
    },
    fonts: {
      display: 'Playfair Display',
      body: 'Inter',
    },
  },
});

export default siteConfig;
