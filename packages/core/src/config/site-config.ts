/**
 * Site Configuration Schema
 *
 * Defines the complete configuration schema for a site in the Kairn platform.
 * Uses Zod for runtime validation and TypeScript type inference.
 *
 * Configuration is hierarchical:
 * 1. Platform defaults (hardcoded)
 * 2. Site-specific config (from database or JSON file)
 * 3. Environment overrides
 */

import { z } from 'zod';

// =============================================================================
// Theme Configuration
// =============================================================================

/**
 * Color palette schema
 */
const ColorPaletteSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  primaryForeground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryForeground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentForeground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
  foreground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1A1A1A'),
  muted: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  mutedForeground: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  border: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  destructive: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#EF4444'),
  success: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#22C55E'),
  warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#F59E0B'),
});

/**
 * Typography configuration
 */
const TypographySchema = z.object({
  fontFamily: z.object({
    sans: z.string().default('Inter, system-ui, sans-serif'),
    serif: z.string().default('Georgia, serif'),
    mono: z.string().default('JetBrains Mono, monospace'),
  }).default({}),
  fontSize: z.object({
    base: z.string().default('16px'),
    scale: z.number().min(1).max(2).default(1.25),
  }).default({}),
  fontWeight: z.object({
    normal: z.number().default(400),
    medium: z.number().default(500),
    semibold: z.number().default(600),
    bold: z.number().default(700),
  }).default({}),
});

/**
 * Spacing and layout configuration
 */
const LayoutSchema = z.object({
  borderRadius: z.object({
    sm: z.string().default('0.25rem'),
    md: z.string().default('0.5rem'),
    lg: z.string().default('1rem'),
    full: z.string().default('9999px'),
  }).default({}),
  maxWidth: z.object({
    content: z.string().default('1200px'),
    prose: z.string().default('65ch'),
  }).default({}),
  headerHeight: z.string().default('64px'),
  footerMinHeight: z.string().default('200px'),
});

/**
 * Complete theme schema
 */
const ThemeSchema = z.object({
  colors: z.object({
    light: ColorPaletteSchema,
    dark: ColorPaletteSchema.optional(),
  }),
  typography: TypographySchema.default({}),
  layout: LayoutSchema.default({}),
  darkModeEnabled: z.boolean().default(false),
  defaultMode: z.enum(['light', 'dark', 'system']).default('light'),
});

// =============================================================================
// Feature Flags
// =============================================================================

const FeaturesSchema = z.object({
  /** Enable blog functionality */
  blog: z.boolean().default(true),
  /** Enable testimonials section */
  testimonials: z.boolean().default(true),
  /** Enable contact form */
  contact: z.boolean().default(true),
  /** Enable appointment booking */
  appointments: z.boolean().default(false),
  /** Enable analytics tracking */
  analytics: z.boolean().default(true),
  /** Enable newsletter signup */
  newsletter: z.boolean().default(false),
  /** Enable social sharing */
  socialSharing: z.boolean().default(true),
  /** Enable search functionality */
  search: z.boolean().default(false),
  /** Enable multi-language support */
  i18n: z.boolean().default(false),
  /** Enable user authentication */
  auth: z.boolean().default(true),
  /** Enable admin panel */
  admin: z.boolean().default(true),
});

// =============================================================================
// SEO Configuration
// =============================================================================

const SeoSchema = z.object({
  /** Default page title */
  title: z.string().min(1).max(60),
  /** Title template for pages */
  titleTemplate: z.string().default('%s | {siteName}'),
  /** Default meta description */
  description: z.string().max(160).optional(),
  /** Default keywords */
  keywords: z.array(z.string()).default([]),
  /** Canonical URL base */
  canonicalBase: z.string().url().optional(),
  /** Open Graph configuration */
  openGraph: z.object({
    type: z.enum(['website', 'article', 'profile']).default('website'),
    locale: z.string().default('fr_FR'),
    siteName: z.string().optional(),
    defaultImage: z.string().url().optional(),
  }).default({}),
  /** Twitter card configuration */
  twitter: z.object({
    card: z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
    site: z.string().optional(),
    creator: z.string().optional(),
  }).default({}),
  /** Robots configuration */
  robots: z.object({
    index: z.boolean().default(true),
    follow: z.boolean().default(true),
    noarchive: z.boolean().default(false),
    nosnippet: z.boolean().default(false),
  }).default({}),
  /** Structured data (JSON-LD) */
  structuredData: z.object({
    enabled: z.boolean().default(true),
    organization: z.object({
      name: z.string().optional(),
      logo: z.string().url().optional(),
      sameAs: z.array(z.string().url()).default([]),
    }).default({}),
    localBusiness: z.object({
      enabled: z.boolean().default(false),
      type: z.string().default('LocalBusiness'),
      address: z.object({
        streetAddress: z.string().optional(),
        addressLocality: z.string().optional(),
        postalCode: z.string().optional(),
        addressCountry: z.string().default('FR'),
      }).default({}),
      geo: z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }).default({}),
      openingHours: z.array(z.string()).default([]),
    }).default({}),
  }).default({}),
});

