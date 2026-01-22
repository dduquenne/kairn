/**
 * @kairn/social - UTM Parameter Utilities
 *
 * Automatically adds UTM tracking parameters to URLs shared on social media.
 */

import type { SocialPlatform } from '../types';

/**
 * UTM parameter options
 */
export interface UtmParams {
  /** Source platform (facebook, linkedin, instagram, twitter, threads) */
  source: string;
  /** Campaign medium (default: 'social') */
  medium?: string;
  /** Campaign name (optional, e.g., article slug or seminar ID) */
  campaign?: string;
  /** Campaign content (optional, e.g., 'blog', 'seminar') */
  content?: string;
  /** Search term (rarely used for social) */
  term?: string;
}

/**
 * Platform to UTM source name mapping
 */
const PLATFORM_SOURCE_MAP: Record<SocialPlatform, string> = {
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  THREADS: 'threads',
};

/**
 * Build a URL with UTM parameters
 *
 * @param baseUrl - The base URL to enrich
 * @param params - UTM parameters to add
 * @returns URL with UTM parameters
 *
 * @example
 * ```ts
 * const url = buildUrlWithUtm('https://example.com/blog/article', {
 *   source: 'FACEBOOK',
 *   campaign: 'my-article',
 *   content: 'blog',
 * });
 * // => https://example.com/blog/article?utm_source=facebook&utm_medium=social&utm_campaign=my-article&utm_content=blog
 * ```
 */
export function buildUrlWithUtm(baseUrl: string, params: UtmParams): string {
  if (!baseUrl) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);

    // Source (required)
    const source =
      typeof params.source === 'string' && params.source in PLATFORM_SOURCE_MAP
        ? PLATFORM_SOURCE_MAP[params.source as SocialPlatform]
        : params.source.toLowerCase();
    url.searchParams.set('utm_source', source);

    // Medium (default: social)
    url.searchParams.set('utm_medium', params.medium || 'social');

    // Campaign (optional)
    if (params.campaign) {
      url.searchParams.set('utm_campaign', params.campaign);
    }

    // Content (optional)
    if (params.content) {
      url.searchParams.set('utm_content', params.content);
    }

    // Term (optional)
    if (params.term) {
      url.searchParams.set('utm_term', params.term);
    }

    return url.toString();
  } catch {
    // If URL is invalid, return base URL
    return baseUrl;
  }
}

/**
 * Build URL with UTM for a blog article
 *
 * @param baseUrl - Article URL
 * @param platform - Sharing platform
 * @param blogSlug - Article slug (optional, used for campaign)
 */
export function buildBlogUrlWithUtm(
  baseUrl: string,
  platform: SocialPlatform,
  blogSlug?: string
): string {
  return buildUrlWithUtm(baseUrl, {
    source: platform,
    medium: 'social',
    campaign: blogSlug || undefined,
    content: 'blog',
  });
}

/**
 * Build URL with UTM for a seminar
 *
 * @param baseUrl - Seminar URL
 * @param platform - Sharing platform
 * @param seminarId - Seminar ID (optional, used for campaign)
 */
export function buildSeminarUrlWithUtm(
  baseUrl: string,
  platform: SocialPlatform,
  seminarId?: string
): string {
  return buildUrlWithUtm(baseUrl, {
    source: platform,
    medium: 'social',
    campaign: seminarId ? `seminar-${seminarId}` : undefined,
    content: 'seminar',
  });
}

/**
 * Extract UTM parameters from a URL
 *
 * @param url - URL to analyze
 * @returns Extracted UTM parameters
 */
export function extractUtmParams(url: string): Partial<UtmParams> {
  try {
    const urlObj = new URL(url);
    const params: Partial<UtmParams> = {};

    const source = urlObj.searchParams.get('utm_source');
    if (source) params.source = source;

    const medium = urlObj.searchParams.get('utm_medium');
    if (medium) params.medium = medium;

    const campaign = urlObj.searchParams.get('utm_campaign');
    if (campaign) params.campaign = campaign;

    const content = urlObj.searchParams.get('utm_content');
    if (content) params.content = content;

    const term = urlObj.searchParams.get('utm_term');
    if (term) params.term = term;

    return params;
  } catch {
    return {};
  }
}
