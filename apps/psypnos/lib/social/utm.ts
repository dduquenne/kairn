/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Utilitaires pour les paramètres UTM de tracking
 *
 * Ajoute automatiquement les paramètres UTM aux URLs partagées
 * pour tracer la provenance des visiteurs depuis les réseaux sociaux.
 */

import type { SocialPlatform } from './types';

/**
 * Options pour la construction d'une URL avec paramètres UTM
 */
export interface UtmParams {
  /** Plateforme source (facebook, linkedin, instagram, twitter, threads) */
  source: SocialPlatform | string;
  /** Medium de la campagne (social, email, etc.) - défaut: 'social' */
  medium?: string;
  /** Nom de la campagne (optionnel, ex: slug article ou id séminaire) */
  campaign?: string;
  /** Contenu de la campagne (optionnel, ex: 'blog', 'seminar') */
  content?: string;
  /** Terme de recherche (rarement utilisé pour le social) */
  term?: string;
}

/**
 * Mapping des plateformes vers le nom de source UTM
 */
const PLATFORM_SOURCE_MAP: Record<SocialPlatform, string> = {
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  THREADS: 'threads',
};

/**
 * Construit une URL avec les paramètres UTM appropriés
 *
 * @param baseUrl - L'URL de base à enrichir (article de blog, page séminaire, etc.)
 * @param params - Les paramètres UTM à ajouter
 * @returns L'URL enrichie avec les paramètres UTM
 *
 * @example
 * ```ts
 * const url = buildUrlWithUtm('https://psypnos.fr/blog/mon-article', {
 *   source: 'FACEBOOK',
 *   campaign: 'mon-article',
 *   content: 'blog',
 * });
 * // => https://psypnos.fr/blog/mon-article?utm_source=facebook&utm_medium=social&utm_campaign=mon-article&utm_content=blog
 * ```
 */
export function buildUrlWithUtm(baseUrl: string, params: UtmParams): string {
  if (!baseUrl) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);

    // Source (obligatoire)
    const source = typeof params.source === 'string' && params.source in PLATFORM_SOURCE_MAP
      ? PLATFORM_SOURCE_MAP[params.source as SocialPlatform]
      : params.source.toLowerCase();
    url.searchParams.set('utm_source', source);

    // Medium (défaut: social)
    url.searchParams.set('utm_medium', params.medium || 'social');

    // Campaign (optionnel)
    if (params.campaign) {
      url.searchParams.set('utm_campaign', params.campaign);
    }

    // Content (optionnel)
    if (params.content) {
      url.searchParams.set('utm_content', params.content);
    }

    // Term (optionnel)
    if (params.term) {
      url.searchParams.set('utm_term', params.term);
    }

    return url.toString();
  } catch (error) {
    // Si l'URL n'est pas valide, retourner l'URL de base
    console.warn('[UTM] Invalid URL, returning base URL:', baseUrl, error);
    return baseUrl;
  }
}

/**
 * Construit une URL avec UTM pour un article de blog
 *
 * @param baseUrl - L'URL de l'article
 * @param platform - La plateforme de partage
 * @param blogSlug - Le slug de l'article (optionnel, utilisé pour la campagne)
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
 * Construit une URL avec UTM pour un séminaire
 *
 * @param baseUrl - L'URL du séminaire
 * @param platform - La plateforme de partage
 * @param seminarId - L'ID du séminaire (optionnel, utilisé pour la campagne)
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
 * Extrait les paramètres UTM d'une URL
 *
 * @param url - L'URL à analyser
 * @returns Les paramètres UTM trouvés dans l'URL
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
