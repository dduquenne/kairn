/**
 * Geo Pages SEO Configuration
 *
 * Centralizes geographic page definitions for local SEO.
 * Each site can define its localities, services, and redirects
 * to generate geo-targeted landing pages automatically.
 *
 * @module geo
 */

import { z } from 'zod';

// ── Schemas ─────────────────────────────────────────────────────────────────

/** Schema for a geographic location */
export const geoLocationSchema = z.object({
  /** City/area name */
  name: z.string().min(1),
  /** URL slug for this location (e.g., 'auxerre', 'yonne') */
  slug: z.string().min(1),
  /** Location type */
  type: z.enum(['city', 'department', 'region']),
  /** Department code (e.g., '89') */
  departmentCode: z.string().optional(),
  /** Wikipedia URL for schema.org sameAs */
  wikiUrl: z.string().url().optional(),
  /** Distance from practice location */
  distance: z.string().optional(),
  /** Travel duration from this location */
  duration: z.string().optional(),
  /** Driving directions description */
  directions: z.string().optional(),
});

/** Schema for a service offered at a geo location */
export const geoServiceSchema = z.object({
  /** Service identifier (matches serviceSchema.id) */
  id: z.string().min(1),
  /** Display label for this service */
  label: z.string().min(1),
  /** URL slug prefix (e.g., 'psychotherapie', 'hypnose') */
  slugPrefix: z.string().min(1),
  /** Service page URL */
  serviceHref: z.string().min(1),
  /** Schema.org type for structured data (defaults to 'MedicalBusiness') */
  schemaType: z.string().optional(),
});

/** Schema for a geo page combining service + location */
export const geoPageDefinitionSchema = z.object({
  /** Service ID (references geoServiceSchema.id) */
  serviceId: z.string().min(1),
  /** Location slug (references geoLocationSchema.slug) */
  locationSlug: z.string().min(1),
  /** Custom page slug override (defaults to {slugPrefix}-{locationSlug}) */
  slug: z.string().optional(),
  /** Sitemap priority (0.0 to 1.0, defaults to 0.8) */
  priority: z.number().min(0).max(1).optional(),
});

/** Schema for a legacy redirect */
export const geoRedirectSchema = z.object({
  /** Source path (without leading slash) */
  source: z.string().min(1),
  /** Destination path (without leading slash) */
  destination: z.string().min(1),
  /** Whether redirect is permanent (301, defaults to true) */
  permanent: z.boolean().optional(),
});

