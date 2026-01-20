/**
 * Default Site Configuration
 *
 * Provides sensible defaults for new sites in the Kairn platform.
 * These defaults are tailored for French healthcare practitioners.
 */

import type { SiteConfig, ThemeConfig, ColorPalette } from './site-config';

// =============================================================================
// Color Palettes
// =============================================================================

/**
 * Pre-defined color palettes for common use cases
 */
export const COLOR_PALETTES = {
  /** Calm and professional - suitable for therapists */
  calm: {
    primary: '#4F46E5', // Indigo
    primaryForeground: '#FFFFFF',
    secondary: '#8B5CF6', // Purple
    secondaryForeground: '#FFFFFF',
    accent: '#059669', // Emerald
    accentForeground: '#FFFFFF',
    background: '#FFFFFF',
    foreground: '#1F2937',
    muted: '#F3F4F6',
    mutedForeground: '#6B7280',
    border: '#E5E7EB',
    destructive: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },

  /** Natural and organic - suitable for holistic practitioners */
  natural: {
    primary: '#059669', // Emerald
    primaryForeground: '#FFFFFF',
    secondary: '#84CC16', // Lime
    secondaryForeground: '#1F2937',
    accent: '#0EA5E9', // Sky
    accentForeground: '#FFFFFF',
    background: '#FAFAF9',
    foreground: '#292524',
    muted: '#F5F5F4',
    mutedForeground: '#78716C',
    border: '#E7E5E4',
    destructive: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },

  /** Warm and welcoming - suitable for counselors */
  warm: {
    primary: '#EA580C', // Orange
    primaryForeground: '#FFFFFF',
    secondary: '#F59E0B', // Amber
    secondaryForeground: '#1F2937',
    accent: '#DC2626', // Red
    accentForeground: '#FFFFFF',
    background: '#FFFBEB',
    foreground: '#1C1917',
    muted: '#FEF3C7',
    mutedForeground: '#92400E',
    border: '#FDE68A',
    destructive: '#B91C1C',
    success: '#16A34A',
    warning: '#D97706',
  },

  /** Modern and clean - suitable for medical professionals */
  modern: {
    primary: '#0EA5E9', // Sky
    primaryForeground: '#FFFFFF',
    secondary: '#6366F1', // Indigo
    secondaryForeground: '#FFFFFF',
    accent: '#14B8A6', // Teal
    accentForeground: '#FFFFFF',
    background: '#FFFFFF',
    foreground: '#0F172A',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    border: '#E2E8F0',
    destructive: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },

  /** Serene and peaceful - suitable for meditation/mindfulness */
  serene: {
    primary: '#8B5CF6', // Violet
    primaryForeground: '#FFFFFF',
    secondary: '#A78BFA', // Purple
    secondaryForeground: '#FFFFFF',
    accent: '#EC4899', // Pink
    accentForeground: '#FFFFFF',
    background: '#FAF5FF',
    foreground: '#1E1B4B',
    muted: '#EDE9FE',
    mutedForeground: '#6B21A8',
    border: '#DDD6FE',
    destructive: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },
} as const satisfies Record<string, ColorPalette>;

// =============================================================================
// Default Theme
// =============================================================================

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    light: COLOR_PALETTES.calm,
    dark: {
      primary: '#818CF8',
      primaryForeground: '#1F2937',
      secondary: '#A78BFA',
      secondaryForeground: '#1F2937',
      accent: '#34D399',
      accentForeground: '#1F2937',
      background: '#111827',
      foreground: '#F9FAFB',
      muted: '#1F2937',
      mutedForeground: '#9CA3AF',
      border: '#374151',
      destructive: '#F87171',
      success: '#4ADE80',
      warning: '#FBBF24',
    },
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      serif: 'Merriweather, Georgia, serif',
      mono: 'JetBrains Mono, Menlo, monospace',
    },
    fontSize: {
      base: '16px',
      scale: 1.25,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  layout: {
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem',
      full: '9999px',
    },
    maxWidth: {
      content: '1200px',
      prose: '65ch',
    },
    headerHeight: '64px',
    footerMinHeight: '200px',
  },
  darkModeEnabled: false,
  defaultMode: 'light',
};

// =============================================================================
// Default Navigation
// =============================================================================

export const DEFAULT_NAVIGATION = {
  main: [
    { label: 'Accueil', href: '/', external: false },
    { label: 'Services', href: '/services', external: false },
    { label: 'Blog', href: '/blog', external: false },
    { label: 'À propos', href: '/about', external: false },
    { label: 'Contact', href: '/contact', external: false },
  ],
  footer: [
    {
      title: 'Navigation',
      items: [
        { label: 'Accueil', href: '/', external: false },
        { label: 'Services', href: '/services', external: false },
        { label: 'Blog', href: '/blog', external: false },
        { label: 'Contact', href: '/contact', external: false },
      ],
    },
    {
      title: 'Légal',
      items: [
        { label: 'Mentions légales', href: '/legal/mentions', external: false },
        { label: 'Politique de confidentialité', href: '/legal/privacy', external: false },
        { label: 'CGU', href: '/legal/terms', external: false },
      ],
    },
  ],
  showSocialLinks: true,
};

// =============================================================================
// Site Templates
// =============================================================================

/**
 * Pre-configured site templates for quick setup
 */
