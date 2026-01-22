/**
 * @kairn/social/posting - Multi-Platform Publisher
 *
 * Publishes content simultaneously to multiple social platforms.
 */

import type { SocialPlatform } from '../types';
import { PLATFORM_SPECS } from '../types';

import { FacebookPublisher } from './facebook';
import { InstagramPublisher } from './instagram';
import { LinkedInPublisher } from './linkedin';
import { ThreadsPublisher } from './threads';
import { TwitterPublisher } from './twitter';
import type {
  MultiPublishInput,
  MultiPublishResult,
  PublishResult,
  SocialPublisher,
} from './types';

/**
 * Multi-publisher configuration
 */
export interface MultiPublisherConfig {
  /** Base URL for media */
  baseUrl?: string;
  /** Publish concurrently (default: true) */
  concurrent?: boolean;
  /** Delay between sequential publishes (ms) */
  delayMs?: number;
}

/**
 * Content adaptation options
 */
export interface ContentAdaptOptions {
  /** Truncate content that exceeds platform limits */
  truncate?: boolean;
  /** Limit hashtags to platform optimal */
  limitHashtags?: boolean;
  /** Add platform-specific formatting */
  formatContent?: boolean;
}

/**
 * Multi-Platform Publisher
 *
 * Handles publishing to multiple platforms simultaneously with
 * optional content adaptation per platform.
 */
export class MultiPublisher {
  private publishers: Map<SocialPlatform, SocialPublisher>;
  private config: Required<MultiPublisherConfig>;

  constructor(config?: MultiPublisherConfig) {
    this.config = {
      baseUrl: config?.baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '',
      concurrent: config?.concurrent ?? true,
      delayMs: config?.delayMs ?? 500,
    };

    // Initialize publishers
    this.publishers = new Map();
    this.publishers.set('FACEBOOK', new FacebookPublisher(this.config.baseUrl));
    this.publishers.set('INSTAGRAM', new InstagramPublisher(this.config.baseUrl));
    this.publishers.set('LINKEDIN', new LinkedInPublisher());
    this.publishers.set('TWITTER', new TwitterPublisher());
    this.publishers.set('THREADS', new ThreadsPublisher(this.config.baseUrl));
  }

  /**
   * Publish to multiple platforms
   */
  async publish(input: MultiPublishInput): Promise<MultiPublishResult> {
    const { platforms, content, mediaUrls, hashtags, linkUrl, adaptContent } = input;

    const publishTasks = platforms.map(async platformConfig => {
      const { platform, accountId, accessToken, metadata, contentOverride, hashtagsOverride } =
        platformConfig;

      const publisher = this.publishers.get(platform);
      if (!publisher) {
        return {
          platform,
          accountId,
          result: {
            success: false,
            error: `Unsupported platform: ${platform}`,
          } as PublishResult,
        };
      }

      // Use override or adapt content
      let finalContent = contentOverride || content;
      let finalHashtags = hashtagsOverride || hashtags;

      if (adaptContent && !contentOverride) {
        const adapted = this.adaptContent(platform, content, hashtags);
        finalContent = adapted.content;
        finalHashtags = adapted.hashtags;
      }

      try {
        const result = await publisher.publish({
          content: finalContent,
          mediaUrls,
          hashtags: finalHashtags,
          linkUrl,
          accessToken,
          accountMetadata: metadata,
          baseUrl: input.baseUrl || this.config.baseUrl,
        });

        return { platform, accountId, result };
      } catch (error) {
        return {
          platform,
          accountId,
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          } as PublishResult,
        };
      }
    });

    let results: Array<{ platform: SocialPlatform; accountId: string; result: PublishResult }>;

    if (this.config.concurrent) {
      // Publish all platforms concurrently
      results = await Promise.all(publishTasks);
    } else {
      // Publish sequentially with delay
      results = [];
      for (const task of publishTasks) {
        results.push(await task);
        await new Promise(resolve => setTimeout(resolve, this.config.delayMs));
      }
    }

    const successful = results.filter(r => r.result.success).length;
    const failed = results.filter(r => !r.result.success).length;

