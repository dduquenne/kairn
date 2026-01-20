/**
 * Configuration Loader
 *
 * Handles loading site configuration from various sources:
 * - JSON files
 * - Database
 * - Environment variables
 *
 * Supports configuration caching and hot-reloading in development.
 */

import {
  type SiteConfig,
  SiteConfigSchema,
  validateSiteConfig,
  mergeSiteConfig,
} from './site-config';
import { DEFAULT_THEME, DEFAULT_NAVIGATION } from './defaults';

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration source interface
 */
export interface ConfigSource {
  /** Load configuration for a site */
  load(siteSlug: string): Promise<Partial<SiteConfig> | null>;
  /** Save configuration (optional) */
  save?(siteSlug: string, config: SiteConfig): Promise<void>;
  /** Watch for changes (optional) */
  watch?(siteSlug: string, callback: (config: SiteConfig) => void): () => void;
}

/**
 * Configuration loader options
 */
export interface ConfigLoaderOptions {
  /** Configuration sources in priority order (last wins) */
  sources: ConfigSource[];
  /** Cache TTL in milliseconds (0 = no cache) */
  cacheTtlMs?: number;
  /** Enable hot-reloading in development */
  hotReload?: boolean;
}

/**
 * Cached configuration entry
 */
interface CachedConfig {
  config: SiteConfig;
  loadedAt: number;
}

// =============================================================================
// Configuration Loader
// =============================================================================

/**
 * Configuration loader that merges configs from multiple sources
 */
export class ConfigLoader {
  private sources: ConfigSource[];
  private cacheTtlMs: number;
  private cache: Map<string, CachedConfig> = new Map();
  private watchers: Map<string, () => void> = new Map();

  constructor(options: ConfigLoaderOptions) {
    this.sources = options.sources;
    this.cacheTtlMs = options.cacheTtlMs ?? 60000; // 1 minute default

    // Set up hot-reloading in development
    if (options.hotReload && process.env.NODE_ENV === 'development') {
      this.setupHotReload();
    }
  }

  /**
   * Load configuration for a site
   */
  async load(siteSlug: string): Promise<SiteConfig> {
    // Check cache
    const cached = this.cache.get(siteSlug);
    if (cached && this.isCacheValid(cached)) {
      return cached.config;
    }

    // Load from all sources
    let mergedConfig = this.getBaseConfig(siteSlug);

    for (const source of this.sources) {
      const partialConfig = await source.load(siteSlug);
      if (partialConfig) {
        mergedConfig = mergeSiteConfig(mergedConfig, partialConfig);
      }
    }

    // Validate final config
    const validatedConfig = validateSiteConfig(mergedConfig);

    // Cache the result
    this.cache.set(siteSlug, {
      config: validatedConfig,
      loadedAt: Date.now(),
    });

    return validatedConfig;
  }

  /**
   * Save configuration to the first source that supports saving
   */
  async save(siteSlug: string, config: SiteConfig): Promise<void> {
    // Validate before saving
    const validatedConfig = validateSiteConfig(config);

    // Find a source that supports saving
    for (const source of this.sources) {
      if (source.save) {
        await source.save(siteSlug, validatedConfig);
        // Invalidate cache
        this.cache.delete(siteSlug);
        return;
      }
    }

    throw new Error('No configuration source supports saving');
  }

  /**
   * Invalidate cached configuration
   */
  invalidate(siteSlug: string): void {
    this.cache.delete(siteSlug);
  }

  /**
   * Invalidate all cached configurations
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Get a base configuration with defaults
   */
  private getBaseConfig(siteSlug: string): SiteConfig {
    return SiteConfigSchema.parse({
      slug: siteSlug,
      name: siteSlug,
      theme: DEFAULT_THEME,
      seo: {
        title: siteSlug,
      },
      navigation: DEFAULT_NAVIGATION,
    });
  }

  /**
   * Check if cached config is still valid
   */
  private isCacheValid(cached: CachedConfig): boolean {
    if (this.cacheTtlMs === 0) return false;
    return Date.now() - cached.loadedAt < this.cacheTtlMs;
  }

  /**
   * Set up hot-reloading for development
   */
  private setupHotReload(): void {
    for (const source of this.sources) {
      if (source.watch) {
        // Watch all sites we've loaded
        for (const [siteSlug] of this.cache) {
          const unwatch = source.watch(siteSlug, (newConfig) => {
            this.cache.set(siteSlug, {
              config: newConfig,
              loadedAt: Date.now(),
            });
          });
          this.watchers.set(`${siteSlug}:${this.sources.indexOf(source)}`, unwatch);
        }
      }
    }
  }

  /**
   * Clean up watchers
   */
  destroy(): void {
    for (const unwatch of this.watchers.values()) {
      unwatch();
    }
    this.watchers.clear();
    this.cache.clear();
  }
}

// =============================================================================
// Built-in Configuration Sources
// =============================================================================

