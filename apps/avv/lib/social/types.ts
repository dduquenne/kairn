/**
 * Types pour le système de réseaux sociaux
 *
 * MIGRATION: Ce module réexporte tous les types depuis @kairn/social
 * pour centraliser les définitions de types.
 */

// Re-export everything from @kairn/social
export type {
  SocialPlatform,
  PostStatus,
  GenerationSource,
  ContentTone,
  ContentAngle,
  InstagramPostFormat,
  ThreadsPostFormat,
  FacebookPostFormat,
  LinkedInPostFormat,
  AuthenticityLevel,
  ThreadsAuthenticityLevel,
  FacebookToneLevel,
  LinkedInExpertiseLevel,
  SeminarInstagramFormat,
  SeminarLinkedInFormat,
  SeminarFacebookFormat,
  SeminarThreadsFormat,
  SeminarUrgencyLevel,
  SocialAccountPublic,
  SocialAccountFull,
  SocialAccountMetadata,
  CreateSocialAccountInput,
  UpdateSocialAccountInput,
  SocialPost,
  SocialPostWithRelations,
  SocialPostMetadata,
  CreateSocialPostInput,
  UpdateSocialPostInput,
  SocialPostFilters,
  SocialPostAnalytics,
  UpdateSocialPostAnalyticsInput,
  SocialTemplate,
  CreateSocialTemplateInput,
  UpdateSocialTemplateInput,
  SocialGenerationLog,
  CreateSocialGenerationLogInput,
  GenerationOptions,
  GeneratedContent,
  GenerateContentRequest,
  GenerateContentResponse,
  PublishBatchResult,
  PlatformSpecs,
  OptimalTimeSlot,
  SuggestedTime,
} from '@kairn/social';

export { IMPLEMENTED_PLATFORMS, PLATFORM_SPECS, OPTIMAL_POSTING_TIMES } from '@kairn/social';