    return {
      total: results.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Adapt content for a specific platform
   */
  adaptContent(
    platform: SocialPlatform,
    content: string,
    hashtags: string[],
    options?: ContentAdaptOptions
  ): { content: string; hashtags: string[] } {
    const specs = PLATFORM_SPECS[platform];
    const opts = {
      truncate: options?.truncate ?? true,
      limitHashtags: options?.limitHashtags ?? true,
      formatContent: options?.formatContent ?? false,
    };

    let adaptedContent = content;
    let adaptedHashtags = [...hashtags];

    // Limit hashtags
    if (opts.limitHashtags && adaptedHashtags.length > specs.optimalHashtags) {
      adaptedHashtags = adaptedHashtags.slice(0, specs.optimalHashtags);
    }

    // Calculate available space for content
    const hashtagsLength =
      adaptedHashtags.length > 0 ? adaptedHashtags.map(h => `#${h}`).join(' ').length + 2 : 0;

    // For Twitter, account for URL shortening (23 chars)
    let urlLength = 0;
    if (platform === 'TWITTER') {
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = adaptedContent.match(urlRegex) || [];
      urlLength = urls.length * 23;
      // Remove actual URLs from length calculation
      for (const url of urls) {
        adaptedContent = adaptedContent.replace(url, '');
      }
    }

    const maxContentLength = specs.maxTextLength - hashtagsLength - urlLength;

    // Truncate content if needed
    if (opts.truncate && adaptedContent.length > maxContentLength) {
      adaptedContent = adaptedContent.slice(0, maxContentLength - 3) + '...';
    }

    // Platform-specific formatting
    if (opts.formatContent) {
      switch (platform) {
        case 'LINKEDIN':
          // LinkedIn benefits from line breaks for readability
          adaptedContent = this.addLineBreaksForLinkedIn(adaptedContent);
          break;
        case 'INSTAGRAM':
          // Instagram often has hashtags separated by dots
          break;
        case 'TWITTER':
          // Twitter should be concise
          if (adaptedContent.length > specs.optimalTextLength * 2) {
            const sentences = adaptedContent.split(/[.!?]\s+/);
            adaptedContent = sentences.slice(0, 2).join('. ') + '.';
          }
          break;
      }
    }

    return { content: adaptedContent, hashtags: adaptedHashtags };
  }

  /**
   * Add strategic line breaks for LinkedIn readability
   */
  private addLineBreaksForLinkedIn(content: string): string {
    // If content already has line breaks, leave it
    if (content.includes('\n\n')) {
      return content;
    }

    // Split into sentences and group
    const sentences = content.split(/(?<=[.!?])\s+/);
    if (sentences.length <= 2) {
      return content;
    }

    // Add breaks every 2-3 sentences
    const result: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join(' ');
      result.push(chunk);
    }

    return result.join('\n\n');
  }

  /**
   * Validate content for multiple platforms
   */
  validateForPlatforms(
    platforms: SocialPlatform[],
    content: string,
    hashtags: string[]
  ): Map<SocialPlatform, { valid: boolean; errors: string[]; warnings: string[] }> {
    const results = new Map<
      SocialPlatform,
      { valid: boolean; errors: string[]; warnings: string[] }
    >();

    for (const platform of platforms) {
      const publisher = this.publishers.get(platform);
      if (publisher) {
        results.set(platform, publisher.validateContent(content, hashtags));
      } else {
        results.set(platform, {
          valid: false,
          errors: [`Unsupported platform: ${platform}`],
          warnings: [],
        });
      }
    }

    return results;
  }

  /**
   * Get recommended content length for multi-platform posting
   */
  getRecommendedContentLength(platforms: SocialPlatform[]): {
    maxLength: number;
    optimalLength: number;
    platform: SocialPlatform;
  } {
    let minMax = Infinity;
    let minOptimal = Infinity;
    let limitingPlatform: SocialPlatform = 'TWITTER';

    for (const platform of platforms) {
      const specs = PLATFORM_SPECS[platform];
      if (specs.maxTextLength < minMax) {
        minMax = specs.maxTextLength;
        limitingPlatform = platform;
      }
      if (specs.optimalTextLength < minOptimal) {
        minOptimal = specs.optimalTextLength;
      }
    }

    return {
      maxLength: minMax,
      optimalLength: minOptimal,
      platform: limitingPlatform,
    };
  }

  /**
   * Get publisher for direct use
   */
  getPublisher(platform: SocialPlatform): SocialPublisher | undefined {
    return this.publishers.get(platform);
  }
}