/** Complete geo SEO configuration for a site */
export const geoConfigSchema = z.object({
  /** Base URL of the site */
  baseUrl: z.string().url(),
  /** Available geographic locations */
  locations: z.array(geoLocationSchema),
  /** Services offered at geo locations */
  services: z.array(geoServiceSchema),
  /** Geo page definitions (service + location combinations) */
  pages: z.array(geoPageDefinitionSchema),
  /** Hub page slugs (e.g., department overview pages) */
  hubPages: z
    .array(
      z.object({
        slug: z.string().min(1),
        priority: z.number().min(0).max(1).optional(),
      })
    )
    .optional(),
  /** Legacy redirects for SEO preservation */
  redirects: z.array(geoRedirectSchema).optional(),
  /** Practice location info for structured data */
  practiceLocation: z.object({
    address: z.string(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string().default('FR'),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
  /** Practitioner info for structured data */
  practitioner: z.object({
    name: z.string(),
    jobTitle: z.string(),
  }),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type GeoLocation = z.infer<typeof geoLocationSchema>;
export type GeoService = z.infer<typeof geoServiceSchema>;
export type GeoPageDefinition = z.infer<typeof geoPageDefinitionSchema>;
export type GeoRedirect = z.infer<typeof geoRedirectSchema>;
export type GeoConfig = z.infer<typeof geoConfigSchema>;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Define and validate a geo configuration
 *
 * @param config - Raw geo configuration
 * @returns Validated GeoConfig
 */
export function defineGeoConfig(config: GeoConfig): GeoConfig {
  return geoConfigSchema.parse(config);
}

/**
 * Get the slug for a geo page
 *
 * @param page - Geo page definition
 * @param services - Available services
 * @returns Page slug (e.g., 'psychotherapie-auxerre')
 */
export function getGeoPageSlug(page: GeoPageDefinition, services: GeoService[]): string {
  if (page.slug) return page.slug;
  const service = services.find(s => s.id === page.serviceId);
  if (!service) return `${page.serviceId}-${page.locationSlug}`;
  return `${service.slugPrefix}-${page.locationSlug}`;
}

/**
 * Get all geo page slugs from a config
 *
 * @param config - Geo configuration
 * @returns Array of page slugs
 */
export function getAllGeoPageSlugs(config: GeoConfig): string[] {
  return config.pages.map(page => getGeoPageSlug(page, config.services));
}

/**
 * Generate sitemap entries for geo pages
 *
 * @param config - Geo configuration
 * @returns Sitemap entries compatible with Next.js MetadataRoute.Sitemap
 */
export function generateGeoSitemapEntries(config: GeoConfig): Array<{
  url: string;
  lastModified: Date;
  changeFrequency: 'monthly';
  priority: number;
}> {
  const entries: Array<{
    url: string;
    lastModified: Date;
    changeFrequency: 'monthly';
    priority: number;
  }> = [];

  // Geo pages
  for (const page of config.pages) {
    const slug = getGeoPageSlug(page, config.services);
    entries.push({
      url: `${config.baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: page.priority ?? 0.8,
    });
  }

  // Hub pages
  for (const hub of config.hubPages ?? []) {
    entries.push({
      url: `${config.baseUrl}/${hub.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: hub.priority ?? 0.95,
    });
  }

  return entries;
}

/**
 * Generate redirect entries for Next.js config
 *
 * @param config - Geo configuration
 * @returns Redirect entries compatible with Next.js redirects()
 */
export function generateGeoRedirects(
  config: GeoConfig
): Array<{ source: string; destination: string; permanent: boolean }> {
  return (config.redirects ?? []).map(r => ({
    source: `/${r.source}`,
    destination: `/${r.destination}`,
    permanent: r.permanent ?? true,
  }));
}

/**
 * Generate MedicalBusiness structured data for a geo page
 *
 * @param config - Geo configuration
 * @param page - Page definition
 * @returns JSON-LD structured data object
 */
export function generateGeoStructuredData(
  config: GeoConfig,
  page: GeoPageDefinition
): Record<string, unknown> {
  const service = config.services.find(s => s.id === page.serviceId);
  const location = config.locations.find(l => l.slug === page.locationSlug);
  const slug = getGeoPageSlug(page, config.services);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': service?.schemaType ?? 'MedicalBusiness',
    '@id': `${config.baseUrl}/${slug}`,
    name: `${config.practitioner.name} - ${service?.label ?? page.serviceId} pour ${location?.name ?? page.locationSlug}`,
    url: `${config.baseUrl}/${slug}`,
    provider: {
      '@type': 'Person',
      name: config.practitioner.name,
      jobTitle: config.practitioner.jobTitle,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.practiceLocation.address,
      addressLocality: config.practiceLocation.city,
      postalCode: config.practiceLocation.postalCode,
      addressCountry: config.practiceLocation.country,
    },
  };

  if (location) {
    const areaServed: Record<string, unknown> = {
      '@type': location.type === 'city' ? 'City' : 'AdministrativeArea',
      name: location.name,
    };
    if (location.wikiUrl) {
      areaServed.sameAs = location.wikiUrl;
    }
    schema.areaServed = areaServed;
  }

  if (config.practiceLocation.coordinates) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: config.practiceLocation.coordinates.lat,
      longitude: config.practiceLocation.coordinates.lng,
    };
  }

  return schema;
}

/**
 * Find a geo page definition by its slug
 *
 * @param config - Geo configuration
 * @param slug - Page slug to find
 * @returns Page definition and resolved service/location, or undefined
 */
export function findGeoPage(
  config: GeoConfig,
  slug: string
): { page: GeoPageDefinition; service: GeoService; location: GeoLocation } | undefined {
  for (const page of config.pages) {
    const pageSlug = getGeoPageSlug(page, config.services);
    if (pageSlug === slug) {
      const service = config.services.find(s => s.id === page.serviceId);
      const location = config.locations.find(l => l.slug === page.locationSlug);
      if (service && location) {
        return { page, service, location };
      }
    }
  }
  return undefined;
}
