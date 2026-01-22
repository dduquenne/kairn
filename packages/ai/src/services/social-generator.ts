/**
 * Social Media Post Generation Service
 * @package @kairn/ai
 */

import {
  buildSocialPostPrompt,
  buildMultiPlatformPrompt,
  PLATFORM_CONFIG,
} from '../prompts/social-post.js';
import type { AIProvider, RetryOptions } from '../providers/types.js';
import { parseJsonSafe } from '../utils/parsing.js';
import { withRetry } from '../utils/retry.js';

import type {
  SocialPlatform,
  SocialPostGenerationOptions,
  GeneratedSocialPost,
  MultiPlatformPosts,
} from './types.js';

// ============================================
// Social Generator Service
// ============================================

export class SocialGenerator {
  private provider: AIProvider;
  private retryOptions: RetryOptions;

  constructor(
    provider: AIProvider,
    options: {
      retryOptions?: RetryOptions;
    } = {}
  ) {
    this.provider = provider;
    this.retryOptions = options.retryOptions || {
      maxRetries: 2,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
    };
  }

  /**
   * Generate a post for a specific platform
   */
  async generateForPlatform(options: SocialPostGenerationOptions): Promise<GeneratedSocialPost> {
    const prompt = buildSocialPostPrompt(options);
    const platformConfig = PLATFORM_CONFIG[options.platform];

    const result = await withRetry(
      () =>
        this.provider.generateText(prompt, {
          maxTokens: 1000,
          temperature: 0.7,
        }),
      this.retryOptions
    );

    // Clean up the response
    let content = result.content.trim();

    // Remove any markdown code block markers if present
    content = content
      .replace(/^```[\w]*\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    // Truncate if needed
    if (content.length > platformConfig.maxLength) {
      content = this.truncatePreservingWords(content, platformConfig.maxLength);
    }

    // Extract hashtags
    const hashtags = this.extractHashtags(content);

    return {
      content,
      platform: options.platform,
      characterCount: content.length,
      hashtags,
      metadata: {
        tokensUsed: result.totalTokens,
        durationMs: result.durationMs,
        model: result.model,
      },
    };
  }

  /**
   * Generate posts for multiple platforms at once
   */
  async generateForPlatforms(
    sourceContent: string,
    sourceTitle: string | undefined,
    platforms: SocialPlatform[],
    options: Partial<
      Omit<SocialPostGenerationOptions, 'sourceContent' | 'sourceTitle' | 'platform'>
    > = {}
  ): Promise<MultiPlatformPosts> {
    const startTime = Date.now();

    const prompt = buildMultiPlatformPrompt(sourceContent, sourceTitle, platforms, options);

    const result = await withRetry(
      () =>
        this.provider.generateText(prompt, {
          maxTokens: 3000,
          temperature: 0.7,
        }),
      this.retryOptions
    );

    // Parse the JSON response
    const parsed = parseJsonSafe<{ posts: Record<string, string> }>(result.content);

    if (!parsed || !parsed.posts) {
      // Fallback: generate individually if JSON parsing fails
      return this.generateIndividually(sourceContent, sourceTitle, platforms, options);
    }

    // Validate and clean each post
    const posts: Partial<Record<SocialPlatform, string>> = {};

    for (const platform of platforms) {
      const postContent = parsed.posts[platform];
      if (postContent) {
        const config = PLATFORM_CONFIG[platform];
        let content = postContent.trim();

        // Truncate if needed
        if (content.length > config.maxLength) {
          content = this.truncatePreservingWords(content, config.maxLength);
        }

        posts[platform] = content;
      }
    }

    return {
      posts,
      metadata: {
        tokensUsed: result.totalTokens,
        durationMs: Date.now() - startTime,
        model: result.model,
      },
    };
  }

  /**
   * Generate posts individually (fallback or for more control)
   */
  private async generateIndividually(
    sourceContent: string,
    sourceTitle: string | undefined,
    platforms: SocialPlatform[],
    options: Partial<
      Omit<SocialPostGenerationOptions, 'sourceContent' | 'sourceTitle' | 'platform'>
    >
  ): Promise<MultiPlatformPosts> {
    const startTime = Date.now();
    let totalTokens = 0;
    const posts: Partial<Record<SocialPlatform, string>> = {};

    // Generate in parallel for efficiency
    const results = await Promise.all(
      platforms.map(async platform => {
        const result = await this.generateForPlatform({
          sourceContent,
          sourceTitle,
          platform,
          ...options,
        });
        return { platform, result };
      })
    );

    for (const { platform, result } of results) {
      posts[platform] = result.content;
      totalTokens += result.metadata.tokensUsed;
    }

    return {
      posts,
      metadata: {
        tokensUsed: totalTokens,
        durationMs: Date.now() - startTime,
        model: this.provider.defaultTextModel,
      },
    };
  }

  /**
   * Platform-specific generation methods
   */
  async generateForFacebook(
    content: string,
    title?: string,
    options?: Partial<SocialPostGenerationOptions>
  ): Promise<GeneratedSocialPost> {
    return this.generateForPlatform({
      sourceContent: content,
      sourceTitle: title,
      platform: 'facebook',
      ...options,
    });
  }

  async generateForInstagram(
    content: string,
    title?: string,
    options?: Partial<SocialPostGenerationOptions>
  ): Promise<GeneratedSocialPost> {
    return this.generateForPlatform({
      sourceContent: content,
      sourceTitle: title,
      platform: 'instagram',
      includeHashtags: true,
      includeEmojis: true,
      ...options,
    });
  }

  async generateForLinkedIn(
    content: string,
    title?: string,
    options?: Partial<SocialPostGenerationOptions>
  ): Promise<GeneratedSocialPost> {
    return this.generateForPlatform({
      sourceContent: content,
      sourceTitle: title,
      platform: 'linkedin',
      tone: 'informative',
      ...options,
    });
  }

  async generateForTwitter(
    content: string,
    title?: string,
    options?: Partial<SocialPostGenerationOptions>
  ): Promise<GeneratedSocialPost> {
    return this.generateForPlatform({
      sourceContent: content,
      sourceTitle: title,
      platform: 'twitter',
      includeHashtags: true,
      ...options,
    });
  }

  async generateForThreads(
    content: string,
    title?: string,
    options?: Partial<SocialPostGenerationOptions>
  ): Promise<GeneratedSocialPost> {
    return this.generateForPlatform({
      sourceContent: content,
      sourceTitle: title,
      platform: 'threads',
      includeHashtags: false, // Threads doesn't support hashtags well
      ...options,
    });
  }

  /**
   * Extract hashtags from post content
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
    const matches = content.match(hashtagRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Truncate content while preserving whole words
   */
  private truncatePreservingWords(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Find the last space before the limit
    const truncated = content.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
      return truncated.slice(0, lastSpace) + '...';
    }

    return truncated.slice(0, maxLength - 3) + '...';
  }
}

/**
 * Create a social generator with the given provider
 */
export function createSocialGenerator(
  provider: AIProvider,
  options?: {
    retryOptions?: RetryOptions;
  }
): SocialGenerator {
  return new SocialGenerator(provider, options);
}
