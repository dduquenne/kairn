/**
 * @kairn/social - Types and Interfaces
 *
 * Core type definitions for the social media integration module.
 */

// ===========================================
// Enums and Constants
// ===========================================

/**
 * Supported social platforms
 */
export type SocialPlatform = 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'TWITTER' | 'THREADS';

/**
 * Currently implemented platforms
 */
export const IMPLEMENTED_PLATFORMS: SocialPlatform[] = [
  'FACEBOOK',
  'LINKEDIN',
  'INSTAGRAM',
  'TWITTER',
  'THREADS',
];

/**
 * Post status values
 */
export type PostStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Content generation source
 */
export type GenerationSource = 'ai' | 'manual';

/**
 * Content tone options
 */
export type ContentTone = 'informatif' | 'inspirant' | 'promotionnel' | 'educatif' | 'personnel';

/**
 * Content angle options
 */
export type ContentAngle = 'benefices' | 'probleme' | 'histoire' | 'expert' | 'pratique';

// ===========================================
// Platform-specific post formats
// ===========================================

export type InstagramPostFormat =
  | 'hook_reveal'
  | 'liste_visuelle'
  | 'micro_storytelling'
  | 'question_rhethorique'
  | 'citation_reflexion'
  | 'mythe_realite';

export type ThreadsPostFormat =
  | 'pensee_brute'
  | 'observation_cabinet'
  | 'question_ouverte'
  | 'micro_confession'
  | 'fragment_poetique'
  | 'contre_intuitif';

export type FacebookPostFormat =
  | 'confession'
  | 'question_provocante'
  | 'micro_histoire'
  | 'liste_inversee'
  | 'observation_cabinet'
  | 'avant_apres';

export type LinkedInPostFormat =
  | 'observation_pro'
  | 'contre_intuition'
  | 'liste_puces'
  | 'storytelling_court'
  | 'question_provocante'
  | 'temoignage_terrain';

// ===========================================
// Social Accounts
// ===========================================

/**
 * Platform-specific metadata for accounts
 */
export interface SocialAccountMetadata {
  // Facebook
  pageId?: string;
  pageName?: string;

  // LinkedIn
  organizationId?: string;
  organizationName?: string;
  personId?: string;

  // Instagram
  igUserId?: string;
  igUsername?: string;
  linkedFacebookPageId?: string;

  // Threads
  threadsUserId?: string;
  threadsUsername?: string;

  // Twitter
  twitterUserId?: string;
  twitterUsername?: string;

  // Generic
  profileUrl?: string;
  avatarUrl?: string;
}

/**
 * Public account data (without sensitive tokens)
 */
