/**
 * @kairn/social/posting - Instagram Publisher
 *
 * Publishes content to Instagram Business/Creator accounts via Graph API.
 * Instagram requires a 2-step process: create media container, then publish.
 */

import type { SocialPlatform } from '../types';
import { PLATFORM_SPECS } from '../types';
import { buildUrlWithUtm } from '../utils/utm';

import type {
  SocialPublisher,
  PublishPostInput,
  PublishResult,
  GetAnalyticsInput,
  AnalyticsResult,
  GetAccountMetricsInput,
  AccountMetricsResult,
  ContentValidationResult,
} from './types';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class InstagramPublisher implements SocialPublisher {
  readonly platform: SocialPlatform = 'INSTAGRAM';
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || '';
  }

  /**
   * Publish a post to Instagram
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, mediaUrls, hashtags, linkUrl, accessToken, accountMetadata } = input;

    const igUserId = accountMetadata?.igUserId;
    if (!igUserId) {
      return {
        success: false,
        error: 'Instagram user ID missing in metadata',
      };
    }

    // Instagram requires an image
    if (mediaUrls.length === 0) {
      return {
        success: false,
        error: 'Instagram requires at least one image to publish',
      };
    }

    try {
      // Build caption with link and hashtags
      let caption = content;

      // Add link (not clickable on Instagram but included for discoverability)
      if (linkUrl) {
        const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
          source: 'INSTAGRAM',
          medium: 'social',
          content: linkUrl.includes('/blog/')
            ? 'blog'
            : linkUrl.includes('/seminars/')
              ? 'seminar'
              : undefined,
        });
        caption += '\n\n🔗 Full article: ' + trackedLinkUrl;
      }

      if (hashtags.length > 0) {
        // On Instagram, hashtags are often separated by dots
        caption += '\n.\n.\n.\n' + hashtags.map(h => `#${h}`).join(' ');
      }

      // Step 1: Create media container
      const imageUrl = mediaUrls[0];
      if (!imageUrl) {
        return {
          success: false,
          error: 'Media URL is required',
        };
      }

      const containerId = await this.createMediaContainer(igUserId, imageUrl, caption, accessToken);

      // Wait for media processing
      await this.waitForMediaProcessing(containerId, accessToken);

      // Step 2: Publish container
      return await this.publishMediaContainer(igUserId, containerId, accessToken);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Crée un media container Instagram via le Graph API.
   *
   * @param igUserId - Identifiant Instagram Business/Creator
   * @param imageUrl - URL publique de l'image
   * @param caption - Légende du post
   * @param accessToken - Token d'accès déchiffré
   * @throws Error si l'API retourne une erreur ou si l'ID est absent
   */
  private async createMediaContainer(
    igUserId: string,
    imageUrl: string,
    caption: string,
    accessToken: string
  ): Promise<string> {
    const url = `${GRAPH_API_BASE}/${igUserId}/media`;

    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: fullImageUrl,
        caption,
        access_token: accessToken,
      }),
    });

    const data = (await response.json()) as { id?: string; error?: { message?: string } };

    if (!response.ok) {
      console.error('[InstagramPublisher] Container creation error:', data);
      throw new Error(data.error?.message || `HTTP error ${response.status}`);
    }

    if (!data.id) {
      throw new Error('Instagram API returned no container ID');
    }

    return data.id;
  }

  private async waitForMediaProcessing(
    containerId: string,
    accessToken: string,
    maxAttempts = 10
  ): Promise<void> {
    const url = `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(url);
      const data = (await response.json()) as { status_code?: string };

      if (data.status_code === 'FINISHED') {
        return;
      }

      if (data.status_code === 'ERROR') {
        throw new Error('Instagram media processing failed');
      }

      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout: media was not processed in time');
  }

  private async publishMediaContainer(
    igUserId: string,
    containerId: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${GRAPH_API_BASE}/${igUserId}/media_publish`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    const data = (await response.json()) as { id?: string; error?: { message?: string } };

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP error ${response.status}`,
        rawResponse: data,
      };
    }

    // Get permalink
    const mediaId = data.id;
    let platformUrl: string | undefined;

    try {
      const permalinkResponse = await fetch(
        `${GRAPH_API_BASE}/${mediaId}?fields=permalink&access_token=${accessToken}`
      );
      const permalinkData = (await permalinkResponse.json()) as { permalink?: string };
      platformUrl = permalinkData.permalink;
    } catch {
      // Not critical
    }

    return {
      success: true,
      externalPostId: mediaId,
      platformUrl,
      rawResponse: data,
    };
  }

  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken } = input;

    try {
      const insightsUrl = `${GRAPH_API_BASE}/${externalPostId}/insights`;
      const metrics = ['impressions', 'reach', 'engagement', 'saved'].join(',');

      const insightsResponse = await fetch(
        `${insightsUrl}?metric=${metrics}&access_token=${accessToken}`
      );
      const insightsData = (await insightsResponse.json()) as {
        data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
      };

      const mediaUrl = `${GRAPH_API_BASE}/${externalPostId}`;
      const mediaResponse = await fetch(
        `${mediaUrl}?fields=like_count,comments_count&access_token=${accessToken}`
      );
      const mediaData = (await mediaResponse.json()) as {
        like_count?: number;
        comments_count?: number;
      };

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
        shares: 0, // Instagram doesn't provide this metric
        rawData: { insights: insightsData, media: mediaData },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAccountMetrics(input: GetAccountMetricsInput): Promise<AccountMetricsResult> {
    const { accessToken, platformId } = input;
    try {
      // Instagram Business/Creator account metrics via Graph API
      const url = `${GRAPH_API_BASE}/${platformId}?fields=followers_count,follows_count,media_count,name&access_token=${accessToken}`;
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `Instagram API error: ${response.status}` };
      }
      const data = (await response.json()) as Record<string, unknown>;
      return {
        success: true,
        followers: (data.followers_count as number) || 0,
        following: (data.follows_count as number) || 0,
        postsCount: (data.media_count as number) || 0,
        rawData: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validateContent(content: string, hashtags: string[]): ContentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const specs = PLATFORM_SPECS.INSTAGRAM;

    const hashtagsText =
      hashtags.length > 0 ? '\n.\n.\n.\n' + hashtags.map(h => `#${h}`).join(' ') : '';
    const fullContent = content + hashtagsText;

    if (fullContent.length > specs.maxTextLength) {
      errors.push(`Content exceeds the ${specs.maxTextLength} character limit`);
    }

    if (hashtags.length > specs.maxHashtags) {
      errors.push(`Maximum ${specs.maxHashtags} hashtags allowed on Instagram`);
    }

    if (hashtags.length > specs.optimalHashtags) {
      warnings.push(`${specs.optimalHashtags} hashtags recommended for optimal engagement`);
    }

    if (hashtags.length < 5 && hashtags.length > 0) {
      warnings.push('Instagram works better with 5-10 relevant hashtags');
    }

    const firstLine = content.split('\n')[0] ?? '';
    if (firstLine.length > 125) {
      warnings.push('First line will be truncated - keep the hook short');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
