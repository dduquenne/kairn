// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Client pour l'API Threads
 *
 * Gère la publication sur les comptes Threads
 * via l'API Threads (similaire à Instagram mais avec des endpoints dédiés)
 *
 * Contrairement à Instagram, Threads permet les posts texte sans image
 */

import type { SocialClient, PublishPostInput, PublishResult, GetAnalyticsInput, AnalyticsResult } from './types';
import type { SocialPlatform } from '../types';
import { PLATFORM_SPECS } from '../types';
import { buildUrlWithUtm } from '../utm';

const THREADS_API_VERSION = 'v1.0';
const THREADS_API_BASE = 'https://graph.threads.net';

export class ThreadsClient implements SocialClient {
  readonly platform: SocialPlatform = 'THREADS';

  /**
   * Publie un post sur Threads
   *
   * Threads utilise un processus en 2 étapes similaire à Instagram :
   * 1. Créer un container média (même pour les posts texte)
   * 2. Publier le container
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, mediaUrls, hashtags, linkUrl, accessToken, accountMetadata } = input;

    // Threads nécessite l'ID utilisateur
    const threadsUserId = accountMetadata?.threadsUserId;
    if (!threadsUserId) {
      return {
        success: false,
        error: 'ID utilisateur Threads manquant dans les métadonnées',
      };
    }

    try {
      // Construire le texte avec hashtags
      let text = content;
      if (hashtags.length > 0) {
        text += '\n\n' + hashtags.map(h => `#${h}`).join(' ');
      }

      // Ajouter le lien si présent avec les paramètres UTM pour le tracking
      if (linkUrl) {
        const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
          source: 'THREADS',
          medium: 'social',
          content: linkUrl.includes('/blog/') ? 'blog' : linkUrl.includes('/seminars/') ? 'seminar' : undefined,
        });
        text += '\n\n' + trackedLinkUrl;
      }

      // Étape 1: Créer le container
      const containerId = await this.createMediaContainer(
        threadsUserId,
        text,
        mediaUrls.length > 0 ? mediaUrls[0] : undefined,
        accessToken
      );

      if (!containerId) {
        return {
          success: false,
          error: 'Échec de la création du container média',
        };
      }

      // Attendre que le média soit traité
      await this.waitForMediaProcessing(containerId, accessToken);

      // Étape 2: Publier le container
      return await this.publishMediaContainer(threadsUserId, containerId, accessToken);
    } catch (error) {
      console.error('[ThreadsClient] Publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Crée un container média sur Threads
   */
  private async createMediaContainer(
    userId: string,
    text: string,
    imageUrl?: string,
    accessToken?: string
  ): Promise<string | null> {
    const url = `${THREADS_API_BASE}/${THREADS_API_VERSION}/${userId}/threads`;

    const body: Record<string, string> = {
      text,
      access_token: accessToken || '',
    };

    // Définir le type de média
    if (imageUrl) {
      body.media_type = 'IMAGE';
      // L'URL de l'image doit être publiquement accessible
      body.image_url = imageUrl.startsWith('http')
        ? imageUrl
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://psypnos.fr'}${imageUrl}`;
    } else {
      body.media_type = 'TEXT';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[ThreadsClient] Container creation error:', data);
      throw new Error(data.error?.message || `Erreur HTTP ${response.status}`);
    }

    return data.id || null;
  }

  /**
   * Attend que le média soit traité par Threads
   */
  private async waitForMediaProcessing(
    containerId: string,
    accessToken: string,
    maxAttempts = 10
  ): Promise<void> {
    const url = `${THREADS_API_BASE}/${THREADS_API_VERSION}/${containerId}?fields=status&access_token=${accessToken}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'FINISHED') {
        return;
      }

      if (data.status === 'ERROR') {
        throw new Error(data.error_message || 'Erreur lors du traitement du média par Threads');
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
    userId: string,
    containerId: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${THREADS_API_BASE}/${THREADS_API_VERSION}/${userId}/threads_publish`;

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
    const postId = data.id;
    let platformUrl: string | undefined;

    try {
      const permalinkResponse = await fetch(
        `${THREADS_API_BASE}/${THREADS_API_VERSION}/${postId}?fields=permalink&access_token=${accessToken}`
      );
      const permalinkData = await permalinkResponse.json();
      platformUrl = permalinkData.permalink;
    } catch {
      // Pas critique si on ne peut pas récupérer le permalink
    }

    return {
      success: true,
      externalPostId: postId,
      platformUrl,
      rawResponse: data,
    };
  }

  /**
   * Récupère les analytics d'un post Threads
   */
  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken } = input;

    try {
      // Récupérer les insights du thread
      const metrics = [
        'views',
        'likes',
        'replies',
        'reposts',
        'quotes',
      ].join(',');

      const insightsUrl = `${THREADS_API_BASE}/${THREADS_API_VERSION}/${externalPostId}/insights?metric=${metrics}&access_token=${accessToken}`;
      const insightsResponse = await fetch(insightsUrl);
      const insightsData = await insightsResponse.json();

      // Extraire les métriques des insights
      const metricsMap: Record<string, number> = {};
      for (const metric of insightsData.data || []) {
        if (metric.values?.[0]?.value !== undefined) {
          metricsMap[metric.name] = metric.values[0].value;
        }
      }

      return {
        success: true,
        impressions: metricsMap['views'] || 0,
        reach: metricsMap['views'] || 0, // Threads utilise "views" au lieu de reach
        likes: metricsMap['likes'] || 0,
        comments: metricsMap['replies'] || 0,
        shares: (metricsMap['reposts'] || 0) + (metricsMap['quotes'] || 0),
        engagements:
          (metricsMap['likes'] || 0) +
          (metricsMap['replies'] || 0) +
          (metricsMap['reposts'] || 0) +
          (metricsMap['quotes'] || 0),
        rawData: insightsData,
      };
    } catch (error) {
      console.error('[ThreadsClient] Analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Valide le contenu pour Threads
   */
  validateContent(content: string, hashtags: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const specs = PLATFORM_SPECS.THREADS;

    // Calculer la longueur totale
    const hashtagsText = hashtags.length > 0
      ? '\n\n' + hashtags.map(h => `#${h}`).join(' ')
      : '';
    const fullContent = content + hashtagsText;

    if (fullContent.length > specs.maxTextLength) {
      errors.push(`Le contenu dépasse la limite de ${specs.maxTextLength} caractères (actuellement ${fullContent.length})`);
    }

    // Minimum recommandé de 50 caractères pour un post Threads
    const minRecommendedLength = 50;
    if (fullContent.length < minRecommendedLength) {
      warnings.push(`Le contenu est court (${fullContent.length} caractères). Minimum recommandé: ${minRecommendedLength}`);
    }

    // Vérifier les hashtags
    if (hashtags.length > specs.maxHashtags) {
      errors.push(`Maximum ${specs.maxHashtags} hashtags autorisés sur Threads`);
    }

    if (hashtags.length > specs.optimalHashtags) {
      warnings.push(`Threads fonctionne mieux avec ${specs.optimalHashtags} hashtags ou moins`);
    }

    // Threads favorise un ton authentique et conversationnel
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 100) {
      warnings.push('Threads favorise les messages courts et percutants');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
