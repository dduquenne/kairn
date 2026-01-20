/**
 * Site Configuration Module
 *
 * Complete configuration system for multi-tenant sites.
 */

// Schema and types
export {
  SiteConfigSchema,
  validateSiteConfig,
  safeParseSiteConfig,
  createSiteConfig,
  mergeSiteConfig,
  diffSiteConfig,
  type SiteConfig,
  type ThemeConfig,
  type ColorPalette,
  type FeaturesConfig,
  type SeoConfig,
  type ContactConfig,
  type IntegrationsConfig,
  type ContentConfig,
  type NavigationConfig,
  type NavigationItem,
  type LegalConfig,
} from './site-config';

// Defaults and templates
export {
  DEFAULT_THEME,
  DEFAULT_NAVIGATION,
  COLOR_PALETTES,
  SITE_TEMPLATES,
  createConfigFromTemplate,
  getAvailablePalettes,
  getColorPalette,
  type SiteTemplate,
} from './defaults';

// Configuration loading
export {
  ConfigLoader,
  MemoryConfigSource,
  EnvConfigSource,
  JsonObjectConfigSource,
  createConfigLoader,
  getConfigLoader,
  setConfigLoader,
  loadSiteConfig,
  type ConfigSource,
  type ConfigLoaderOptions,
} from './loader';
