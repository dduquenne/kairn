/**
 * @kairn/social/posting - Post Scheduler
 *
 * Manages scheduling and automated publishing of social media posts.
 */

import type { SocialPlatform } from '../types';

import { FacebookPublisher } from './facebook';
import { InstagramPublisher } from './instagram';
import { LinkedInPublisher } from './linkedin';
import { ThreadsPublisher } from './threads';
import { TwitterPublisher } from './twitter';
import type { ScheduledPost, PostStorage, PublishResult } from './types';

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  /** Maximum retry attempts per post */
  maxRetries?: number;
  /** Delay between retries (ms) */
  retryDelayMs?: number;
  /** Base URL for media */
  baseUrl?: string;
  /** Callback when post is published */
  onPublished?: (postId: string, result: PublishResult) => void | Promise<void>;
  /** Callback when post fails */
  onFailed?: (postId: string, error: string) => void | Promise<void>;
}

/**
 * Result of processing a batch of posts
 */
export interface SchedulerBatchResult {
  /** Total posts processed */
  total: number;
  /** Successfully published */
  published: number;
  /** Failed to publish */
  failed: number;
  /** Posts skipped (exceeded retries, etc.) */
  skipped: number;
  /** Detailed results */
  results: Array<{
    postId: string;
    platform: SocialPlatform;
    success: boolean;
    error?: string;
    externalPostId?: string;
    platformUrl?: string;
  }>;
}

/**
 * Post Scheduler
 *
 * Processes scheduled posts and publishes them to social platforms.
 */
export class PostScheduler {
  private storage: PostStorage;
  private config: Required<Omit<SchedulerConfig, 'onPublished' | 'onFailed'>> &
    Pick<SchedulerConfig, 'onPublished' | 'onFailed'>;
  private publishers: Map<
    SocialPlatform,
    FacebookPublisher | InstagramPublisher | LinkedInPublisher | TwitterPublisher | ThreadsPublisher
  >;

  constructor(storage: PostStorage, config?: SchedulerConfig) {
    this.storage = storage;
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      retryDelayMs: config?.retryDelayMs ?? 5000,
      baseUrl: config?.baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '',
      onPublished: config?.onPublished,
      onFailed: config?.onFailed,
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
   * Process all posts due for publishing
   */
  async processDuePosts(): Promise<SchedulerBatchResult> {
    const posts = await this.storage.getPostsDueForPublishing();

    const results: SchedulerBatchResult['results'] = [];
    let published = 0;
    let failed = 0;
    let skipped = 0;

    for (const post of posts) {
      // Skip if exceeded max retries
      if (post.retryCount >= this.config.maxRetries) {
        skipped++;
        await this.storage.updatePostStatus(post.id, 'failed', {
          errorMessage: 'Maximum retries exceeded',
        });
        continue;
      }

      // Mark as processing
      await this.storage.updatePostStatus(post.id, 'processing');

      try {
        const result = await this.publishPost(post);

        if (result.success) {
          published++;
          await this.storage.updatePostStatus(post.id, 'published', {
            externalPostId: result.externalPostId,
            platformUrl: result.platformUrl,
            publishedAt: new Date(),
          });

          if (this.config.onPublished) {
            await this.config.onPublished(post.id, result);
          }

          results.push({
            postId: post.id,
            platform: post.platform,
            success: true,
            externalPostId: result.externalPostId,
            platformUrl: result.platformUrl,
          });
        } else {
          failed++;
          const newRetryCount = post.retryCount + 1;

          await this.storage.updatePostStatus(
            post.id,
            newRetryCount >= this.config.maxRetries ? 'failed' : 'pending',
            {
              errorMessage: result.error,
              retryCount: newRetryCount,
            }
          );

          if (this.config.onFailed && newRetryCount >= this.config.maxRetries) {
            await this.config.onFailed(post.id, result.error || 'Unknown error');
          }

          results.push({
            postId: post.id,
            platform: post.platform,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const newRetryCount = post.retryCount + 1;

        await this.storage.updatePostStatus(
          post.id,
          newRetryCount >= this.config.maxRetries ? 'failed' : 'pending',
          {
            errorMessage,
            retryCount: newRetryCount,
          }
        );

        if (this.config.onFailed && newRetryCount >= this.config.maxRetries) {
          await this.config.onFailed(post.id, errorMessage);
        }

        results.push({
          postId: post.id,
          platform: post.platform,
          success: false,
          error: errorMessage,
        });
      }

      // Delay between posts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      total: posts.length,
      published,
      failed,
      skipped,
      results,
    };
  }

  /**
   * Publish a single post
   */
  private async publishPost(post: ScheduledPost): Promise<PublishResult> {
    const publisher = this.publishers.get(post.platform);
    if (!publisher) {
      return {
        success: false,
        error: `Unsupported platform: ${post.platform}`,
      };
    }

    // Get account details
    const account = await this.storage.getAccountForPublishing(post.accountId);
    if (!account) {
      return {
        success: false,
        error: 'Account not found or inactive',
      };
    }

    return publisher.publish({
      content: post.content,
      mediaUrls: post.mediaUrls,
      hashtags: post.hashtags,
      linkUrl: post.linkUrl,
      accessToken: account.accessToken,
      accountMetadata: account.metadata,
      baseUrl: this.config.baseUrl,
    });
  }

  /**
   * Validate content for a platform before scheduling
   */
  validateContent(
    platform: SocialPlatform,
    content: string,
    hashtags: string[]
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const publisher = this.publishers.get(platform);
    if (!publisher) {
      return {
        valid: false,
        errors: [`Unsupported platform: ${platform}`],
        warnings: [],
      };
    }

    return publisher.validateContent(content, hashtags);
  }

  /**
   * Get publisher for direct use
   */
  getPublisher(platform: SocialPlatform) {
    return this.publishers.get(platform);
  }
}