// =============================================================================
// Contact & Business Information
// =============================================================================

const ContactSchema = z.object({
  /** Business email */
  email: z.string().email().optional(),
  /** Business phone */
  phone: z.string().optional(),
  /** Physical address */
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default('France'),
    full: z.string().optional(),
  }).default({}),
  /** Social media links */
  social: z.object({
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    youtube: z.string().url().optional(),
  }).default({}),
  /** Contact form settings */
  form: z.object({
    recipientEmail: z.string().email().optional(),
    subjectPrefix: z.string().default('[Contact]'),
    successMessage: z.string().default('Merci pour votre message. Nous vous répondrons dans les plus brefs délais.'),
    fields: z.object({
      phone: z.object({ enabled: z.boolean().default(true), required: z.boolean().default(false) }).default({}),
      subject: z.object({ enabled: z.boolean().default(true), required: z.boolean().default(false) }).default({}),
      message: z.object({ minLength: z.number().default(10), maxLength: z.number().default(2000) }).default({}),
    }).default({}),
  }).default({}),
});

// =============================================================================
// Integration Settings
// =============================================================================

const IntegrationsSchema = z.object({
  /** Google Analytics */
  googleAnalytics: z.object({
    enabled: z.boolean().default(false),
    measurementId: z.string().optional(),
    anonymizeIp: z.boolean().default(true),
  }).default({}),
  /** Google Tag Manager */
  googleTagManager: z.object({
    enabled: z.boolean().default(false),
    containerId: z.string().optional(),
  }).default({}),
  /** Hotjar */
  hotjar: z.object({
    enabled: z.boolean().default(false),
    siteId: z.string().optional(),
  }).default({}),
  /** Crisp Chat */
  crispChat: z.object({
    enabled: z.boolean().default(false),
    websiteId: z.string().optional(),
  }).default({}),
  /** Calendly */
  calendly: z.object({
    enabled: z.boolean().default(false),
    url: z.string().url().optional(),
    embedType: z.enum(['inline', 'popup', 'text']).default('popup'),
  }).default({}),
  /** Resend (Email) */
  resend: z.object({
    enabled: z.boolean().default(false),
    fromEmail: z.string().email().optional(),
    fromName: z.string().optional(),
  }).default({}),
  /** Supabase */
  supabase: z.object({
    enabled: z.boolean().default(true),
    url: z.string().url().optional(),
    anonKey: z.string().optional(),
  }).default({}),
});

// =============================================================================
// Content Settings
// =============================================================================

const ContentSchema = z.object({
  /** Blog settings */
  blog: z.object({
    postsPerPage: z.number().min(1).max(50).default(10),
    excerptLength: z.number().min(50).max(500).default(200),
    showAuthor: z.boolean().default(true),
    showDate: z.boolean().default(true),
    showReadingTime: z.boolean().default(true),
    showTags: z.boolean().default(true),
    allowComments: z.boolean().default(false),
    defaultCategory: z.string().optional(),
  }).default({}),
  /** Testimonials settings */
  testimonials: z.object({
    displayMode: z.enum(['grid', 'carousel', 'list']).default('carousel'),
    showRating: z.boolean().default(true),
    autoRotate: z.boolean().default(true),
    rotationInterval: z.number().min(3000).max(15000).default(5000),
  }).default({}),
  /** Hero section */
  hero: z.object({
    style: z.enum(['centered', 'split', 'fullscreen', 'minimal']).default('centered'),
    showCta: z.boolean().default(true),
    ctaText: z.string().default('Prendre rendez-vous'),
    ctaLink: z.string().default('/contact'),
    secondaryCta: z.object({
      enabled: z.boolean().default(false),
      text: z.string().default('En savoir plus'),
      link: z.string().default('/about'),
    }).default({}),
  }).default({}),
});

// =============================================================================
// Navigation Configuration
// =============================================================================

const NavigationItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().default(false),
  icon: z.string().optional(),
  children: z.array(z.lazy(() => NavigationItemSchema)).optional(),
});

type NavigationItem = z.infer<typeof NavigationItemSchema>;

