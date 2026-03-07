import { describe, it, expect } from 'vitest';

import {
  defineGeoConfig,
  getGeoPageSlug,
  getAllGeoPageSlugs,
  generateGeoSitemapEntries,
  generateGeoRedirects,
  generateGeoStructuredData,
  findGeoPage,
} from '../geo';
import type { GeoConfig, GeoPageDefinition } from '../geo';

const testConfig: GeoConfig = defineGeoConfig({
  baseUrl: 'https://example.fr',
  locations: [
    {
      name: 'Paris',
      slug: 'paris',
      type: 'city',
      departmentCode: '75',
      wikiUrl: 'https://fr.wikipedia.org/wiki/Paris',
      distance: '10 km',
      duration: '15 min',
      directions: 'Via A1',
    },
    {
      name: 'Île-de-France',
      slug: 'ile-de-france',
      type: 'region',
    },
  ],
  services: [
    {
      id: 'therapy',
      label: 'Thérapie',
      slugPrefix: 'therapie',
      serviceHref: '/therapie',
      schemaType: 'MedicalBusiness',
    },
    {
      id: 'coaching',
      label: 'Coaching',
      slugPrefix: 'coaching',
      serviceHref: '/coaching',
    },
  ],
  pages: [
    { serviceId: 'therapy', locationSlug: 'paris', priority: 0.8 },
    { serviceId: 'therapy', locationSlug: 'ile-de-france', priority: 0.8 },
    { serviceId: 'coaching', locationSlug: 'paris', slug: 'coach-paris', priority: 0.9 },
  ],
  hubPages: [{ slug: 'ile-de-france', priority: 0.95 }],
  redirects: [{ source: 'therapeute-paris', destination: 'therapie-paris', permanent: true }],
  practiceLocation: {
    address: '10 Rue Exemple',
    city: 'Ville',
    postalCode: '75001',
    country: 'FR',
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  practitioner: {
    name: 'Dr. Test',
    jobTitle: 'Thérapeute',
  },
});

describe('geo', () => {
  describe('defineGeoConfig', () => {
    it('should validate and return a valid config', () => {
      expect(testConfig.baseUrl).toBe('https://example.fr');
      expect(testConfig.locations).toHaveLength(2);
      expect(testConfig.services).toHaveLength(2);
      expect(testConfig.pages).toHaveLength(3);
    });

    it('should reject invalid config', () => {
      expect(() =>
        defineGeoConfig({
          baseUrl: 'not-a-url',
        } as GeoConfig)
      ).toThrow();
    });
  });

  describe('getGeoPageSlug', () => {
    it('should generate slug from service prefix and location', () => {
      const page: GeoPageDefinition = {
        serviceId: 'therapy',
        locationSlug: 'paris',
        priority: 0.8,
      };
      const slug = getGeoPageSlug(page, testConfig.services);
      expect(slug).toBe('therapie-paris');
    });

    it('should use custom slug when provided', () => {
      const page: GeoPageDefinition = {
        serviceId: 'coaching',
        locationSlug: 'paris',
        slug: 'coach-paris',
        priority: 0.8,
      };
      const slug = getGeoPageSlug(page, testConfig.services);
      expect(slug).toBe('coach-paris');
    });

    it('should fallback to serviceId when service not found', () => {
      const page: GeoPageDefinition = {
        serviceId: 'unknown',
        locationSlug: 'paris',
        priority: 0.8,
      };
      const slug = getGeoPageSlug(page, testConfig.services);
      expect(slug).toBe('unknown-paris');
    });
  });

  describe('getAllGeoPageSlugs', () => {
    it('should return all page slugs', () => {
      const slugs = getAllGeoPageSlugs(testConfig);
      expect(slugs).toContain('therapie-paris');
      expect(slugs).toContain('therapie-ile-de-france');
      expect(slugs).toContain('coach-paris');
      expect(slugs).toHaveLength(3);
    });
  });

  describe('generateGeoSitemapEntries', () => {
    it('should generate entries for all pages and hubs', () => {
      const entries = generateGeoSitemapEntries(testConfig);
      // 3 pages + 1 hub
      expect(entries).toHaveLength(4);
    });

    it('should use correct URLs', () => {
      const entries = generateGeoSitemapEntries(testConfig);
      const urls = entries.map(e => e.url);
      expect(urls).toContain('https://example.fr/therapie-paris');
      expect(urls).toContain('https://example.fr/coach-paris');
      expect(urls).toContain('https://example.fr/ile-de-france');
    });

    it('should use page priority', () => {
      const entries = generateGeoSitemapEntries(testConfig);
      const coachEntry = entries.find(e => e.url.includes('coach-paris'));
      expect(coachEntry?.priority).toBe(0.9);
    });

    it('should use hub priority', () => {
      const entries = generateGeoSitemapEntries(testConfig);
      const hubEntry = entries.find(e => e.url.endsWith('/ile-de-france'));
      expect(hubEntry?.priority).toBe(0.95);
    });
  });

  describe('generateGeoRedirects', () => {
    it('should generate redirect entries with leading slashes', () => {
      const redirects = generateGeoRedirects(testConfig);
      expect(redirects).toHaveLength(1);
      expect(redirects[0]).toEqual({
        source: '/therapeute-paris',
        destination: '/therapie-paris',
        permanent: true,
      });
    });
  });

  describe('generateGeoStructuredData', () => {
    it('should generate valid JSON-LD structured data', () => {
      const page = testConfig.pages[0]!;
      const schema = generateGeoStructuredData(testConfig, page);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('MedicalBusiness');
      expect(schema['@id']).toBe('https://example.fr/therapie-paris');
      expect(schema.url).toBe('https://example.fr/therapie-paris');
    });

    it('should include provider info', () => {
      const page = testConfig.pages[0]!;
      const schema = generateGeoStructuredData(testConfig, page);
      const provider = schema.provider as Record<string, string>;

      expect(provider.name).toBe('Dr. Test');
      expect(provider.jobTitle).toBe('Thérapeute');
    });

    it('should include address', () => {
      const page = testConfig.pages[0]!;
      const schema = generateGeoStructuredData(testConfig, page);
      const address = schema.address as Record<string, string>;

      expect(address.streetAddress).toBe('10 Rue Exemple');
      expect(address.postalCode).toBe('75001');
    });

    it('should include areaServed with wiki link', () => {
      const page = testConfig.pages[0]!;
      const schema = generateGeoStructuredData(testConfig, page);
      const areaServed = schema.areaServed as Record<string, string>;

      expect(areaServed['@type']).toBe('City');
      expect(areaServed.name).toBe('Paris');
      expect(areaServed.sameAs).toBe('https://fr.wikipedia.org/wiki/Paris');
    });

    it('should include geo coordinates', () => {
      const page = testConfig.pages[0]!;
      const schema = generateGeoStructuredData(testConfig, page);
      const geo = schema.geo as Record<string, unknown>;

      expect(geo['@type']).toBe('GeoCoordinates');
      expect(geo.latitude).toBe(48.8566);
    });
  });

  describe('findGeoPage', () => {
    it('should find a page by slug', () => {
      const result = findGeoPage(testConfig, 'therapie-paris');
      expect(result).toBeDefined();
      expect(result?.service.id).toBe('therapy');
      expect(result?.location.name).toBe('Paris');
    });

    it('should find a page with custom slug', () => {
      const result = findGeoPage(testConfig, 'coach-paris');
      expect(result).toBeDefined();
      expect(result?.service.id).toBe('coaching');
    });

    it('should return undefined for unknown slug', () => {
      const result = findGeoPage(testConfig, 'unknown-page');
      expect(result).toBeUndefined();
    });
  });
});
