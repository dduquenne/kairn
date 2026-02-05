/**
 * Category Colors for Psypnos Blog
 *
 * Uses the shared category colors system from @kairn/config
 * with Psypnos-specific categories.
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
 * Psypnos-specific category colors
 * Categories are in French to match the blog content
 */
export const CATEGORY_COLORS = defineCategoryColors({
  Comprendre: COLOR_PRESETS.blue,
  Traverser: COLOR_PRESETS.green,
  Découvrir: COLOR_PRESETS.purple,
  Cheminer: COLOR_PRESETS.gold,
});

export type Category = keyof typeof CATEGORY_COLORS;

/**
 * Get colors for a category, falling back to gold (Cheminer)
 */
export const getCategoryColors = createCategoryColorGetter(
  CATEGORY_COLORS,
  COLOR_PRESETS.gold // Default fallback for Psypnos
);
