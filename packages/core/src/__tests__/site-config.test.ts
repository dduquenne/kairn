import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSiteConfig,
  safeParseSiteConfig,
  createSiteConfig,
  mergeSiteConfig,
  diffSiteConfig,
  createConfigFromTemplate,
  getAvailablePalettes,
  getColorPalette,
  COLOR_PALETTES,
  SITE_TEMPLATES,
  DEFAULT_THEME,
  DEFAULT_NAVIGATION,
  ConfigLoader,
  MemoryConfigSource,
  EnvConfigSource,
  createConfigLoader,
  type SiteConfig,
} from '../config';

describe('Site Configuration', () => {
  describe('SiteConfigSchema', () => {
    it('should validate a minimal valid configuration', () => {
      const config = {
        slug: 'test-site',
        name: 'Test Site',
        theme: DEFAULT_THEME,
        seo: {
          title: 'Test Site',
        },
      };

      const result = safeParseSiteConfig(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('test-site');
        expect(result.data.name).toBe('Test Site');
        expect(result.data.locale).toBe('fr'); // default
      }
    });

    it('should reject invalid slug', () => {
      const config = {
        slug: 'Invalid Slug!',
        name: 'Test',
        theme: DEFAULT_THEME,
        seo: { title: 'Test' },
      };

      const result = safeParseSiteConfig(config);
      expect(result.success).toBe(false);
    });

    it('should reject invalid hex color', () => {
      const config = {
        slug: 'test',
        name: 'Test',
        theme: {
          ...DEFAULT_THEME,
          colors: {
            light: {
              ...DEFAULT_THEME.colors.light,
              primary: 'not-a-color',
            },
          },
        },
        seo: { title: 'Test' },
      };

      const result = safeParseSiteConfig(config);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const config = validateSiteConfig({
        slug: 'test',
        name: 'Test',
        theme: DEFAULT_THEME,
        seo: { title: 'Test' },
      });

      expect(config.locale).toBe('fr');
      expect(config.timezone).toBe('Europe/Paris');
      expect(config.version).toBe('1.0.0');
      expect(config.features.blog).toBe(true);
      expect(config.features.analytics).toBe(true);
    });

    it('should validate SEO configuration', () => {
      const config = validateSiteConfig({
        slug: 'test',
        name: 'Test',
        theme: DEFAULT_THEME,
        seo: {
          title: 'Test Site',
          description: 'A test description',
          keywords: ['test', 'site'],
          openGraph: {
            type: 'website',
            locale: 'fr_FR',
          },
          robots: {
            index: true,
            follow: true,
          },
        },
      });

      expect(config.seo.title).toBe('Test Site');
      expect(config.seo.description).toBe('A test description');
      expect(config.seo.keywords).toEqual(['test', 'site']);
      expect(config.seo.openGraph.type).toBe('website');
    });

    it('should validate contact configuration', () => {
      const config = validateSiteConfig({
        slug: 'test',
        name: 'Test',
        theme: DEFAULT_THEME,
        seo: { title: 'Test' },
        contact: {
          email: 'test@example.com',
          phone: '+33 1 23 45 67 89',
          address: {
            city: 'Paris',
            country: 'France',
          },
          social: {
            linkedin: 'https://linkedin.com/in/test',
          },
        },
      });

      expect(config.contact.email).toBe('test@example.com');
      expect(config.contact.address?.city).toBe('Paris');
      expect(config.contact.social?.linkedin).toBe('https://linkedin.com/in/test');
    });

    it('should validate navigation items', () => {
      const config = validateSiteConfig({
        slug: 'test',
        name: 'Test',
        theme: DEFAULT_THEME,
        seo: { title: 'Test' },
        navigation: {
          main: [
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about', external: false },
            { label: 'External', href: 'https://example.com', external: true },
          ],
          footer: [],
          showSocialLinks: true,
        },
      });

      expect(config.navigation.main).toHaveLength(3);
      expect(config.navigation.main[2]?.external).toBe(true);
    });
  });

  describe('createSiteConfig', () => {
    it('should create a config with required fields', () => {
      const config = createSiteConfig({
        slug: 'my-site',
        name: 'My Site',
        theme: DEFAULT_THEME,
        seo: { title: 'My Site' },
      });

      expect(config.slug).toBe('my-site');
      expect(config.name).toBe('My Site');
    });
  });

  describe('mergeSiteConfig', () => {
    it('should merge configurations', () => {
      const base = validateSiteConfig({
        slug: 'base',
        name: 'Base',
        theme: DEFAULT_THEME,
        seo: { title: 'Base' },
        features: { blog: true, newsletter: false },
      });

      const overrides = {
        name: 'Overridden',
        features: { newsletter: true },
      };

      const merged = mergeSiteConfig(base, overrides);

      expect(merged.slug).toBe('base');
      expect(merged.name).toBe('Overridden');
      expect(merged.features.blog).toBe(true);
      expect(merged.features.newsletter).toBe(true);
    });
  });

  describe('diffSiteConfig', () => {
    it('should detect differences between configs', () => {
      const oldConfig = validateSiteConfig({
        slug: 'test',
        name: 'Old Name',
        theme: DEFAULT_THEME,
        seo: { title: 'Test' },
      });

      const newConfig = validateSiteConfig({
        slug: 'test',
        name: 'New Name',
        theme: DEFAULT_THEME,
        seo: { title: 'Test' },
        locale: 'en',
      });

      const diff = diffSiteConfig(oldConfig, newConfig);

      expect(diff.name).toBe('New Name');
      expect(diff.locale).toBe('en');
      expect(diff.slug).toBeUndefined();
    });
  });

  describe('Templates', () => {
    it('should have all expected templates', () => {
      expect(Object.keys(SITE_TEMPLATES)).toContain('psychologist');
      expect(Object.keys(SITE_TEMPLATES)).toContain('holistic');
      expect(Object.keys(SITE_TEMPLATES)).toContain('medical');
      expect(Object.keys(SITE_TEMPLATES)).toContain('minimal');
    });

    it('should create valid config from template', () => {
      const config = createConfigFromTemplate('psychologist', {
        slug: 'my-practice',
        name: 'My Practice',
        seo: { title: 'My Practice - Psychologist' },
      });

      expect(config.slug).toBe('my-practice');
      expect(config.name).toBe('My Practice');
      expect(config.features?.appointments).toBe(true);
    });

    it('should apply template theme', () => {
      const config = createConfigFromTemplate('holistic', {
        slug: 'wellness',
        name: 'Wellness Center',
        seo: { title: 'Wellness' },
      });

      expect(config.theme?.colors?.light?.primary).toBe(COLOR_PALETTES.natural.primary);
    });
  });

  describe('Color Palettes', () => {
    it('should have all expected palettes', () => {
      const palettes = getAvailablePalettes();

      expect(palettes).toContain('calm');
      expect(palettes).toContain('natural');
      expect(palettes).toContain('warm');
      expect(palettes).toContain('modern');
      expect(palettes).toContain('serene');
    });

    it('should get palette by name', () => {
      const calm = getColorPalette('calm');

      expect(calm).toBeDefined();
      expect(calm?.primary).toBe('#4F46E5');
    });

    it('should return undefined for unknown palette', () => {
      const unknown = getColorPalette('unknown');
      expect(unknown).toBeUndefined();
    });

    it('should have valid hex colors', () => {
      for (const [, palette] of Object.entries(COLOR_PALETTES)) {
        expect(palette.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(palette.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(palette.foreground).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('ConfigLoader', () => {
    let memorySource: MemoryConfigSource;
    let loader: ConfigLoader;

    beforeEach(() => {
      memorySource = new MemoryConfigSource();
      loader = new ConfigLoader({
        sources: [memorySource],
        cacheTtlMs: 0, // Disable cache for tests
      });
    });

    it('should load configuration from source', async () => {
      memorySource.set('test-site', {
        name: 'Test Site from Memory',
        domain: 'test.example.com',
      });

      const config = await loader.load('test-site');

      expect(config.slug).toBe('test-site');
      expect(config.name).toBe('Test Site from Memory');
      expect(config.domain).toBe('test.example.com');
    });

    it('should apply defaults for missing fields', async () => {
      const config = await loader.load('new-site');

      expect(config.slug).toBe('new-site');
      expect(config.locale).toBe('fr');
      expect(config.features).toBeDefined();
    });

    it('should merge from multiple sources', async () => {
      const source1 = new MemoryConfigSource();
      const source2 = new MemoryConfigSource();

      source1.set('site', { name: 'Source 1' });
      source2.set('site', { domain: 'source2.com' });

      const multiLoader = new ConfigLoader({
        sources: [source1, source2],
        cacheTtlMs: 0,
      });

      const config = await multiLoader.load('site');

      expect(config.name).toBe('Source 1');
      expect(config.domain).toBe('source2.com');
    });

    it('should cache configuration', async () => {
      const cachedLoader = new ConfigLoader({
        sources: [memorySource],
        cacheTtlMs: 60000, // 1 minute
      });

      memorySource.set('cached', { name: 'Original' });

      const first = await cachedLoader.load('cached');
      expect(first.name).toBe('Original');

      // Update source
      memorySource.set('cached', { name: 'Updated' });

      // Should still return cached value
      const second = await cachedLoader.load('cached');
      expect(second.name).toBe('Original');

      // Invalidate cache
      cachedLoader.invalidate('cached');

      // Now should get updated value
      const third = await cachedLoader.load('cached');
      expect(third.name).toBe('Updated');
    });

    it('should save configuration', async () => {
      const config = validateSiteConfig({
        slug: 'saveable',
        name: 'Saveable',
        theme: DEFAULT_THEME,
        seo: { title: 'Saveable' },
      });

      await loader.save('saveable', config);

      const loaded = await loader.load('saveable');
      expect(loaded.name).toBe('Saveable');
    });
  });

  describe('EnvConfigSource', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should load config from environment variables', async () => {
      process.env.SITE_TEST_SITE_NAME = 'Env Test Site';
      process.env.SITE_TEST_SITE_DOMAIN = 'env.example.com';
      process.env.SITE_TEST_SITE_CONTACT_EMAIL = 'env@example.com';

      const source = new EnvConfigSource();
      const config = await source.load('test-site');

      expect(config?.name).toBe('Env Test Site');
      expect(config?.domain).toBe('env.example.com');
      expect(config?.contact?.email).toBe('env@example.com');
    });

    it('should return null when no env vars found', async () => {
      const source = new EnvConfigSource();
      const config = await source.load('nonexistent');

      expect(config).toBeNull();
    });
  });

  describe('createConfigLoader', () => {
    it('should create loader with default settings', () => {
      const loader = createConfigLoader();
      expect(loader).toBeInstanceOf(ConfigLoader);
    });

    it('should create loader with custom configs', () => {
      const loader = createConfigLoader({
        configs: {
          'my-site': { name: 'My Site' },
        },
      });

      expect(loader).toBeInstanceOf(ConfigLoader);
    });
  });

  describe('DEFAULT_THEME', () => {
    it('should have light colors', () => {
      expect(DEFAULT_THEME.colors.light).toBeDefined();
      expect(DEFAULT_THEME.colors.light.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should have typography settings', () => {
      expect(DEFAULT_THEME.typography.fontFamily.sans).toBeDefined();
      expect(DEFAULT_THEME.typography.fontSize.base).toBe('16px');
    });

    it('should have layout settings', () => {
      expect(DEFAULT_THEME.layout.maxWidth.content).toBe('1200px');
      expect(DEFAULT_THEME.layout.headerHeight).toBe('64px');
    });
  });

  describe('DEFAULT_NAVIGATION', () => {
    it('should have main navigation items', () => {
      expect(DEFAULT_NAVIGATION.main.length).toBeGreaterThan(0);
      expect(DEFAULT_NAVIGATION.main[0]?.label).toBe('Accueil');
      expect(DEFAULT_NAVIGATION.main[0]?.href).toBe('/');
    });

    it('should have footer sections', () => {
      expect(DEFAULT_NAVIGATION.footer.length).toBeGreaterThan(0);
    });
  });
});
