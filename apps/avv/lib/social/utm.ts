/**
 * UTM Parameter Utilities
 *
 * MIGRATION: Ce module réexporte depuis @kairn/social
 * pour mutualiser le code de gestion des paramètres UTM.
 */

export {
  buildUrlWithUtm,
  buildBlogUrlWithUtm,
  buildSeminarUrlWithUtm,
  extractUtmParams,
  type UtmParams,
} from '@kairn/social/utils';
