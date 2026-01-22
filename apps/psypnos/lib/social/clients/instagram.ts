// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Client pour l'API Instagram Graph
 *
 * Gère la publication sur les comptes Instagram Business/Creator
 * via l'API Facebook Graph (Instagram nécessite un compte business lié à une Page Facebook)
 */

import type { SocialClient, PublishPostInput, PublishResult, GetAnalyticsInput, AnalyticsResult } from './types';
import type { SocialPlatform } from '../types';
import { PLATFORM_SPECS } from '../types';
import { buildUrlWithUtm } from '../utm';

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class InstagramClient implements SocialClient {
  readonly platform: SocialPlatform = 'INSTAGRAM';

  /**
   * Publie un post sur Instagram
   *
   * Instagram nécessite un processus en 2 étapes :
   * 1. Créer un container média
   * 2. Publier le container
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, mediaUrls, hashtags, linkUrl, accessToken, accountMetadata } = input;

    // Instagram nécessite l'ID utilisateur Instagram
    const igUserId = accountMetadata?.igUserId;
    if (!igUserId) {
      return {
        success: false,
        error: 'ID utilisateur Instagram manquant dans les métadonnées',
      };
    }

    // Instagram requiert une image
    if (mediaUrls.length === 0) {
      return {
        success: false,
        error: 'Instagram requiert au moins une image pour publier',
      };
    }

    try {
      // Construire la caption avec le lien et les hashtags
      let caption = content;

      // Ajouter le lien vers l'article si présent
      // Note: Les liens ne sont pas cliquables sur Instagram, mais on les inclut
      // pour que les utilisateurs puissent les copier/coller ou retrouver l'article
      if (linkUrl) {
        const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
          source: 'INSTAGRAM',
          medium: 'social',
          content: linkUrl.includes('/blog/') ? 'blog' : linkUrl.includes('/seminars/') ? 'seminar' : undefined,
        });
        caption += '\n\n🔗 Article complet : ' + trackedLinkUrl;
      }

      if (hashtags.length > 0) {
        // Sur Instagram, les hashtags sont souvent séparés par des points
        caption += '\n.\n.\n.\n' + hashtags.map(h => `#${h}`).join(' ');
      }

      // Étape 1: Créer le container média
      const containerId = await this.createMediaContainer(
        igUserId,
        mediaUrls[0],
        caption,
        accessToken
      );

      if (!containerId) {
        return {
          success: false,
          error: 'Échec de la création du container média',
        };
      }

      // Attendre un peu que le média soit traité (Instagram peut prendre quelques secondes)
      await this.waitForMediaProcessing(igUserId, containerId, accessToken);

      // Étape 2: Publier le container
      return await this.publishMediaContainer(igUserId, containerId, accessToken);
    } catch (error) {
      console.error('[InstagramClient] Publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Crée un container média sur Instagram
   */
  private async createMediaContainer(
    igUserId: string,
    imageUrl: string,
    caption: string,
    accessToken: string
  ): Promise<string | null> {
    const url = `${GRAPH_API_BASE}/${igUserId}/media`;

    // L'URL de l'image doit être publiquement accessible
    const fullImageUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://psypnos.fr'}${imageUrl}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: fullImageUrl,
        caption,
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[InstagramClient] Container creation error:', data);
      return null;
    }

    return data.id || null;
  }

  /**
   * Attend que le média soit traité par Instagram
   */
  private async waitForMediaProcessing(
    igUserId: string,
    containerId: string,
    accessToken: string,
    maxAttempts = 10
  ): Promise<void> {
    const url = `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status_code === 'FINISHED') {
        return;
      }

      if (data.status_code === 'ERROR') {
        throw new Error('Erreur lors du traitement du média par Instagram');
      }

      // Attendre 2 secondes avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout: le média n\'a pas été traité à temps');
  }

  /**
   * Publie un container média
   */
  private async publishMediaContainer(
    igUserId: string,
    containerId: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${GRAPH_API_BASE}/${igUserId}/media_publish`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: containerId,
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

    // Récupérer le permalink
    const mediaId = data.id;
    let platformUrl: string | undefined;

    try {
      const permalinkResponse = await fetch(
        `${GRAPH_API_BASE}/${mediaId}?fields=permalink&access_token=${accessToken}`
      );
      const permalinkData = await permalinkResponse.json();
      platformUrl = permalinkData.permalink;
    } catch {
      // Pas critique si on ne peut pas récupérer le permalink
    }

    return {
      success: true,
      externalPostId: mediaId,
      platformUrl,
      rawResponse: data,
    };
  }

  /**
   * Récupère les analytics d'un post Instagram
   */
  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken } = input;

    try {
      // Récupérer les insights du média
      const insightsUrl = `${GRAPH_API_BASE}/${externalPostId}/insights`;
      const metrics = [
        'impressions',
        'reach',
        'engagement',
        'saved',
      ].join(',');

      const insightsResponse = await fetch(
        `${insightsUrl}?metric=${metrics}&access_token=${accessToken}`
      );

      const insightsData = await insightsResponse.json();

      // Récupérer les counts de base
      const mediaUrl = `${GRAPH_API_BASE}/${externalPostId}`;
      const mediaResponse = await fetch(
        `${mediaUrl}?fields=like_count,comments_count&access_token=${accessToken}`
      );

      const mediaData = await mediaResponse.json();

      // Extraire les métriques des insights
      const metricsMap: Record<string, number> = {};
      for (const metric of insightsData.data || []) {
        if (metric.values?.[0]?.value !== undefined) {
          metricsMap[metric.name] = metric.values[0].value;
        }
      }

      return {
        success: true,
        impressions: metricsMap['impressions'] || 0,
        reach: metricsMap['reach'] || 0,
        engagements: metricsMap['engagement'] || 0,
        likes: mediaData.like_count || 0,
        comments: mediaData.comments_count || 0,
        saves: metricsMap['saved'] || 0,
        shares: 0, // Instagram ne fournit pas cette métrique pour les posts
        rawData: { insights: insightsData, media: mediaData },
      };
    } catch (error) {
      console.error('[InstagramClient] Analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Valide le contenu pour Instagram
   */
  validateContent(content: string, hashtags: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const specs = PLATFORM_SPECS.INSTAGRAM;

    // Vérifier la longueur totale
    const hashtagsText = hashtags.length > 0
      ? '\n.\n.\n.\n' + hashtags.map(h => `#${h}`).join(' ')
      : '';
    const fullContent = content + hashtagsText;

    if (fullContent.length > specs.maxTextLength) {
      errors.push(`Le contenu dépasse la limite de ${specs.maxTextLength} caractères`);
    }

    // Vérifier les hashtags
    if (hashtags.length > specs.maxHashtags) {
      errors.push(`Maximum ${specs.maxHashtags} hashtags autorisés sur Instagram`);
    }

    if (hashtags.length > specs.optimalHashtags) {
      warnings.push(`${specs.optimalHashtags} hashtags recommandés pour un engagement optimal`);
    }

    if (hashtags.length < 5 && hashtags.length > 0) {
      warnings.push('Instagram fonctionne mieux avec 5-10 hashtags pertinents');
    }

    // Vérifier la première ligne
    const firstLine = content.split('\n')[0];
    if (firstLine.length > 125) {
      warnings.push('La première ligne sera tronquée - gardez l\'accroche courte');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
