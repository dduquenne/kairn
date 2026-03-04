/**
 * @kairn/social/posting - Twitter/X Publisher
 *
 * Publishes tweets via Twitter API v2.
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

const TWITTER_API_BASE = 'https://api.twitter.com/2';

export class TwitterPublisher implements SocialPublisher {
  readonly platform: SocialPlatform = 'TWITTER';

  /**
   * Publish a tweet
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, hashtags, linkUrl, accessToken, accountMetadata } = input;

    try {
      // Build tweet text
      const safeHashtags = hashtags ?? [];
      let text = content;

      // Add hashtags
      if (safeHashtags.length > 0) {
        const hashtagsText = safeHashtags.map(h => `#${h}`).join(' ');
        text += '\n\n' + hashtagsText;
      }

      // Add link with UTM tracking
      if (linkUrl) {
        const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
          source: 'TWITTER',
          medium: 'social',
          content: linkUrl.includes('/blog/')
            ? 'blog'
            : linkUrl.includes('/seminars/')
              ? 'seminar'
              : undefined,
        });
        text += '\n\n' + trackedLinkUrl;
      }

      // Validate content
      const validation = this.validateContent(content, safeHashtags);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Publish tweet
      const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = (await response.json()) as {
        data?: { id?: string };
        detail?: string;
        title?: string;
        errors?: Array<{ message?: string }>;
      };

      if (!response.ok) {
        const errorMessage =
          data.detail || data.title || data.errors?.[0]?.message || `HTTP error ${response.status}`;
        return {
          success: false,
          error: errorMessage,
          rawResponse: data,
        };
      }

      const tweetId = data.data?.id;
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken } = input;

    try {
      const metricsFields = ['public_metrics', 'organic_metrics', 'non_public_metrics'].join(',');

      const response = await fetch(
        `${TWITTER_API_BASE}/tweets/${externalPostId}?tweet.fields=${metricsFields}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      type TwitterMetrics = {
        impression_count?: number;
        like_count?: number;
        reply_count?: number;
        retweet_count?: number;
        quote_count?: number;
        url_link_clicks?: number;
      };

      type TwitterResponse = {
        data?: {
          public_metrics?: TwitterMetrics;
          organic_metrics?: TwitterMetrics;
          non_public_metrics?: TwitterMetrics;
        };
        detail?: string;
        title?: string;
      };

      const data = (await response.json()) as TwitterResponse;

      if (!response.ok) {
        // Non-public metrics may be inaccessible
        if (response.status === 403) {
          const publicResponse = await fetch(
            `${TWITTER_API_BASE}/tweets/${externalPostId}?tweet.fields=public_metrics`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (publicResponse.ok) {
            const publicData = (await publicResponse.json()) as TwitterResponse;
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
          error: data.detail || data.title || `HTTP error ${response.status}`,
        };
      }

      const publicMetrics = data.data?.public_metrics || {};
      const organicMetrics = data.data?.organic_metrics || {};
      const nonPublicMetrics = data.data?.non_public_metrics || {};

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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAccountMetrics(input: GetAccountMetricsInput): Promise<AccountMetricsResult> {
    const { accessToken, platformId } = input;
    try {
      // Twitter API v2 — user lookup with public metrics
      const url = `${TWITTER_API_BASE}/users/${platformId}?user.fields=public_metrics`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        return { success: false, error: `Twitter API error: ${response.status}` };
      }
      const data = (await response.json()) as Record<string, unknown>;
      const innerData = data.data as Record<string, unknown> | undefined;
      const metrics = (innerData?.public_metrics as Record<string, unknown>) || {};
      return {
        success: true,
        followers: (metrics.followers_count as number) || 0,
        following: (metrics.following_count as number) || 0,
        postsCount: (metrics.tweet_count as number) || 0,
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
    const specs = PLATFORM_SPECS.TWITTER;
    const safeHashtags = hashtags ?? [];

    // Calculate total length
    const hashtagsText =
      safeHashtags.length > 0 ? '\n\n' + safeHashtags.map(h => `#${h}`).join(' ') : '';
    const fullContent = content + hashtagsText;

    // Calculate effective length (URLs are shortened to 23 chars)
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = fullContent.match(urlRegex) || [];
    let effectiveLength = fullContent.length;

    for (const url of urls) {
      effectiveLength = effectiveLength - url.length + 23;
    }

    if (effectiveLength > specs.maxTextLength) {
      errors.push(
        `Tweet exceeds ${specs.maxTextLength} character limit (currently ${effectiveLength})`
      );
    }

    if (safeHashtags.length > specs.maxHashtags) {
      errors.push(`Maximum ${specs.maxHashtags} hashtags on Twitter`);
    }

    if (safeHashtags.length > specs.optimalHashtags) {
      warnings.push(`Twitter works better with ${specs.optimalHashtags} hashtags or less`);
    }

    if (effectiveLength < 50) {
      warnings.push('Short tweets generally have less engagement');
    }

    const mentions = content.match(/@[a-zA-Z0-9_]+/g) || [];
    if (mentions.length > 5) {
      warnings.push('Too many mentions may reduce tweet visibility');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
