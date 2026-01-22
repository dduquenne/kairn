// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Client pour l'API Twitter/X v2
 *
 * Gère la publication de tweets sur les comptes Twitter/X
 * via l'API v2 de Twitter.
 *
 * L'API v2 utilise OAuth 2.0 avec des tokens Bearer.
 *
 * @see https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
 */

import type { SocialClient, PublishPostInput, PublishResult, GetAnalyticsInput, AnalyticsResult } from './types';
import type { SocialPlatform } from '../types';
import { PLATFORM_SPECS } from '../types';
import { buildUrlWithUtm } from '../utm';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

export class TwitterClient implements SocialClient {
  readonly platform: SocialPlatform = 'TWITTER';

  /**
   * Publie un tweet sur Twitter/X
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, hashtags, linkUrl, accessToken, accountMetadata } = input;

    try {
      // Construire le texte du tweet
      let text = content;

      // Ajouter les hashtags
      if (hashtags.length > 0) {
        const hashtagsText = hashtags.map(h => `#${h}`).join(' ');
        text += '\n\n' + hashtagsText;
      }

      // Ajouter le lien si présent avec les paramètres UTM pour le tracking
      if (linkUrl) {
        // Les URLs comptent pour 23 caractères sur Twitter (t.co shortening)
        const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
          source: 'TWITTER',
          medium: 'social',
          content: linkUrl.includes('/blog/') ? 'blog' : linkUrl.includes('/seminars/') ? 'seminar' : undefined,
        });
        text += '\n\n' + trackedLinkUrl;
      }

      // Vérifier la longueur
      const validation = this.validateContent(content, hashtags);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Publier le tweet
      const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.title || data.errors?.[0]?.message || `Erreur HTTP ${response.status}`;
        return {
          success: false,
          error: errorMessage,
          rawResponse: data,
        };
      }

      // Construire l'URL du tweet publié
      const tweetId = data.data?.id;

      // Utiliser le username des métadonnées pour une URL plus propre
      const username = accountMetadata?.twitterUsername;
      const platformUrl = tweetId
        ? username
          ? `https://twitter.com/${username}/status/${tweetId}`
          : `https://twitter.com/i/web/status/${tweetId}`
        : undefined;

      return {
        success: true,
        externalPostId: tweetId,
        platformUrl,
        rawResponse: data,
      };
    } catch (error) {
      console.error('[TwitterClient] Publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Récupère les analytics d'un tweet
   *
   * Note: Les métriques détaillées nécessitent un compte Twitter avec accès
   * aux analytics (Twitter Blue / Twitter API Pro)
   */
  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken } = input;

    try {
      // Récupérer les métriques publiques du tweet
      const metricsFields = [
        'public_metrics',
        'organic_metrics',
        'non_public_metrics',
      ].join(',');

      const response = await fetch(
        `${TWITTER_API_BASE}/tweets/${externalPostId}?tweet.fields=${metricsFields}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Les métriques non-publiques peuvent être inaccessibles
        if (response.status === 403) {
          // Essayer avec seulement les métriques publiques
          const publicResponse = await fetch(
            `${TWITTER_API_BASE}/tweets/${externalPostId}?tweet.fields=public_metrics`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            const metrics = publicData.data?.public_metrics || {};

            return {
              success: true,
              impressions: metrics.impression_count || 0,
              reach: metrics.impression_count || 0,
              likes: metrics.like_count || 0,
              comments: metrics.reply_count || 0,
              shares: metrics.retweet_count || 0,
              engagements:
                (metrics.like_count || 0) +
                (metrics.reply_count || 0) +
                (metrics.retweet_count || 0) +
                (metrics.quote_count || 0),
              rawData: publicData,
            };
          }
        }

        return {
          success: false,
          error: data.detail || data.title || `Erreur HTTP ${response.status}`,
        };
      }

      // Extraire les métriques
      const publicMetrics = data.data?.public_metrics || {};
      const organicMetrics = data.data?.organic_metrics || {};
      const nonPublicMetrics = data.data?.non_public_metrics || {};

      // Combiner les métriques
      const impressions =
        organicMetrics.impression_count ||
        nonPublicMetrics.impression_count ||
        publicMetrics.impression_count ||
        0;

      return {
        success: true,
        impressions,
        reach: impressions,
        likes: publicMetrics.like_count || 0,
        comments: publicMetrics.reply_count || 0,
        shares: publicMetrics.retweet_count || 0,
        clicks: nonPublicMetrics.url_link_clicks || 0,
        engagements:
          (publicMetrics.like_count || 0) +
          (publicMetrics.reply_count || 0) +
          (publicMetrics.retweet_count || 0) +
          (publicMetrics.quote_count || 0),
        rawData: data,
      };
    } catch (error) {
      console.error('[TwitterClient] Analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Valide le contenu pour Twitter
   *
   * Twitter a une limite stricte de 280 caractères.
   * Les URLs comptent pour 23 caractères (t.co shortening).
   */
  validateContent(content: string, hashtags: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const specs = PLATFORM_SPECS.TWITTER;

    // Calculer la longueur totale
    // Note: Les URLs sont raccourcies à 23 caractères par Twitter
    const hashtagsText = hashtags.length > 0
      ? '\n\n' + hashtags.map(h => `#${h}`).join(' ')
      : '';
    const fullContent = content + hashtagsText;

    // Calculer la longueur effective (en tenant compte du raccourcissement d'URL)
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = fullContent.match(urlRegex) || [];
    let effectiveLength = fullContent.length;

    // Chaque URL compte pour 23 caractères
    for (const url of urls) {
      effectiveLength = effectiveLength - url.length + 23;
    }

    if (effectiveLength > specs.maxTextLength) {
      errors.push(
        `Le tweet dépasse la limite de ${specs.maxTextLength} caractères (actuellement ${effectiveLength})`
      );
    }

    // Vérifier le nombre de hashtags
    if (hashtags.length > specs.maxHashtags) {
      errors.push(`Maximum ${specs.maxHashtags} hashtags sur Twitter`);
    }

    // Avertissements
    if (hashtags.length > specs.optimalHashtags) {
      warnings.push(`Twitter fonctionne mieux avec ${specs.optimalHashtags} hashtags ou moins`);
    }

    if (effectiveLength < 50) {
      warnings.push('Les tweets courts ont moins d\'engagement en général');
    }

    // Vérifier les mentions
    const mentions = content.match(/@[a-zA-Z0-9_]+/g) || [];
    if (mentions.length > 5) {
      warnings.push('Trop de mentions peuvent réduire la visibilité du tweet');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
