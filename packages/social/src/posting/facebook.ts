/**
 * @kairn/social/posting - Facebook Publisher
 *
 * Publishes content to Facebook Pages via Graph API.
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

export class FacebookPublisher implements SocialPublisher {
  readonly platform: SocialPlatform = 'FACEBOOK';
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || '';
  }

  /**
   * Publish a post to a Facebook Page
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, mediaUrls, hashtags, linkUrl, accessToken, accountMetadata } = input;

    const pageId = accountMetadata?.pageId;
    if (!pageId) {
      return {
        success: false,
        error: 'Page ID missing in account metadata',
      };
    }

    try {
      // Build message with hashtags
      const safeHashtags = hashtags ?? [];
      let message = content;
      if (safeHashtags.length > 0) {
        message += '\n\n' + safeHashtags.map(h => `#${h}`).join(' ');
      }

      // Resolve and validate image URL before choosing publication type
      const resolvedImageUrl = this.resolveImageUrl(mediaUrls[0]);

      // Decide publication type
      if (resolvedImageUrl) {
        return await this.publishWithPhoto(pageId, message, resolvedImageUrl, linkUrl, accessToken);
      } else if (linkUrl) {
        return await this.publishWithLink(pageId, message, linkUrl, accessToken);
      } else {
        return await this.publishText(pageId, message, accessToken);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Resolve a media URL to an absolute HTTP(S) URL and validate it.
   * Returns the resolved URL if valid, or null if invalid/missing.
   *
   * @param rawUrl - Raw media URL (absolute or relative path)
   */
  private resolveImageUrl(rawUrl: string | undefined): string | null {
    if (!rawUrl) {
      return null;
    }

    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${this.baseUrl}${rawUrl}`;

    try {
      const parsed = new URL(fullUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return fullUrl;
      }
    } catch {
      // URL parsing failed — invalid format
    }

    console.warn(
      `[FacebookPublisher] Invalid image URL skipped (falling back to text post): ${fullUrl}`
    );
    return null;
  }

  private async publishText(
    pageId: string,
    message: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${GRAPH_API_BASE}/${pageId}/feed`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: accessToken }),
    });

    const data = (await response.json()) as { id?: string; error?: { message?: string } };

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP error ${response.status}`,
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

  private async publishWithLink(
    pageId: string,
    message: string,
    linkUrl: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${GRAPH_API_BASE}/${pageId}/feed`;

    const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
      source: 'FACEBOOK',
      medium: 'social',
      content: linkUrl.includes('/blog/')
        ? 'blog'
        : linkUrl.includes('/seminars/')
          ? 'seminar'
          : undefined,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, link: trackedLinkUrl, access_token: accessToken }),
    });

    const data = (await response.json()) as { id?: string; error?: { message?: string } };

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP error ${response.status}`,
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
   * Publish a photo post to a Facebook Page.
   *
   * @param pageId - Facebook Page ID
   * @param caption - Post caption text (already includes hashtags)
   * @param resolvedImageUrl - Fully resolved and validated absolute image URL
   * @param linkUrl - Optional article link to append to caption
   * @param accessToken - Facebook Page access token
   */
  private async publishWithPhoto(
    pageId: string,
    caption: string,
    resolvedImageUrl: string,
    linkUrl: string | null,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${GRAPH_API_BASE}/${pageId}/photos`;

    // Add link to caption since photos don't support separate link
    let finalCaption = caption;
    if (linkUrl) {
      const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
        source: 'FACEBOOK',
        medium: 'social',
        content: linkUrl.includes('/blog/')
          ? 'blog'
          : linkUrl.includes('/seminars/')
            ? 'seminar'
            : undefined,
      });
      finalCaption += `\n\n🔗 ${trackedLinkUrl}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: resolvedImageUrl,
        caption: finalCaption,
        access_token: accessToken,
      }),
    });

    const data = (await response.json()) as {
      id?: string;
      post_id?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP error ${response.status}`,
        rawResponse: data,
      };
    }

    return {
      success: true,
      externalPostId: data.id,
      platformUrl: `https://facebook.com/${data.post_id || data.id}`,
      rawResponse: data,
    };
  }

  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken } = input;

    try {
      const insightsUrl = `${GRAPH_API_BASE}/${externalPostId}/insights`;
      const metrics = [
        'post_impressions',
        'post_impressions_unique',
        'post_engaged_users',
        'post_clicks',
        'post_reactions_like_total',
      ].join(',');

      const response = await fetch(`${insightsUrl}?metric=${metrics}&access_token=${accessToken}`);
      const data = (await response.json()) as {
        data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
        error?: { message?: string };
      };

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `HTTP error ${response.status}`,
        };
      }

      const metricsMap: Record<string, number> = {};
      for (const metric of data.data || []) {
        if (metric.values?.[0]?.value !== undefined) {
          metricsMap[metric.name] = metric.values[0].value;
        }
      }

      const engagementUrl = `${GRAPH_API_BASE}/${externalPostId}`;
      const engagementResponse = await fetch(
        `${engagementUrl}?fields=shares,comments.summary(true),reactions.summary(true)&access_token=${accessToken}`
      );
      const engagementData = (await engagementResponse.json()) as {
        shares?: { count?: number };
        comments?: { summary?: { total_count?: number } };
        reactions?: { summary?: { total_count?: number } };
      };

      return {
        success: true,
        impressions: metricsMap['post_impressions'] || 0,
        reach: metricsMap['post_impressions_unique'] || 0,
        engagements: metricsMap['post_engaged_users'] || 0,
        clicks: metricsMap['post_clicks'] || 0,
        likes:
          engagementData.reactions?.summary?.total_count ||
          metricsMap['post_reactions_like_total'] ||
          0,
        comments: engagementData.comments?.summary?.total_count || 0,
        shares: engagementData.shares?.count || 0,
        rawData: { insights: data, engagement: engagementData },
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
      // Facebook Page insights: followers_count, fan_count
      const url = `${GRAPH_API_BASE}/${platformId}?fields=followers_count,fan_count,name&access_token=${accessToken}`;
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `Facebook API error: ${response.status}` };
      }
      const data = (await response.json()) as Record<string, unknown>;
      return {
        success: true,
        followers: (data.followers_count as number) || (data.fan_count as number) || 0,
        following: 0, // Pages don't have a "following" count
        postsCount: 0, // Requires separate paginated call
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
    const specs = PLATFORM_SPECS.FACEBOOK;
    const safeHashtags = hashtags ?? [];

    const fullContent =
      content + (safeHashtags.length > 0 ? '\n\n' + safeHashtags.map(h => `#${h}`).join(' ') : '');

    if (fullContent.length > specs.maxTextLength) {
      errors.push(`Content exceeds the ${specs.maxTextLength} character limit`);
    }

    if (safeHashtags.length > specs.maxHashtags) {
      warnings.push(`Facebook recommends ${specs.optimalHashtags} hashtags maximum`);
    }

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    if (wordCount > specs.optimalTextLength * 2) {
      warnings.push(`Text is longer than optimal (${specs.optimalTextLength} words recommended)`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