/**
 * In-memory configuration source (for testing/development)
 */
export class MemoryConfigSource implements ConfigSource {
  private configs: Map<string, Partial<SiteConfig>> = new Map();
  private listeners: Map<string, Set<(config: SiteConfig) => void>> = new Map();

  async load(siteSlug: string): Promise<Partial<SiteConfig> | null> {
    return this.configs.get(siteSlug) ?? null;
  }

  async save(siteSlug: string, config: SiteConfig): Promise<void> {
    this.configs.set(siteSlug, config);
    // Notify listeners
    const listeners = this.listeners.get(siteSlug);
    if (listeners) {
      for (const listener of listeners) {
        listener(config);
      }
    }
  }

  watch(siteSlug: string, callback: (config: SiteConfig) => void): () => void {
    if (!this.listeners.has(siteSlug)) {
      this.listeners.set(siteSlug, new Set());
    }
    this.listeners.get(siteSlug)!.add(callback);

    return () => {
      this.listeners.get(siteSlug)?.delete(callback);
    };
  }

  /**
   * Set configuration directly (for testing)
   */
  set(siteSlug: string, config: Partial<SiteConfig>): void {
    this.configs.set(siteSlug, config);
  }

  /**
   * Clear all configurations
   */
  clear(): void {
    this.configs.clear();
    this.listeners.clear();
  }
}

/**
 * Environment variable configuration source
 *
 * Maps environment variables to configuration values.
 * Useful for overriding specific settings in different environments.
 */
export class EnvConfigSource implements ConfigSource {
  private prefix: string;

  constructor(prefix: string = 'SITE_') {
    this.prefix = prefix;
  }

  async load(siteSlug: string): Promise<Partial<SiteConfig> | null> {
    const config: Partial<SiteConfig> = {};
    const sitePrefix = `${this.prefix}${siteSlug.toUpperCase().replace(/-/g, '_')}_`;

    // Map specific environment variables
    const mappings: Record<string, (value: string) => void> = {
      [`${sitePrefix}NAME`]: (v) => {
        config.name = v;
      },
      [`${sitePrefix}DOMAIN`]: (v) => {
        config.domain = v;
      },
      [`${sitePrefix}LOCALE`]: (v) => {
        config.locale = v;
      },
      [`${sitePrefix}GOOGLE_ANALYTICS_ID`]: (v) => {
        config.integrations = {
          ...config.integrations,
          googleAnalytics: {
            enabled: true,
            measurementId: v,
            anonymizeIp: true,
          },
        };
      },
      [`${sitePrefix}CONTACT_EMAIL`]: (v) => {
        config.contact = {
          ...config.contact,
          email: v,
        };
      },
      [`${sitePrefix}CONTACT_PHONE`]: (v) => {
        config.contact = {
          ...config.contact,
          phone: v,
        };
      },
    };

    for (const [envVar, setter] of Object.entries(mappings)) {
      const value = process.env[envVar];
      if (value) {
        setter(value);
      }
    }

    // Only return if we found any values
    return Object.keys(config).length > 0 ? config : null;
  }
}

/**
 * JSON object configuration source
 *
 * Loads configuration from a pre-loaded JSON object.
 * Useful for static site generation or when config is bundled.
 */
export class JsonObjectConfigSource implements ConfigSource {
  private configs: Record<string, Partial<SiteConfig>>;

  constructor(configs: Record<string, Partial<SiteConfig>>) {
    this.configs = configs;
  }

  async load(siteSlug: string): Promise<Partial<SiteConfig> | null> {
    return this.configs[siteSlug] ?? null;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a configuration loader with common sources
 */
export function createConfigLoader(options?: {
  configs?: Record<string, Partial<SiteConfig>>;
  useEnvOverrides?: boolean;
  cacheTtlMs?: number;
}): ConfigLoader {
  const sources: ConfigSource[] = [];

  // Add JSON config source if provided
  if (options?.configs) {
    sources.push(new JsonObjectConfigSource(options.configs));
  }

  // Add environment variable overrides
  if (options?.useEnvOverrides !== false) {
    sources.push(new EnvConfigSource());
  }

  return new ConfigLoader({
    sources,
    cacheTtlMs: options?.cacheTtlMs ?? 60000,
    hotReload: process.env.NODE_ENV === 'development',
  });
}

// =============================================================================
// Global Loader Instance
// =============================================================================

let globalLoader: ConfigLoader | null = null;

/**
 * Get the global configuration loader
 */
export function getConfigLoader(): ConfigLoader {
  if (!globalLoader) {
    globalLoader = createConfigLoader();
  }
  return globalLoader;
}

/**
 * Set a custom global configuration loader
 */
export function setConfigLoader(loader: ConfigLoader): void {
  globalLoader = loader;
}

/**
 * Load site configuration using the global loader
 */
export async function loadSiteConfig(siteSlug: string): Promise<SiteConfig> {
  return getConfigLoader().load(siteSlug);
}
