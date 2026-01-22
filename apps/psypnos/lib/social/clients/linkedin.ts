// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Client pour l'API LinkedIn
 *
 * Gère la publication sur les profils et pages LinkedIn via l'API v2
 */

import type { SocialClient, PublishPostInput, PublishResult, GetAnalyticsInput, AnalyticsResult } from './types';
import type { SocialPlatform } from '../types';
import { PLATFORM_SPECS } from '../types';
import { buildUrlWithUtm } from '../utm';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export class LinkedInClient implements SocialClient {
  readonly platform: SocialPlatform = 'LINKEDIN';

  /**
   * Publie un post sur LinkedIn
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, hashtags, linkUrl, accessToken, accountMetadata } = input;

    // Déterminer l'auteur (personne ou organisation)
    const personId = accountMetadata?.personId;
    const organizationId = accountMetadata?.organizationId;

    if (!personId && !organizationId) {
      return {
        success: false,
        error: 'ID de personne ou d\'organisation manquant',
      };
    }

    const author = organizationId
      ? `urn:li:organization:${organizationId}`
      : `urn:li:person:${personId}`;

    try {
      // Construire le contenu avec hashtags
      let fullContent = content;
      if (hashtags.length > 0) {
        fullContent += '\n\n' + hashtags.map(h => `#${h}`).join(' ');
      }

      // Pour LinkedIn, le lien est souvent mis en commentaire
      // Mais on peut aussi le mettre dans le post avec aperçu
      if (linkUrl) {
        return await this.publishWithArticle(author, fullContent, linkUrl, accessToken);
      } else {
        return await this.publishText(author, fullContent, accessToken);
      }
    } catch (error) {
      console.error('[LinkedInClient] Publish error:', error);
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
    author: string,
    content: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${LINKEDIN_API_BASE}/ugcPosts`;

    const body = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Erreur HTTP ${response.status}`,
        rawResponse: data,
      };
    }

    // L'ID du post est dans le header X-RestLi-Id ou dans la réponse
    const postId = response.headers.get('x-restli-id') || data.id;
    const activityUrn = postId?.replace('urn:li:share:', 'urn:li:activity:');

    return {
      success: true,
      externalPostId: postId,
      platformUrl: activityUrn
        ? `https://www.linkedin.com/feed/update/${activityUrn}`
        : undefined,
      rawResponse: data,
    };
  }

  /**
   * Publication avec article/lien
   */
  private async publishWithArticle(
    author: string,
    content: string,
    linkUrl: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${LINKEDIN_API_BASE}/ugcPosts`;

    // Ajouter les paramètres UTM au lien pour le tracking
    const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
      source: 'LINKEDIN',
      medium: 'social',
      content: linkUrl.includes('/blog/') ? 'blog' : linkUrl.includes('/seminars/') ? 'seminar' : undefined,
    });

    const body = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              originalUrl: trackedLinkUrl,
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    // LinkedIn peut retourner 201 Created avec un body vide
    let data: Record<string, unknown> = {};
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // Body vide, c'est OK
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: (data as { message?: string }).message || `Erreur HTTP ${response.status}`,
        rawResponse: data,
      };
    }

    const postId = response.headers.get('x-restli-id') || (data as { id?: string }).id;
    const activityUrn = postId?.replace('urn:li:share:', 'urn:li:activity:');

    return {
      success: true,
      externalPostId: postId || undefined,
      platformUrl: activityUrn
        ? `https://www.linkedin.com/feed/update/${activityUrn}`
        : undefined,
      rawResponse: data,
    };
  }

  /**
   * Récupère les analytics d'un post LinkedIn
   */
  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken, accountMetadata } = input;

    try {
      // LinkedIn nécessite des permissions spéciales pour les analytics
      // et utilise des endpoints différents selon le type de compte

      const organizationId = accountMetadata?.organizationId;

      if (organizationId) {
        // Analytics pour les pages d'organisation
        return await this.getOrganizationPostAnalytics(
          externalPostId,
          organizationId,
          accessToken
        );
      } else {
        // Pour les profils personnels, les analytics sont limités
        // On retourne des données de base
        return {
          success: true,
          impressions: 0,
          reach: 0,
          engagements: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          rawData: { note: 'Analytics limités pour les profils personnels' },
        };
      }
    } catch (error) {
      console.error('[LinkedInClient] Analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Analytics pour les posts d'organisation
   */
  private async getOrganizationPostAnalytics(
    postId: string,
    organizationId: string,
    accessToken: string
  ): Promise<AnalyticsResult> {
    // Convertir le share URN en activity URN si nécessaire
    const activityUrn = postId.includes('share')
      ? postId.replace('share', 'activity')
      : postId;

    const url = `${LINKEDIN_API_BASE}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}&shares[0]=${activityUrn}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Erreur HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    const stats = data.elements?.[0]?.totalShareStatistics;

    if (!stats) {
      return {
        success: true,
        rawData: data,
      };
    }

    return {
      success: true,
      impressions: stats.impressionCount || 0,
      reach: stats.uniqueImpressionsCount || 0,
      engagements: stats.engagement || 0,
      likes: stats.likeCount || 0,
      comments: stats.commentCount || 0,
      shares: stats.shareCount || 0,
      clicks: stats.clickCount || 0,
      rawData: data,
    };
  }

  /**
   * Valide le contenu pour LinkedIn
   */
  validateContent(content: string, hashtags: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const specs = PLATFORM_SPECS.LINKEDIN;

    // Vérifier la longueur totale
    const fullContent = content + (hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : '');

    if (fullContent.length > specs.maxTextLength) {
      errors.push(`Le contenu dépasse la limite de ${specs.maxTextLength} caractères`);
    }

    // Vérifier les hashtags
    if (hashtags.length > specs.maxHashtags) {
      errors.push(`Maximum ${specs.maxHashtags} hashtags autorisés`);
    }

    if (hashtags.length > specs.optimalHashtags) {
      warnings.push(`LinkedIn recommande ${specs.optimalHashtags} hashtags pour un engagement optimal`);
    }

    // Vérifier la première ligne (hook)
    const firstLine = content.split('\n')[0];
    if (firstLine.length > 150) {
      warnings.push('La première ligne est longue - elle sera tronquée avant "voir plus"');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
