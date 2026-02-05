/**
 * Category Colors Configuration
 *
 * Defines color schemes for blog/content categories.
 * Each site can define its own categories and extend the defaults.
 */
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Schema for a single category's color scheme
 */
export const categoryColorSchemeSchema = z.object({
  /** Background color (Tailwind class) */
  bg: z.string().describe('Background color class, e.g., "bg-blue-500/10"'),
  /** Text color (Tailwind class) */
  text: z.string().describe('Text color class, e.g., "text-blue-400"'),
  /** Border color (Tailwind class) */
  border: z.string().describe('Border color class, e.g., "border-blue-500/70"'),
  /** Hover state (Tailwind class) */
  hover: z.string().describe('Hover state class, e.g., "hover:border-blue-500/90"'),
  /** Gradient (Tailwind class) */
  gradient: z.string().describe('Gradient class, e.g., "from-blue-500/20 to-blue-500/5"'),
});

/**
 * Schema for category colors configuration
 * Keys are category names, values are color schemes
 */
export const categoryColorsSchema = z.record(z.string(), categoryColorSchemeSchema);

// ============================================================================
// TYPES
// ============================================================================

export type CategoryColorScheme = z.infer<typeof categoryColorSchemeSchema>;
export type CategoryColors = z.infer<typeof categoryColorsSchema>;

// ============================================================================
// DEFAULT COLOR SCHEMES
// ============================================================================

/**
 * Pre-defined color schemes that can be used for categories
 */
export const COLOR_PRESETS = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/70',
    hover: 'hover:border-blue-500/90',
    gradient: 'from-blue-500/20 to-blue-500/5',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/70',
    hover: 'hover:border-green-500/90',
    gradient: 'from-green-500/20 to-green-500/5',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/70',
    hover: 'hover:border-purple-500/90',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  gold: {
    bg: 'bg-gold/10',
    text: 'text-gold',
    border: 'border-gold/70',
    hover: 'hover:border-gold/90',
    gradient: 'from-gold/20 to-gold/5',
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/70',
    hover: 'hover:border-red-500/90',
    gradient: 'from-red-500/20 to-red-500/5',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/70',
    hover: 'hover:border-amber-500/90',
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  teal: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/70',
    hover: 'hover:border-teal-500/90',
    gradient: 'from-teal-500/20 to-teal-500/5',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/70',
    hover: 'hover:border-indigo-500/90',
    gradient: 'from-indigo-500/20 to-indigo-500/5',
  },
  pink: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/70',
    hover: 'hover:border-pink-500/90',
    gradient: 'from-pink-500/20 to-pink-500/5',
  },
  gray: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/70',
    hover: 'hover:border-gray-500/90',
    gradient: 'from-gray-500/20 to-gray-500/5',
  },
} as const satisfies Record<string, CategoryColorScheme>;

export type ColorPreset = keyof typeof COLOR_PRESETS;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Creates a category colors configuration with validation
 *
 * @example
 * ```typescript
 * const colors = defineCategoryColors({
 *   'Technology': COLOR_PRESETS.blue,
 *   'Design': COLOR_PRESETS.purple,
 *   'Business': COLOR_PRESETS.green,
 * });
 * ```
 */
export function defineCategoryColors(colors: CategoryColors): CategoryColors {
  return categoryColorsSchema.parse(colors);
}

/**
 * Gets the color scheme for a category, with a fallback
 *
 * @param colors - The category colors configuration
 * @param category - The category name to look up
 * @param fallback - The fallback color scheme (defaults to gray)
 *
 * @example
 * ```typescript
 * const scheme = getCategoryColorScheme(myColors, 'Unknown', COLOR_PRESETS.gray);
 * ```
 */
export function getCategoryColorScheme(
  colors: CategoryColors,
  category: string,
  fallback: CategoryColorScheme = COLOR_PRESETS.gray
): CategoryColorScheme {
  return colors[category] ?? fallback;
}

/**
 * Creates a getCategoryColors function bound to a specific configuration
 *
 * @param colors - The category colors configuration
 * @param fallback - The fallback color scheme
 *
 * @example
 * ```typescript
 * const getCategoryColors = createCategoryColorGetter(myColors, COLOR_PRESETS.gold);
 *
 * // In component:
 * const colors = getCategoryColors(post.category);
 * ```
 */
export function createCategoryColorGetter(
  colors: CategoryColors,
  fallback: CategoryColorScheme = COLOR_PRESETS.gray
): (category: string) => CategoryColorScheme {
  return (category: string) => getCategoryColorScheme(colors, category, fallback);
}

/**
 * Merges multiple category color configurations
 * Later configurations override earlier ones
 *
 * @example
 * ```typescript
 * const merged = mergeCategoryColors(defaultColors, siteSpecificColors);
 * ```
 */
export function mergeCategoryColors(...configs: CategoryColors[]): CategoryColors {
  return configs.reduce((acc, config) => ({ ...acc, ...config }), {});
}
