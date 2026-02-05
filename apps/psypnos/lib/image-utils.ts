/**
 * Image utilities for Next.js optimization
 *
 * Provides blur placeholders and image dimension constants
 * to prevent CLS (Cumulative Layout Shift).
 */

/**
 * Base64 blur placeholder for images
 * A subtle dark gradient that matches the site's theme
 */
export const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMGUxZjJmO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMWEyZjNmO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiLz48L3N2Zz4=';

/**
 * Gold-tinted blur placeholder
 */
export const BLUR_DATA_URL_GOLD =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMGUxZjJmO3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMxZDJiM2E7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNjN2E5NjI7c3RvcC1vcGFjaXR5OjAuMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIi8+PC9zdmc+';

/**
 * Standard image dimensions to prevent CLS
 */
export const IMAGE_DIMENSIONS = {
  // Profile/Avatar images
  avatar: { width: 200, height: 200 },
  avatarLarge: { width: 400, height: 400 },

  // Hero images
  hero: { width: 1920, height: 1080 },
  heroMobile: { width: 828, height: 1200 },

  // Blog images
  blogCard: { width: 800, height: 450 },
  blogFeatured: { width: 1200, height: 630 },
  blogThumbnail: { width: 400, height: 225 },

  // Seminar images
  seminarCard: { width: 640, height: 360 },
  seminarThumbnail: { width: 320, height: 180 },

  // Profile/About images
  profile: { width: 1029, height: 973 },
  cabinet: { width: 1200, height: 800 },

  // Infographic images
  infographic: { width: 600, height: 400 },
  infographicLarge: { width: 1200, height: 800 },

  // Social sharing
  ogImage: { width: 1200, height: 630 },
  twitterImage: { width: 1200, height: 600 },
} as const;

/**
 * Common aspect ratios
 */
export const ASPECT_RATIOS = {
  square: 1,
  landscape: 16 / 9,
  portrait: 9 / 16,
  wide: 21 / 9,
  standard: 4 / 3,
  golden: 1.618,
} as const;

/**
 * Get placeholder props for Next.js Image component
 */
export function getPlaceholderProps(variant: 'default' | 'gold' = 'default') {
  return {
    placeholder: 'blur' as const,
    blurDataURL: variant === 'gold' ? BLUR_DATA_URL_GOLD : BLUR_DATA_URL,
  };
}

/**
 * Get image props with blur placeholder and dimensions
 */
export function getImageProps(
  dimensionKey: keyof typeof IMAGE_DIMENSIONS,
  variant: 'default' | 'gold' = 'default'
) {
  const dimensions = IMAGE_DIMENSIONS[dimensionKey];
  return {
    ...dimensions,
    ...getPlaceholderProps(variant),
  };
}
