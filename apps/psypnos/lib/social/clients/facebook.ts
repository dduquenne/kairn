// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Client pour l'API Facebook Graph
 *
 * Gère la publication sur les Pages Facebook via Graph API v18.0
 */

import type { SocialClient, PublishPostInput, PublishResult, GetAnalyticsInput, AnalyticsResult } from './types';
import type { SocialPlatform } from '../types';
import { PLATFORM_SPECS } from '../types';
import { buildUrlWithUtm } from '../utm';

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class FacebookClient implements SocialClient {
  readonly platform: SocialPlatform = 'FACEBOOK';

  /**
   * Publie un post sur une Page Facebook
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, mediaUrls, hashtags, linkUrl, accessToken, accountMetadata } = input;

    // On a besoin du Page ID pour publier
    const pageId = accountMetadata?.pageId;
    if (!pageId) {
      return {
        success: false,
        error: 'Page ID manquant dans les métadonnées du compte',
      };
    }

    try {
      // Construire le message avec hashtags
      let message = content;
      if (hashtags.length > 0) {
        message += '\n\n' + hashtags.map(h => `#${h}`).join(' ');
      }

      // Décider du type de publication
      if (mediaUrls.length > 0) {
        // Publication avec image - on passe aussi le lien pour l'inclure dans le caption
        return await this.publishWithPhoto(pageId, message, mediaUrls[0], linkUrl ?? undefined, accessToken);
      } else if (linkUrl) {
        // Publication avec lien (génère un aperçu Open Graph)
        return await this.publishWithLink(pageId, message, linkUrl, accessToken);
      } else {
        // Publication texte simple
        return await this.publishText(pageId, message, accessToken);
      }
    } catch (error) {
      console.error('[FacebookClient] Publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Publication texte simple
   */
  private async publishText(
    pageId: string,
    message: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${GRAPH_API_BASE}/${pageId}/feed`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `Erreur HTTP ${response.status}`,
        rawResponse: data,
      };
    }

    return {
      success: true,
      externalPostId: data.id,
      platformUrl: `https://facebook.com/${data.id}`,
      rawResponse: data,
    };
  }

  /**
   * Publication avec lien
   */
  private async publishWithLink(
    pageId: string,
    message: string,
    linkUrl: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${GRAPH_API_BASE}/${pageId}/feed`;

    // Ajouter les paramètres UTM au lien pour le tracking
    const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
      source: 'FACEBOOK',
      medium: 'social',
      content: linkUrl.includes('/blog/') ? 'blog' : linkUrl.includes('/seminars/') ? 'seminar' : undefined,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        link: trackedLinkUrl,
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `Erreur HTTP ${response.status}`,
        rawResponse: data,
      };
    }

    return {
      success: true,
      externalPostId: data.id,
      platformUrl: `https://facebook.com/${data.id}`,
      rawResponse: data,
    };
  }

  /**
   * Publication avec photo
   * Note: L'API Facebook /photos ne supporte pas de lien cliquable séparé,
   * donc on inclut le lien dans le caption pour qu'il soit visible et cliquable
   */
  private async publishWithPhoto(
    pageId: string,
    caption: string,
    imageUrl: string,
    linkUrl: string | undefined,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${GRAPH_API_BASE}/${pageId}/photos`;

    // L'URL de l'image doit être publiquement accessible
    const fullImageUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://psypnos.fr'}${imageUrl}`;

    // Construire le caption avec le lien si fourni
    // Le lien est ajouté à la fin du caption pour qu'il soit cliquable
    let finalCaption = caption;
    if (linkUrl) {
      const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
        source: 'FACEBOOK',
        medium: 'social',
        content: linkUrl.includes('/blog/') ? 'blog' : linkUrl.includes('/seminars/') ? 'seminar' : undefined,
      });
      finalCaption += `\n\n🔗 ${trackedLinkUrl}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fullImageUrl,
        caption: finalCaption,
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `Erreur HTTP ${response.status}`,
        rawResponse: data,
      };
    }

    // Pour les photos, l'ID retourné est celui de la photo
    // On peut construire l'URL du post
    return {
      success: true,
      externalPostId: data.id,
      platformUrl: `https://facebook.com/${data.post_id || data.id}`,
      rawResponse: data,
    };
  }

  /**
   * Récupère les analytics d'un post
   */
  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken } = input;

    try {
      // Récupérer les insights du post
      const insightsUrl = `${GRAPH_API_BASE}/${externalPostId}/insights`;
      const metrics = [
        'post_impressions',
        'post_impressions_unique',
        'post_engaged_users',
        'post_clicks',
        'post_reactions_like_total',
      ].join(',');

      const response = await fetch(
        `${insightsUrl}?metric=${metrics}&access_token=${accessToken}`
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `Erreur HTTP ${response.status}`,
        };
      }

      // Extraire les métriques
      const metricsMap: Record<string, number> = {};
      for (const metric of data.data || []) {
        if (metric.values?.[0]?.value !== undefined) {
          metricsMap[metric.name] = metric.values[0].value;
        }
      }

      // Récupérer aussi les réactions/commentaires/partages
      const engagementUrl = `${GRAPH_API_BASE}/${externalPostId}`;
      const engagementResponse = await fetch(
        `${engagementUrl}?fields=shares,comments.summary(true),reactions.summary(true)&access_token=${accessToken}`
      );

      const engagementData = await engagementResponse.json();

      return {
        success: true,
        impressions: metricsMap['post_impressions'] || 0,
        reach: metricsMap['post_impressions_unique'] || 0,
        engagements: metricsMap['post_engaged_users'] || 0,
        clicks: metricsMap['post_clicks'] || 0,
        likes: engagementData.reactions?.summary?.total_count || metricsMap['post_reactions_like_total'] || 0,
        comments: engagementData.comments?.summary?.total_count || 0,
        shares: engagementData.shares?.count || 0,
        rawData: { insights: data, engagement: engagementData },
      };
    } catch (error) {
      console.error('[FacebookClient] Analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Valide le contenu pour Facebook
   */
  validateContent(content: string, hashtags: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const specs = PLATFORM_SPECS.FACEBOOK;

    // Vérifier la longueur totale
    const fullContent = content + (hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : '');

    if (fullContent.length > specs.maxTextLength) {
      errors.push(`Le contenu dépasse la limite de ${specs.maxTextLength} caractères`);
    }

    // Vérifier les hashtags
    if (hashtags.length > specs.maxHashtags) {
      warnings.push(`Facebook recommande ${specs.optimalHashtags} hashtags maximum`);
    }

    // Vérifier la longueur optimale
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    if (wordCount > specs.optimalTextLength * 2) {
      warnings.push(`Le texte est plus long que la longueur optimale (${specs.optimalTextLength} mots recommandés)`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