export const SITE_TEMPLATES = {
  /** Psychologist/Therapist template */
  psychologist: {
    theme: {
      ...DEFAULT_THEME,
      colors: { light: COLOR_PALETTES.calm },
    },
    features: {
      blog: true,
      testimonials: true,
      contact: true,
      appointments: true,
      analytics: true,
      newsletter: false,
      socialSharing: true,
      search: false,
      i18n: false,
      auth: true,
      admin: true,
    },
    content: {
      hero: {
        style: 'centered' as const,
        showCta: true,
        ctaText: 'Prendre rendez-vous',
        ctaLink: '/contact',
        secondaryCta: {
          enabled: true,
          text: 'En savoir plus',
          link: '/services',
        },
      },
      testimonials: {
        displayMode: 'carousel' as const,
        showRating: true,
        autoRotate: true,
        rotationInterval: 5000,
      },
      blog: {
        postsPerPage: 6,
        excerptLength: 150,
        showAuthor: true,
        showDate: true,
        showReadingTime: true,
        showTags: true,
        allowComments: false,
      },
    },
  },

  /** Holistic practitioner template */
  holistic: {
    theme: {
      ...DEFAULT_THEME,
      colors: { light: COLOR_PALETTES.natural },
    },
    features: {
      blog: true,
      testimonials: true,
      contact: true,
      appointments: true,
      analytics: true,
      newsletter: true,
      socialSharing: true,
      search: false,
      i18n: false,
      auth: true,
      admin: true,
    },
    content: {
      hero: {
        style: 'split' as const,
        showCta: true,
        ctaText: 'Découvrir les soins',
        ctaLink: '/services',
        secondaryCta: {
          enabled: true,
          text: 'Réserver une séance',
          link: '/contact',
        },
      },
      testimonials: {
        displayMode: 'grid' as const,
        showRating: true,
        autoRotate: false,
        rotationInterval: 5000,
      },
      blog: {
        postsPerPage: 9,
        excerptLength: 200,
        showAuthor: true,
        showDate: true,
        showReadingTime: true,
        showTags: true,
        allowComments: false,
      },
    },
  },

  /** Medical professional template */
  medical: {
    theme: {
      ...DEFAULT_THEME,
      colors: { light: COLOR_PALETTES.modern },
    },
    features: {
      blog: true,
      testimonials: true,
      contact: true,
      appointments: true,
      analytics: true,
      newsletter: false,
      socialSharing: false,
      search: true,
      i18n: false,
      auth: true,
      admin: true,
    },
    content: {
      hero: {
        style: 'minimal' as const,
        showCta: true,
        ctaText: 'Prendre rendez-vous',
        ctaLink: '/appointments',
        secondaryCta: {
          enabled: false,
          text: '',
          link: '',
        },
      },
      testimonials: {
        displayMode: 'list' as const,
        showRating: false,
        autoRotate: false,
        rotationInterval: 5000,
      },
      blog: {
        postsPerPage: 10,
        excerptLength: 180,
        showAuthor: true,
        showDate: true,
        showReadingTime: true,
        showTags: true,
        allowComments: false,
      },
    },
  },

  /** Minimal/Simple template */
  minimal: {
    theme: DEFAULT_THEME,
    features: {
      blog: false,
      testimonials: true,
      contact: true,
      appointments: false,
      analytics: true,
      newsletter: false,
      socialSharing: false,
      search: false,
      i18n: false,
      auth: false,
      admin: true,
    },
    content: {
      hero: {
        style: 'minimal' as const,
        showCta: true,
        ctaText: 'Me contacter',
        ctaLink: '/contact',
        secondaryCta: {
          enabled: false,
          text: '',
          link: '',
        },
      },
      testimonials: {
        displayMode: 'carousel' as const,
        showRating: true,
        autoRotate: true,
        rotationInterval: 6000,
      },
      blog: {
        postsPerPage: 10,
        excerptLength: 200,
        showAuthor: true,
        showDate: true,
        showReadingTime: true,
        showTags: true,
        allowComments: false,
      },
    },
  },
} as const;

export type SiteTemplate = keyof typeof SITE_TEMPLATES;

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a new site configuration from a template
 */
export function createConfigFromTemplate(
  template: SiteTemplate,
  overrides: {
    slug: string;
    name: string;
    seo: { title: string; description?: string };
    domain?: string;
    contact?: Partial<SiteConfig['contact']>;
  }
): Partial<SiteConfig> {
  const templateConfig = SITE_TEMPLATES[template];

  return {
    slug: overrides.slug,
    name: overrides.name,
    domain: overrides.domain,
    theme: templateConfig.theme,
    features: templateConfig.features,
    seo: {
      title: overrides.seo.title,
      description: overrides.seo.description,
      titleTemplate: `%s | ${overrides.name}`,
      keywords: [],
      openGraph: {
        type: 'website',
        locale: 'fr_FR',
        siteName: overrides.name,
      },
      twitter: {
        card: 'summary_large_image',
      },
      robots: {
        index: true,
        follow: true,
        noarchive: false,
        nosnippet: false,
      },
      structuredData: {
        enabled: true,
        organization: {
          name: overrides.name,
          sameAs: [],
        },
        localBusiness: {
          enabled: false,
          type: 'LocalBusiness',
          address: {
            addressCountry: 'FR',
          },
          geo: {},
          openingHours: [],
        },
      },
    },
    content: templateConfig.content,
    contact: {
      address: { country: 'France' },
      social: {},
      form: {
        subjectPrefix: '[Contact]',
        successMessage: 'Merci pour votre message.',
        fields: {
          phone: { enabled: true, required: false },
          subject: { enabled: true, required: false },
          message: { minLength: 10, maxLength: 2000 },
        },
      },
      ...(overrides.contact ?? {}),
    },
    navigation: DEFAULT_NAVIGATION,
  };
}

/**
 * Get available color palette names
 */
export function getAvailablePalettes(): string[] {
  return Object.keys(COLOR_PALETTES);
}

/**
 * Get a color palette by name
 */
export function getColorPalette(name: string): ColorPalette | undefined {
  return COLOR_PALETTES[name as keyof typeof COLOR_PALETTES];
}