const NavigationSchema = z.object({
  /** Main navigation items */
  main: z.array(NavigationItemSchema).default([
    { label: 'Accueil', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Blog', href: '/blog' },
    { label: 'À propos', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]),
  /** Footer navigation sections */
  footer: z.array(z.object({
    title: z.string(),
    items: z.array(NavigationItemSchema),
  })).default([]),
  /** Show social links in navigation */
  showSocialLinks: z.boolean().default(true),
});

// =============================================================================
// Legal Configuration
// =============================================================================

const LegalSchema = z.object({
  /** Company legal name */
  companyName: z.string().optional(),
  /** SIRET number (France) */
  siret: z.string().optional(),
  /** VAT number */
  vatNumber: z.string().optional(),
  /** Professional title/certification */
  professionalTitle: z.string().optional(),
  /** Professional organization */
  professionalOrganization: z.string().optional(),
  /** Professional insurance */
  professionalInsurance: z.string().optional(),
  /** Privacy policy URL or content */
  privacyPolicy: z.object({
    enabled: z.boolean().default(true),
    url: z.string().default('/legal/privacy'),
    lastUpdated: z.string().optional(),
  }).default({}),
  /** Terms of service */
  termsOfService: z.object({
    enabled: z.boolean().default(true),
    url: z.string().default('/legal/terms'),
    lastUpdated: z.string().optional(),
  }).default({}),
  /** Cookie consent */
  cookieConsent: z.object({
    enabled: z.boolean().default(true),
    message: z.string().default('Ce site utilise des cookies pour améliorer votre expérience.'),
    learnMoreUrl: z.string().default('/legal/cookies'),
  }).default({}),
});

// =============================================================================
// Complete Site Configuration Schema
// =============================================================================

export const SiteConfigSchema = z.object({
  /** Unique site identifier (slug) */
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  /** Site display name */
  name: z.string().min(1).max(100),
  /** Site tagline */
  tagline: z.string().max(200).optional(),
  /** Primary domain */
  domain: z.string().optional(),
  /** Site locale */
  locale: z.string().default('fr'),
  /** Timezone */
  timezone: z.string().default('Europe/Paris'),
  /** Configuration version for migrations */
  version: z.string().default('1.0.0'),
  /** Theme configuration */
  theme: ThemeSchema,
  /** Feature flags */
  features: FeaturesSchema.default({}),
  /** SEO configuration */
  seo: SeoSchema,
  /** Contact information */
  contact: ContactSchema.default({}),
  /** Third-party integrations */
  integrations: IntegrationsSchema.default({}),
  /** Content settings */
  content: ContentSchema.default({}),
  /** Navigation configuration */
  navigation: NavigationSchema.default({}),
  /** Legal information */
  legal: LegalSchema.default({}),
});

// =============================================================================
// Types
// =============================================================================

export type SiteConfig = z.infer<typeof SiteConfigSchema>;
export type ThemeConfig = z.infer<typeof ThemeSchema>;
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;
export type FeaturesConfig = z.infer<typeof FeaturesSchema>;
export type SeoConfig = z.infer<typeof SeoSchema>;
export type ContactConfig = z.infer<typeof ContactSchema>;
export type IntegrationsConfig = z.infer<typeof IntegrationsSchema>;
export type ContentConfig = z.infer<typeof ContentSchema>;
export type NavigationConfig = z.infer<typeof NavigationSchema>;
export type LegalConfig = z.infer<typeof LegalSchema>;
export type { NavigationItem };

// =============================================================================
// Validation & Utilities
// =============================================================================

/**
 * Validate a site configuration
 */
export function validateSiteConfig(config: unknown): SiteConfig {
  return SiteConfigSchema.parse(config);
}

/**
 * Safely validate a site configuration (returns result object)
 */
export function safeParseSiteConfig(config: unknown): z.SafeParseReturnType<unknown, SiteConfig> {
  return SiteConfigSchema.safeParse(config);
}

/**
 * Create a partial config with defaults
 */
export function createSiteConfig(config: Partial<SiteConfig> & Pick<SiteConfig, 'slug' | 'name' | 'theme' | 'seo'>): SiteConfig {
  return SiteConfigSchema.parse(config);
}

/**
 * Merge site config with overrides
 */
export function mergeSiteConfig(base: SiteConfig, overrides: Partial<SiteConfig>): SiteConfig {
  return SiteConfigSchema.parse({
    ...base,
    ...overrides,
    theme: { ...base.theme, ...overrides.theme },
    features: { ...base.features, ...overrides.features },
    seo: { ...base.seo, ...overrides.seo },
    contact: { ...base.contact, ...overrides.contact },
    integrations: { ...base.integrations, ...overrides.integrations },
    content: { ...base.content, ...overrides.content },
    navigation: { ...base.navigation, ...overrides.navigation },
    legal: { ...base.legal, ...overrides.legal },
  });
}

/**
 * Get configuration diff between two configs
 */
export function diffSiteConfig(oldConfig: SiteConfig, newConfig: SiteConfig): Partial<SiteConfig> {
  const diff: Partial<SiteConfig> = {};

  for (const key of Object.keys(newConfig) as (keyof SiteConfig)[]) {
    if (JSON.stringify(oldConfig[key]) !== JSON.stringify(newConfig[key])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (diff as any)[key] = newConfig[key];
    }
  }

  return diff;
}
