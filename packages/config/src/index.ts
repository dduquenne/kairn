import { z } from 'zod';

// ============================================================================
// SCHÉMAS DE BASE
// ============================================================================

export const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string().default('France'),
});

export const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const businessHoursSchema = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
});

// ============================================================================
// PRATICIEN
// ============================================================================

export const practitionerSchema = z.object({
  name: z.string().min(2),
  title: z.string(),
  subtitle: z.string().optional(),
  bio: z.string().min(100),
  image: z.string(),
  specialties: z.array(z.string()).optional(),
  credentials: z.array(z.object({
    title: z.string(),
    institution: z.string().optional(),
    year: z.number().optional(),
  })),
  socialLinks: z.object({
    linkedin: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    threads: z.string().url().optional(),
    youtube: z.string().url().optional(),
  }).optional(),
});

// ============================================================================
// CONTACT
// ============================================================================

export const contactSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  address: addressSchema,
  coordinates: coordinatesSchema,
  businessHours: businessHoursSchema,
  appointmentUrl: z.string().url().optional(),
});

// ============================================================================
// SERVICES / THÉRAPIES
// ============================================================================

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string(),
  icon: z.string().optional(),
  enabled: z.boolean().default(true),
  order: z.number().default(0),
});

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const featuresSchema = z.object({
  blog: z.boolean().default(true),
  seminars: z.boolean().default(false),
  analytics: z.boolean().default(true),
  socialMedia: z.boolean().default(false),
  appointmentBooking: z.boolean().default(true),
  testimonials: z.boolean().default(true),
  newsletter: z.boolean().default(false),
  contactForm: z.boolean().default(true),
});

// ============================================================================
// SEO
// ============================================================================

export const seoSchema = z.object({
  defaultTitle: z.string(),
  titleTemplate: z.string().default('%s | {siteName}'),
  description: z.string().max(160),
  keywords: z.array(z.string()),
  ogImage: z.string().optional(),
  twitterHandle: z.string().optional(),
  locale: z.string().default('fr_FR'),
});

// ============================================================================
// INTÉGRATIONS (clés API, etc.)
// ============================================================================

export const integrationsSchema = z.object({
  database: z.object({
    url: z.string(),
  }),
  auth: z.object({
    jwtSecret: z.string(),
    jwtAccessSecret: z.string().optional(),
    jwtRefreshSecret: z.string().optional(),
  }),
  email: z.object({
    provider: z.enum(['resend', 'sendgrid', 'smtp']).default('resend'),
    apiKey: z.string().optional(),
    fromAddress: z.string().email(),
    fromName: z.string(),
  }),
  storage: z.object({
    provider: z.enum(['supabase', 'local', 's3']).default('local'),
    bucket: z.string().optional(),
    url: z.string().optional(),
  }).optional(),
  analytics: z.object({
    googleAnalyticsId: z.string().optional(),
    plausibleDomain: z.string().optional(),
  }).optional(),
  ai: z.object({
    openaiApiKey: z.string().optional(),
    anthropicApiKey: z.string().optional(),
  }).optional(),
  recaptcha: z.object({
    siteKey: z.string(),
    secretKey: z.string(),
  }).optional(),
});

// ============================================================================
// THÈME
// ============================================================================

export const themeColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  foreground: z.string(),
  muted: z.string().optional(),
  success: z.string().optional(),
  warning: z.string().optional(),
  error: z.string().optional(),
});

export const themeFontsSchema = z.object({
  display: z.string(),
  body: z.string(),
});

export const themeSchema = z.object({
  colors: themeColorsSchema,
  fonts: themeFontsSchema,
  borderRadius: z.string().optional(),
  // Extensions Tailwind personnalisées
  extend: z.record(z.any()).optional(),
});

// ============================================================================
// CONFIGURATION SITE COMPLÈTE
// ============================================================================

export const siteConfigSchema = z.object({
  // Identité
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  locale: z.enum(['fr', 'en']).default('fr'),

  // Praticien
  practitioner: practitionerSchema,

  // Contact
  contact: contactSchema,

  // Services proposés
  services: z.array(serviceSchema),

  // Fonctionnalités activées
  features: featuresSchema,

  // SEO
  seo: seoSchema,

  // Intégrations
  integrations: integrationsSchema,

  // Thème visuel
  theme: themeSchema,
});

// ============================================================================
// TYPES EXPORTÉS
// ============================================================================

export type Address = z.infer<typeof addressSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type BusinessHours = z.infer<typeof businessHoursSchema>;
export type Practitioner = z.infer<typeof practitionerSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Features = z.infer<typeof featuresSchema>;
export type SEOConfig = z.infer<typeof seoSchema>;
export type Integrations = z.infer<typeof integrationsSchema>;
export type ThemeColors = z.infer<typeof themeColorsSchema>;
export type ThemeFonts = z.infer<typeof themeFontsSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valide et retourne une configuration de site
 */
export function defineSiteConfig(config: SiteConfig): SiteConfig {
  return siteConfigSchema.parse(config);
}

/**
 * Valide partiellement une configuration (pour les overrides)
 */
export function definePartialConfig(config: Partial<SiteConfig>): Partial<SiteConfig> {
  return siteConfigSchema.partial().parse(config);
}
