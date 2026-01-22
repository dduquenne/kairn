// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * ============================================================================
 * POINT D'ENTRÉE CENTRALISÉ POUR TOUTES LES CONFIGURATIONS
 * ============================================================================
 *
 * Ce fichier réexporte toutes les configurations du projet pour faciliter
 * les imports. Au lieu d'importer depuis plusieurs fichiers dispersés,
 * vous pouvez tout importer depuis @/lib/config
 *
 * Utilisation:
 * - import { BRAND_COLORS, getCategoryColors } from '@/lib/config'
 * - import { SITE_CONFIG } from '@/lib/config'
 * - import { API_ROUTES } from '@/lib/config'
 *
 * @module lib/config
 */

// ============================================================================
// RÉEXPORTS THÈME ET COULEURS
// ============================================================================
export {
  BRAND_COLORS,
  COLOR_PALETTE,
  THEME_DARK,
  THEME_LIGHT,
  CATEGORY_COLORS,
  getThemeConfig,
  getThemeColor,
  generateCSSVariables,
  getCategoryColors,
  type BlogCategory,
} from './theme';

// ============================================================================
// RÉEXPORTS CONFIGURATION DU SITE
// ============================================================================
export {
  SITE_CONFIG,
  getMetadataTitle,
  getOpenGraphConfig,
  getTwitterConfig,
  getJSONLDSchema,
  getBusinessHours,
  getFormattedAddress,
  getCanonicalUrl,
  type MetadataTitle,
} from './site';

// ============================================================================
// RÉEXPORTS REGISTRE API
// ============================================================================
export {
  API_ROUTES,
  getApiUrl,
  getApiDocumentation,
  getApiEndpoints,
  requiresAuthentication,
  type ApiRoute,
} from './api';
