/**
 * Configuration du site Appréciez Votre Vie (AVV)
 *
 * Ce fichier définit toutes les informations spécifiques au site AVV
 * en utilisant le schéma de configuration @kairn/config.
 */

import { defineSiteConfig } from '@kairn/config';

export const siteConfig = defineSiteConfig({
  // Identité
  id: 'avv',
  name: 'Appréciez Votre Vie',
  domain: 'appreciezvotrevie.fr',
  locale: 'fr',

  // Praticien
  practitioner: {
    name: 'Nathalie Duquenne',
    title: 'Sophrologue, Relaxologue & Somatothérapeute',
    bio: `Ma passion est d'accompagner les adolescents et les adultes dans leur développement personnel
à travers ce lien essentiel qui existe entre le corps et l'esprit.

Depuis plus de 20 ans, je suis en rapport quotidien avec des adolescents et c'est la partie de ma
profession qui me plaît le plus. Animée par l'envie de partager mon expérience, je me suis alors
naturellement tournée vers des pratiques psycho-corporelles, à commencer par les techniques de
dynamisation et de relaxation du corps.

Après les avoir proposées à mes élèves et à d'autres adolescents en difficulté,
j'accompagne désormais les adultes dans une démarche de ré-enchantement de leur vie.`,
    image: '/images/Nathalie_Duquenne.webp',
    credentials: [
      {
        title: 'Formation Breathwork & Rebirth',
        institution: 'Isthme (Isabelle et Jean-Marie Jobelin)',
      },
      {
        title: 'Certification en sophrologie',
        institution: 'Isthme (Isabelle et Jean-Marie Jobelin)',
      },
      {
        title: 'Certification en somatothérapie et techniques psycho-corporelles',
        institution: 'Isthme (Isabelle et Jean-Marie Jobelin)',
      },
      {
        title: 'Certification Pratique de relaxation évolutive – Sophrologie pratique',
        institution: 'Isthme (Isabelle et Jean-Marie Jobelin)',
      },
      {
        title: 'Formation La Méthode Silva',
        institution: 'Silva International Inc. (Lee Pascoe)',
      },
      {
        title: 'Coach en Cohérence Cardiaque',
        institution: 'Cohérence Cardiaque France (Guy Lacroix)',
      },
      {
        title: 'Praticienne Reiki (niveaux 1, 2 et 3)',
        institution: 'Laurent Vitureau',
      },
    ],
    socialLinks: {},
  },

  // Contact
  contact: {
    email: 'dduquenne@appreciezvotrevie.fr',
    phone: '06 10 09 22 49',
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
    appointmentUrl: 'https://appreciezvotrevie.fr/demande-rendez-vous',
  },

  // Services proposés
  services: [
    {
      id: 'sophrologie',
      name: 'Sophrologie & Relaxation',
      slug: 'sophrologie',
      shortDescription:
        'Techniques de relaxation et de sophrologie pour retrouver calme intérieur et sérénité.',
      icon: 'Flower2',
      enabled: true,
      order: 1,
    },
    {
      id: 'somatotherapie',
      name: 'Somatothérapie',
      slug: 'somatotherapie',
      shortDescription:
        'Approche psycho-corporelle pour libérer les tensions du corps et retrouver son équilibre.',
      icon: 'Hand',
      enabled: true,
      order: 2,
    },
    {
      id: 'breathwork',
      name: 'Breathwork & Rebirth',
      slug: 'breathwork',
      shortDescription:
        'Techniques de respiration pour un voyage intérieur profond et libérateur.',
      icon: 'Wind',
      enabled: true,
      order: 3,
    },
    {
      id: 'coherence-cardiaque',
      name: 'Cohérence Cardiaque',
      slug: 'coherence-cardiaque',
      shortDescription:
        'Exercices de respiration rythmée pour réguler le stress et harmoniser le corps et l\'esprit.',
      icon: 'HeartPulse',
      enabled: true,
      order: 4,
    },
    {
      id: 'reiki',
      name: 'Reiki',
      slug: 'reiki',
      shortDescription:
        'Soin énergétique par imposition des mains pour rééquilibrer les énergies du corps.',
      icon: 'Sparkles',
      enabled: true,
      order: 5,
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
      'Appréciez Votre Vie - Sophrologie, Relaxation & Somatothérapie | Saint-Julien-du-Sault, Yonne',
    titleTemplate: '%s | Appréciez Votre Vie',
    description:
      'Nathalie Duquenne, sophrologue et somatothérapeute à Saint-Julien-du-Sault (89). Sophrologie, relaxation, somatothérapie, breathwork, cohérence cardiaque et reiki.',
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
      'bien-être Yonne',
      'développement personnel',
      'pratiques psycho-corporelles',
      'Nathalie Duquenne',
    ],
    ogImage: '/images/Nathalie_Duquenne.webp',
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
      fromAddress: 'dduquenne@appreciezvotrevie.fr',
      fromName: 'Appréciez Votre Vie',
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

  // Configuration séminaires
  seminars: {
    types: [
      { value: 'breathwork', label: 'Breathwork' },
      { value: 'rebirth', label: 'Rebirth' },
      { value: 'sophrologie', label: 'Sophrologie' },
      { value: 'relaxation', label: 'Relaxation' },
      { value: 'meditation', label: 'Méditation' },
      { value: 'developpement-personnel', label: 'Développement personnel' },
      { value: 'autre', label: 'Autre' },
    ],
    speakersCount: 2,
    defaultCapacity: 24,
    currency: 'EUR',
    thumbnailUpload: true,
    depositEnabled: true,
    orderEnabled: true,
  },

  // Thème visuel (référence theme.config.ts pour les détails)
  theme: {
    colors: {
      primary: '#8B7093', // Mauve (from logo)
      secondary: '#1C1526', // Deep purple night
      accent: '#C4A6B0', // Dusty rose
      background: '#1C1526', // Deep purple night
      foreground: '#F5F0F5', // Lavender white
      muted: '#b0a8b4',
      success: '#10b981',
      warning: '#f97316',
      error: '#ef4444',
    },
    fonts: {
      display: 'Cormorant Garamond',
      body: 'Inter',
    },
  },
});

export default siteConfig;
