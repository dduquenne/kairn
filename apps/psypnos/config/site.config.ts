/**
 * Configuration du site PSYPNOS
 *
 * Ce fichier définit toutes les informations spécifiques au site PSYPNOS
 * en utilisant le schéma de configuration @kairn/config.
 */

import { defineSiteConfig } from '@kairn/config';

export const siteConfig = defineSiteConfig({
  // Identité
  id: 'psypnos',
  name: 'Psypnos',
  domain: 'psypnos.fr',
  locale: 'fr',

  // Praticien
  practitioner: {
    name: 'David Duquenne',
    title: 'Psychopraticien',
    bio: `David Duquenne est thérapeute et praticien en psychothérapie transpersonnelle et en hypnose ericksonienne,
spécialisé dans l'accompagnement des crises de vie, de l'anxiété, du deuil et du burn-out.
Installé à Saint-Julien-du-Sault dans l'Yonne, il propose également des séminaires
de respiration holotropique pour une approche thérapeutique globale et profonde.

Formé aux approches transpersonnelles et à l'hypnose ericksonienne, David accompagne
ses patients avec bienveillance et professionnalisme dans leur cheminement personnel.`,
    image: '/images/David_Duquenne.webp',
    credentials: [
      {
        title: 'Psychothérapeute certifié',
        institution: 'Institut de Formation en Psychothérapie Transpersonnelle',
      },
      {
        title: 'Praticien en Hypnose Ericksonienne',
        institution: 'IFHE',
      },
      {
        title: 'Facilitateur en Respiration Holotropique',
        institution: 'Grof Transpersonal Training',
      },
    ],
    socialLinks: {
      facebook: 'https://www.facebook.com/profile.php?id=61565498498498',
      linkedin: 'https://www.linkedin.com/in/david-duquenne-psypnos/',
      instagram: 'https://www.instagram.com/psypnos/',
    },
  },

  // Contact
  contact: {
    email: 'contact@psypnos.fr',
    address: {
      street: "Le Moulin d'en Bas",
      city: 'Saint-Julien-du-Sault',
      postalCode: '89330',
      country: 'France',
    },
    coordinates: {
      lat: 48.0167,
      lng: 3.2833,
    },
    businessHours: {
      monday: '09:00 - 19:00',
      tuesday: '09:00 - 19:00',
      wednesday: '09:00 - 19:00',
      thursday: '09:00 - 19:00',
      friday: '09:00 - 19:00',
    },
    appointmentUrl: 'https://psypnos.fr/demande-rendez-vous',
  },

  // Services proposés
  services: [
    {
      id: 'psychotherapie',
      name: 'Psychothérapie',
      slug: 'psychotherapie',
      shortDescription:
        "Accompagnement thérapeutique pour traverser les crises de vie, l'anxiété, le deuil et le burn-out.",
      icon: 'Brain',
      enabled: true,
      order: 1,
    },
    {
      id: 'hypnose',
      name: 'Hypnose Ericksonienne',
      slug: 'hypnose',
      shortDescription:
        "Technique thérapeutique douce pour accéder aux ressources de l'inconscient.",
      icon: 'Sparkles',
      enabled: true,
      order: 2,
    },
    {
      id: 'respiration-holotropique',
      name: 'Respiration Holotropique',
      slug: 'respiration-holotropique',
      shortDescription:
        'Séminaires de respiration pour un travail thérapeutique profond en groupe.',
      icon: 'Wind',
      enabled: true,
      order: 3,
    },
  ],

  // Fonctionnalités activées
  features: {
    blog: true,
    seminars: true,
    analytics: true,
    socialMedia: true,
    appointmentBooking: true,
    testimonials: true,
    newsletter: false,
    contactForm: true,
  },

  // SEO
  seo: {
    defaultTitle:
      'Psypnos - Psychothérapie, Hypnose & Respiration Holotropique | Saint-Julien-du-Sault, Yonne',
    titleTemplate: '%s | Psypnos',
    description:
      'David Duquenne, psychothérapeute à Saint-Julien-du-Sault (89). Psychothérapie transpersonnelle, hypnose ericksonienne et respiration holotropique.',
    keywords: [
      'psychothérapie',
      'hypnose ericksonienne',
      'respiration holotropique',
      'psychothérapeute Yonne',
      'hypnose Saint-Julien-du-Sault',
      'thérapie anxiété',
      'accompagnement burn-out',
      'gestion deuil',
      'crise de vie',
      'séminaire respiration',
      'David Duquenne',
    ],
    ogImage: '/images/David_Duquenne.webp',
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
      fromAddress: 'contact@psypnos.fr',
      fromName: 'Psypnos',
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
  },

  // Thème visuel (référence theme.config.ts pour les détails)
  theme: {
    colors: {
      primary: '#c7a962', // Gold
      secondary: '#0e1f2f', // Night
      accent: '#f0d9a3', // Gold light
      background: '#0e1f2f', // Night
      foreground: '#f5f1e6', // Ivory
      muted: '#b0b0b0',
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
