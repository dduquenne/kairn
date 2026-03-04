/**
 * @kairn/social/posting - LinkedIn Publisher
 *
 * Publishes content to LinkedIn profiles and organization pages via API v2.
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

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export class LinkedInPublisher implements SocialPublisher {
  readonly platform: SocialPlatform = 'LINKEDIN';

  /**
   * Publish a post to LinkedIn
   */
  async publish(input: PublishPostInput): Promise<PublishResult> {
    const { content, hashtags, linkUrl, accessToken, accountMetadata } = input;

    const personId = accountMetadata?.personId;
    const organizationId = accountMetadata?.organizationId;

    if (!personId && !organizationId) {
      return {
        success: false,
        error: 'Person ID or Organization ID missing',
      };
    }

    const author = organizationId
      ? `urn:li:organization:${organizationId}`
      : `urn:li:person:${personId}`;

    try {
      // Build content with hashtags
      const safeHashtags = hashtags ?? [];
      let fullContent = content;
      if (safeHashtags.length > 0) {
        fullContent += '\n\n' + safeHashtags.map(h => `#${h}`).join(' ');
      }

      if (linkUrl) {
        return await this.publishWithArticle(author, fullContent, linkUrl, accessToken);
      } else {
        return await this.publishText(author, fullContent, accessToken);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

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
          shareCommentary: { text: content },
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
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: (data as { message?: string }).message || `HTTP error ${response.status}`,
        rawResponse: data,
      };
    }

    const postId = response.headers.get('x-restli-id') || (data as { id?: string }).id;
    const activityUrn = postId?.replace('urn:li:share:', 'urn:li:activity:');

    return {
      success: true,
      externalPostId: postId || undefined,
      platformUrl: activityUrn ? `https://www.linkedin.com/feed/update/${activityUrn}` : undefined,
      rawResponse: data,
    };
  }

  private async publishWithArticle(
    author: string,
    content: string,
    linkUrl: string,
    accessToken: string
  ): Promise<PublishResult> {
    const url = `${LINKEDIN_API_BASE}/ugcPosts`;

    const trackedLinkUrl = buildUrlWithUtm(linkUrl, {
      source: 'LINKEDIN',
      medium: 'social',
      content: linkUrl.includes('/blog/')
        ? 'blog'
        : linkUrl.includes('/seminars/')
          ? 'seminar'
          : undefined,
    });

    const body = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
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
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    let data: Record<string, unknown> = {};
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        data = (await response.json()) as Record<string, unknown>;
      } catch {
        // Empty body is OK
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: (data as { message?: string }).message || `HTTP error ${response.status}`,
        rawResponse: data,
      };
    }

    const postId = response.headers.get('x-restli-id') || (data as { id?: string }).id;
    const activityUrn = postId?.replace('urn:li:share:', 'urn:li:activity:');

    return {
      success: true,
      externalPostId: postId || undefined,
      platformUrl: activityUrn ? `https://www.linkedin.com/feed/update/${activityUrn}` : undefined,
      rawResponse: data,
    };
  }

  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult> {
    const { externalPostId, accessToken, accountMetadata } = input;

    try {
      const organizationId = accountMetadata?.organizationId;

      if (organizationId) {
        return await this.getOrganizationPostAnalytics(externalPostId, organizationId, accessToken);
      } else {
        // Limited analytics for personal profiles
        return {
          success: true,
          impressions: 0,
          reach: 0,
          engagements: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          rawData: { note: 'Limited analytics for personal profiles' },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getOrganizationPostAnalytics(
    postId: string,
    organizationId: string,
    accessToken: string
  ): Promise<AnalyticsResult> {
    const activityUrn = postId.includes('share') ? postId.replace('share', 'activity') : postId;

    const url = `${LINKEDIN_API_BASE}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}&shares[0]=${activityUrn}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      elements?: Array<{
        totalShareStatistics?: {
          impressionCount?: number;
          uniqueImpressionsCount?: number;
          engagement?: number;
          likeCount?: number;
          commentCount?: number;
          shareCount?: number;
          clickCount?: number;
        };
      }>;
    };
    const stats = data.elements?.[0]?.totalShareStatistics;

    if (!stats) {
      return { success: true, rawData: data };
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

  async getAccountMetrics(input: GetAccountMetricsInput): Promise<AccountMetricsResult> {
    const { accessToken, accountMetadata } = input;
    try {
      const isOrganization = !!accountMetadata?.organizationId;

      if (isOrganization) {
        const orgId = accountMetadata?.organizationId;
        if (!orgId) {
          return { success: false, error: 'Organization ID required for org account metrics' };
        }
        // Organization follower statistics
        const url = `${LINKEDIN_API_BASE}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });
        if (!response.ok) {
          return { success: false, error: `LinkedIn API error: ${response.status}` };
        }
        const data = (await response.json()) as Record<string, unknown>;
        const elements = data.elements as Array<Record<string, unknown>> | undefined;
        const followerStats = elements?.[0] || {};
        const followerCounts = followerStats.followerCounts as Record<string, unknown> | undefined;
        return {
          success: true,
          followers: (followerCounts?.organicFollowerCount as number) || 0,
          following: 0,
          postsCount: 0,
          rawData: data,
        };
      }

      // Personal profile — limited metrics
      const url = `${LINKEDIN_API_BASE}/me?projection=(id,vanityName)`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        return { success: false, error: `LinkedIn API error: ${response.status}` };
      }
      const data = (await response.json()) as Record<string, unknown>;
      return {
        success: true,
        followers: 0, // Personal profile follower count not available via API
        following: 0,
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
    const specs = PLATFORM_SPECS.LINKEDIN;
    const safeHashtags = hashtags ?? [];

    const fullContent =
      content + (safeHashtags.length > 0 ? '\n\n' + safeHashtags.map(h => `#${h}`).join(' ') : '');

    if (fullContent.length > specs.maxTextLength) {
      errors.push(`Content exceeds the ${specs.maxTextLength} character limit`);
    }

    if (safeHashtags.length > specs.maxHashtags) {
      errors.push(`Maximum ${specs.maxHashtags} hashtags allowed`);
    }

    if (safeHashtags.length > specs.optimalHashtags) {
      warnings.push(`LinkedIn recommends ${specs.optimalHashtags} hashtags for optimal engagement`);
    }

    const firstLine = content.split('\n')[0] ?? '';
    if (firstLine.length > 150) {
      warnings.push('First line is long - it will be truncated before "see more"');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
