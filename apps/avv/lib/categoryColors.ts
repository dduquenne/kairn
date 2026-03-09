/**
 * Category Colors for Appréciez Votre Vie Blog
 *
 * Uses the shared category colors system from @kairn/config
 * with AVV-specific categories.
 */
import {
  defineCategoryColors,
  createCategoryColorGetter,
  COLOR_PRESETS,
  type CategoryColors,
  type CategoryColorScheme,
} from '@kairn/config';

// Re-export types for backwards compatibility
export type { CategoryColors, CategoryColorScheme };

/**
 * AVV-specific category colors
 * Categories are in French to match the blog content
 */
export const CATEGORY_COLORS = defineCategoryColors({
  Comprendre: COLOR_PRESETS.blue,
  Traverser: COLOR_PRESETS.green,
  Découvrir: COLOR_PRESETS.purple,
  Cheminer: COLOR_PRESETS.pink,
});

export type Category = keyof typeof CATEGORY_COLORS;

/**
 * Get colors for a category, falling back to pink (Cheminer)
 */
export const getCategoryColors = createCategoryColorGetter(
  CATEGORY_COLORS,
  COLOR_PRESETS.pink // Default fallback for AVV
);
