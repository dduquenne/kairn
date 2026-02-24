/**
 * @kairn/social/posting - Publishing Types
 *
 * Types and interfaces for social media post publishing.
 */

import type { SocialPlatform, SocialAccountMetadata } from '../types';

// ===========================================
// Publishing Types
// ===========================================

/**
 * Input for publishing a post
 */
export interface PublishPostInput {
  /** Post content/text */
  content: string;
  /** Media URLs (images) */
  mediaUrls: string[];
  /** Hashtags (without #) */
  hashtags: string[];
  /** Link URL to include */
  linkUrl: string | null;
  /** Decrypted access token */
  accessToken: string;
  /** Account-specific metadata (pageId, igUserId, etc.) */
  accountMetadata: SocialAccountMetadata | null;
  /** Base URL for constructing full media URLs */
  baseUrl?: string;
}

/**
 * Result of a publish operation
 */
export interface PublishResult {
  /** Whether publishing succeeded */
  success: boolean;
  /** Platform-specific post ID */
  externalPostId?: string;
  /** Direct URL to the published post */
  platformUrl?: string;
  /** Error message if failed */
  error?: string;
  /** Raw API response for debugging */
  rawResponse?: unknown;
}

/**
 * Input for retrieving post analytics
 */
export interface GetAnalyticsInput {
  /** Platform-specific post ID */
  externalPostId: string;
  /** Decrypted access token */
  accessToken: string;
  /** Account-specific metadata */
  accountMetadata: SocialAccountMetadata | null;
}

/**
 * Analytics data for a post
 */
export interface AnalyticsResult {
  /** Whether retrieval succeeded */
  success: boolean;
  /** Number of impressions */
  impressions?: number;
  /** Unique reach */
  reach?: number;
  /** Total engagements */
  engagements?: number;
  /** Likes count */
  likes?: number;
  /** Comments count */
  comments?: number;
  /** Shares/retweets count */
  shares?: number;
  /** Saves count (Instagram) */
  saves?: number;
  /** Link clicks */
  clicks?: number;
  /** Raw API data for debugging */
  rawData?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  /** Whether content is valid */
  valid: boolean;
  /** Hard errors (content cannot be published) */
  errors: string[];
  /** Warnings (content can be published but may not perform well) */
  warnings: string[];
}

// ===========================================
// Account Metrics (followers, following, etc.)
// ===========================================

/**
 * Input for retrieving account-level metrics
 */
export interface GetAccountMetricsInput {
  /** Decrypted access token */
  accessToken: string;
  /** Account-specific metadata */
  accountMetadata: SocialAccountMetadata | null;
  /** Platform-specific account ID */
  platformId: string;
}

/**
 * Account metrics result
 */
export interface AccountMetricsResult {
  /** Whether retrieval succeeded */
  success: boolean;
  /** Follower count */
  followers?: number;
  /** Following count */
  following?: number;
  /** Total posts on platform */
  postsCount?: number;
  /** Raw API data */
  rawData?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
}

// ===========================================
// Publisher Interface
// ===========================================

/**
 * Social media publisher interface
 * All platform-specific publishers implement this interface.
 */
export interface SocialPublisher {
  /** Platform identifier */
  readonly platform: SocialPlatform;

  /**
   * Publish a post to the platform
   */
  publish(input: PublishPostInput): Promise<PublishResult>;

  /**
   * Retrieve analytics for a published post
   */
  getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult>;

  /**
   * Retrieve account-level metrics (followers, following, etc.)
   * Optional — returns not-supported error if not implemented.
   */
  getAccountMetrics?(input: GetAccountMetricsInput): Promise<AccountMetricsResult>;

  /**
   * Validate content against platform limits
   */
  validateContent(content: string, hashtags: string[]): ContentValidationResult;
}

// ===========================================
// Retry Configuration
// ===========================================

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries (ms) */
  baseDelayMs: number;
  /** Maximum delay between retries (ms) */
  maxDelayMs: number;
  /** Error patterns that should trigger retry */
  retryableErrors: string[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate_limit',
    'temporarily_unavailable',
    '429',
    '500',
    '502',
    '503',
    '504',
  ],
};

// ===========================================
// Scheduling Types
// ===========================================

/**
 * Scheduled post data
 */
export interface ScheduledPost {
  /** Post ID */
  id: string;
  /** Platform to publish to */
  platform: SocialPlatform;
  /** Account ID to use */
  accountId: string;
  /** Post content */
  content: string;
  /** Media URLs */
  mediaUrls: string[];
  /** Hashtags */
  hashtags: string[];
  /** Link URL */
  linkUrl: string | null;
  /** Scheduled publish time */
  scheduledAt: Date;
  /** Current status */
  status: 'pending' | 'processing' | 'published' | 'failed';
  /** Number of retry attempts */
  retryCount: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Post storage interface for scheduler
 */
export interface PostStorage {
  /** Get posts due for publishing */
  getPostsDueForPublishing(): Promise<ScheduledPost[]>;

  /** Update post status */
  updatePostStatus(
    postId: string,
    status: ScheduledPost['status'],
    data?: {
      externalPostId?: string;
      platformUrl?: string;
      errorMessage?: string;
      retryCount?: number;
      publishedAt?: Date;
    }
  ): Promise<void>;

  /** Get account details for publishing */
  getAccountForPublishing(accountId: string): Promise<{
    accessToken: string;
    metadata: SocialAccountMetadata | null;
  } | null>;
}

// ===========================================
// Multi-Publisher Types
// ===========================================

/**
 * Input for multi-platform publishing
 */
export interface MultiPublishInput {
  /** Content (may be adapted per platform) */
  content: string;
  /** Media URLs */
  mediaUrls: string[];
  /** Hashtags */
  hashtags: string[];
  /** Link URL */
  linkUrl: string | null;
  /** Platforms to publish to */
  platforms: Array<{
    platform: SocialPlatform;
    accountId: string;
    accessToken: string;
    metadata: SocialAccountMetadata | null;
    /** Platform-specific content override */
    contentOverride?: string;
    /** Platform-specific hashtags override */
    hashtagsOverride?: string[];
  }>;
  /** Base URL for media */
  baseUrl?: string;
  /** Adapt content per platform automatically */
  adaptContent?: boolean;
}

/**
 * Result of multi-platform publishing
 */
export interface MultiPublishResult {
  /** Total platforms attempted */
  total: number;
  /** Successfully published */
  successful: number;
  /** Failed publications */
  failed: number;
  /** Results per platform */
  results: Array<{
    platform: SocialPlatform;
    accountId: string;
    result: PublishResult;
  }>;
}