export interface SocialAccountPublic {
  id: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  tokenExpiry: Date | null;
  scope: string[];
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full account data (with encrypted tokens)
 */
export interface SocialAccountFull extends SocialAccountPublic {
  accessToken: string;
  refreshToken: string | null;
  metadata: SocialAccountMetadata | null;
}

/**
 * Input for creating a social account
 */
export interface CreateSocialAccountInput {
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date | null;
  scope: string[];
  metadata?: SocialAccountMetadata;
}

/**
 * Input for updating a social account
 */
export interface UpdateSocialAccountInput {
  accountName?: string;
  accessToken?: string;
  refreshToken?: string | null;
  tokenExpiry?: Date | null;
  scope?: string[];
  metadata?: SocialAccountMetadata;
  isActive?: boolean;
}

// ===========================================
// Social Posts
// ===========================================

/**
 * Post metadata
 */
export interface SocialPostMetadata {
  tone?: ContentTone;
  angle?: ContentAngle;
  customInstructions?: string;
  instagramFormat?: InstagramPostFormat;
  threadsFormat?: ThreadsPostFormat;
  facebookFormat?: FacebookPostFormat;
  linkedinFormat?: LinkedInPostFormat;
  articleCategory?: string;
  articleTags?: string[];
  publishAttempts?: number;
  lastPublishError?: string;
}

/**
 * Social post data
 */
export interface SocialPost {
  id: string;
  blogSlug: string | null;
  blogTitle: string | null;
  platform: SocialPlatform;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  linkUrl: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  status: PostStatus;
  externalPostId: string | null;
  platformUrl: string | null;
  errorMessage: string | null;
  retryCount: number;
  generatedBy: GenerationSource | null;
  aiPrompt: string | null;
  aiModel: string | null;
  metadata: SocialPostMetadata | null;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Post analytics data
 */
export interface SocialPostAnalytics {
  id: string;
  postId: string;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  rawData: Record<string, unknown> | null;
  fetchedAt: Date;
  updatedAt: Date;
}

// ===========================================
// Platform Specifications
// ===========================================

/**
 * Platform specifications
 */
export interface PlatformSpecs {
  platform: SocialPlatform;
  name: string;
  maxTextLength: number;
  optimalTextLength: number;
  maxHashtags: number;
  optimalHashtags: number;
  supportsLinks: boolean;
  linkInComment: boolean;
  requiresMedia: boolean;
  imageRatio: string;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Platform specifications lookup
 */
export const PLATFORM_SPECS: Record<SocialPlatform, PlatformSpecs> = {
  FACEBOOK: {
    platform: 'FACEBOOK',
    name: 'Facebook',
    maxTextLength: 63206,
    optimalTextLength: 80,
    maxHashtags: 30,
    optimalHashtags: 2,
    supportsLinks: true,
    linkInComment: false,
    requiresMedia: false,
    imageRatio: '1.91:1',
    imageWidth: 1200,
    imageHeight: 630,
  },
  LINKEDIN: {
    platform: 'LINKEDIN',
    name: 'LinkedIn',
    maxTextLength: 3000,
    optimalTextLength: 200,
    maxHashtags: 30,
    optimalHashtags: 5,
    supportsLinks: true,
    linkInComment: true,
    requiresMedia: false,
    imageRatio: '1.91:1',
    imageWidth: 1200,
    imageHeight: 627,
  },
  INSTAGRAM: {
    platform: 'INSTAGRAM',
    name: 'Instagram',
    maxTextLength: 2200,
    optimalTextLength: 150,
    maxHashtags: 30,
    optimalHashtags: 10,
    supportsLinks: false,
    linkInComment: false,
    requiresMedia: true,
    imageRatio: '1:1',
    imageWidth: 1080,
    imageHeight: 1080,
  },
  TWITTER: {
    platform: 'TWITTER',
    name: 'Twitter/X',
    maxTextLength: 280,
    optimalTextLength: 100,
    maxHashtags: 5,
    optimalHashtags: 2,
    supportsLinks: true,
    linkInComment: false,
    requiresMedia: false,
    imageRatio: '16:9',
    imageWidth: 1200,
    imageHeight: 675,
  },
  THREADS: {
    platform: 'THREADS',
    name: 'Threads',
    maxTextLength: 500,
    optimalTextLength: 150,
    maxHashtags: 10,
    optimalHashtags: 3,
    supportsLinks: true,
    linkInComment: false,
    requiresMedia: false,
    imageRatio: '1:1',
    imageWidth: 1080,
    imageHeight: 1080,
  },
};

// ===========================================
// Optimal Posting Times
// ===========================================

/**
 * Optimal time slot definition
 */
export interface OptimalTimeSlot {
  dayOfWeek: number;
  hour: number;
  priority: 'primary' | 'secondary';
}

/**
 * Optimal posting times by platform
 */
export const OPTIMAL_POSTING_TIMES: Record<SocialPlatform, OptimalTimeSlot[]> = {
  FACEBOOK: [
    { dayOfWeek: 1, hour: 9, priority: 'primary' },
    { dayOfWeek: 2, hour: 9, priority: 'primary' },
    { dayOfWeek: 3, hour: 9, priority: 'primary' },
    { dayOfWeek: 4, hour: 9, priority: 'primary' },
    { dayOfWeek: 5, hour: 9, priority: 'primary' },
    { dayOfWeek: 1, hour: 13, priority: 'secondary' },
    { dayOfWeek: 2, hour: 13, priority: 'secondary' },
    { dayOfWeek: 3, hour: 13, priority: 'secondary' },
    { dayOfWeek: 6, hour: 10, priority: 'secondary' },
    { dayOfWeek: 0, hour: 10, priority: 'secondary' },
  ],
  LINKEDIN: [
    { dayOfWeek: 2, hour: 7, priority: 'primary' },
    { dayOfWeek: 3, hour: 7, priority: 'primary' },
    { dayOfWeek: 4, hour: 7, priority: 'primary' },
    { dayOfWeek: 2, hour: 12, priority: 'secondary' },
    { dayOfWeek: 3, hour: 12, priority: 'secondary' },
    { dayOfWeek: 3, hour: 17, priority: 'secondary' },
  ],
  INSTAGRAM: [
    { dayOfWeek: 0, hour: 10, priority: 'primary' },
    { dayOfWeek: 1, hour: 11, priority: 'primary' },
    { dayOfWeek: 2, hour: 11, priority: 'primary' },
    { dayOfWeek: 3, hour: 11, priority: 'primary' },
    { dayOfWeek: 4, hour: 11, priority: 'primary' },
    { dayOfWeek: 5, hour: 11, priority: 'primary' },
    { dayOfWeek: 6, hour: 10, priority: 'primary' },
    { dayOfWeek: 0, hour: 19, priority: 'secondary' },
    { dayOfWeek: 1, hour: 19, priority: 'secondary' },
    { dayOfWeek: 2, hour: 19, priority: 'secondary' },
  ],
  TWITTER: [
    { dayOfWeek: 1, hour: 8, priority: 'primary' },
    { dayOfWeek: 2, hour: 8, priority: 'primary' },
    { dayOfWeek: 3, hour: 8, priority: 'primary' },
    { dayOfWeek: 4, hour: 8, priority: 'primary' },
    { dayOfWeek: 5, hour: 8, priority: 'primary' },
  ],
  THREADS: [
    { dayOfWeek: 1, hour: 10, priority: 'primary' },
    { dayOfWeek: 2, hour: 10, priority: 'primary' },
    { dayOfWeek: 3, hour: 10, priority: 'primary' },
  ],
};
