/**
 * @kairn/social/posting - Threads Publisher
 *
 * Publishes content to Threads via the Threads API.
 * Unlike Instagram, Threads allows text-only posts.
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

const THREADS_API_VERSION = 'v1.0';
const THREADS_API_BASE = 'https://graph.threads.net';

export class ThreadsPublisher implements SocialPublisher {
  readonly platform: SocialPlatform = 'THREADS';
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || '';
  }

  /**
   * Publish a post to Threads
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, mediaUrls, hashtags, linkUrl, accessToken, accountMetadata } = input;

    const threadsUserId = accountMetadata?.threadsUserId;
    if (!threadsUserId) {
      return {
        success: false,
        error: 'Threads user ID missing in metadata',
      };
    }

    try {
      // Build text with hashtags
      let text = content;
      if (hashtags.length > 0) {
        text += '\n\n' + hashtags.map(h => `#${h}`).join(' ');
      }

      // Add link with UTM tracking
      if (linkUrl) {
        const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
          source: 'THREADS',
          medium: 'social',
          content: linkUrl.includes('/blog/')
            ? 'blog'
            : linkUrl.includes('/seminars/')
              ? 'seminar'
              : undefined,
        });
        text += '\n\n' + trackedLinkUrl;
      }

      // Step 1: Create container
      const containerId = await this.createMediaContainer(
        threadsUserId,
        text,
        mediaUrls.length > 0 ? mediaUrls[0] : undefined,
        accessToken
      );

      if (!containerId) {
        return {
          success: false,
          error: 'Failed to create media container',
        };
      }

      // Wait for processing
      await this.waitForMediaProcessing(containerId, accessToken);

      // Step 2: Publish container
      return await this.publishMediaContainer(threadsUserId, containerId, accessToken);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

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

    if (imageUrl) {
      body.media_type = 'IMAGE';
      body.image_url = imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`;
    } else {
      body.media_type = 'TEXT';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { id?: string; error?: { message?: string } };

    if (!response.ok) {
      console.error('[ThreadsPublisher] Container creation error:', data);
      throw new Error(data.error?.message || `HTTP error ${response.status}`);
    }

    return data.id || null;
  }

  private async waitForMediaProcessing(
    containerId: string,
    accessToken: string,
    maxAttempts = 10
  ): Promise<void> {
    const url = `${THREADS_API_BASE}/${THREADS_API_VERSION}/${containerId}?fields=status&access_token=${accessToken}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(url);
      const data = (await response.json()) as { status?: string; error_message?: string };

      if (data.status === 'FINISHED') {
        return;
      }

      if (data.status === 'ERROR') {
        throw new Error(data.error_message || 'Threads media processing error');
      }

      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout: media was not processed in time');
  }

  private async publishMediaContainer(
    userId: string,
    containerId: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${THREADS_API_BASE}/${THREADS_API_VERSION}/${userId}/threads_publish`;

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
    const postId = data.id;
    let platformUrl: string | undefined;

    try {
      const permalinkResponse = await fetch(
        `${THREADS_API_BASE}/${THREADS_API_VERSION}/${postId}?fields=permalink&access_token=${accessToken}`
      );
      const permalinkData = (await permalinkResponse.json()) as { permalink?: string };
      platformUrl = permalinkData.permalink;
    } catch {
      // Not critical
    }

    return {
      success: true,
      externalPostId: postId,
      platformUrl,
      rawResponse: data,
    };
  }

  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken } = input;

    try {
      const metrics = ['views', 'likes', 'replies', 'reposts', 'quotes'].join(',');

      const insightsUrl = `${THREADS_API_BASE}/${THREADS_API_VERSION}/${externalPostId}/insights?metric=${metrics}&access_token=${accessToken}`;
      const insightsResponse = await fetch(insightsUrl);
      const insightsData = (await insightsResponse.json()) as {
        data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
      };

      const metricsMap: Record<string, number> = {};
      for (const metric of insightsData.data || []) {
        if (metric.values?.[0]?.value !== undefined) {
          metricsMap[metric.name] = metric.values[0].value;
        }
      }

      return {
        success: true,
        impressions: metricsMap['views'] || 0,
        reach: metricsMap['views'] || 0,
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAccountMetrics(input: GetAccountMetricsInput): Promise<AccountMetricsResult> {
    const { accessToken, platformId } = input;
    try {
      // Threads API — profile insights
      const url = `${THREADS_API_BASE}/${THREADS_API_VERSION}/${platformId}?fields=threads_profile_picture_url,threads_biography,followers_count&access_token=${accessToken}`;
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `Threads API error: ${response.status}` };
      }
      const data = await response.json();
      return {
        success: true,
        followers: data.followers_count || 0,
        following: 0, // Threads API doesn't expose following count
        postsCount: 0,
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
    const specs = PLATFORM_SPECS.THREADS;

    const hashtagsText = hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : '';
    const fullContent = content + hashtagsText;

    if (fullContent.length > specs.maxTextLength) {
      errors.push(
        `Content exceeds ${specs.maxTextLength} character limit (currently ${fullContent.length})`
      );
    }

    const minRecommendedLength = 50;
    if (fullContent.length < minRecommendedLength) {
      warnings.push(
        `Content is short (${fullContent.length} chars). Minimum recommended: ${minRecommendedLength}`
      );
    }

    if (hashtags.length > specs.maxHashtags) {
      errors.push(`Maximum ${specs.maxHashtags} hashtags allowed on Threads`);
    }

    if (hashtags.length > specs.optimalHashtags) {
      warnings.push(`Threads works better with ${specs.optimalHashtags} hashtags or less`);
    }

    const wordCount = content.split(/\s+/).length;
    if (wordCount > 100) {
      warnings.push('Threads favors short, punchy messages');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
