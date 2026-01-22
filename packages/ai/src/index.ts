/**
 * @kairn/ai - AI Services Abstraction for Kairn Platform
 *
 * This package provides a unified interface for AI services including:
 * - Text generation (Anthropic Claude, OpenAI GPT)
 * - Image generation (OpenAI DALL-E)
 * - Content generation (blog articles)
 * - Social media post generation
 * - Text improvement
 *
 * @example
 * ```typescript
 * import {
 *   createAnthropicProviderFromEnv,
 *   createOpenAIProviderFromEnv,
 *   createContentGenerator,
 *   createSocialGenerator,
 *   createImageGenerator,
 * } from "@kairn/ai";
 *
 * // Create providers
 * const anthropic = createAnthropicProviderFromEnv();
 * const openai = createOpenAIProviderFromEnv();
 *
 * // Create services
 * const contentGenerator = createContentGenerator(anthropic);
 * const socialGenerator = createSocialGenerator(anthropic);
 * const imageGenerator = createImageGenerator(anthropic, openai);
 *
 * // Generate content
 * const article = await contentGenerator.generateFullArticle({
 *   topic: "Les bienfaits de la méditation",
 *   length: "medium",
 *   tone: "educational",
 * });
 *
 * // Generate social posts
 * const posts = await socialGenerator.generateForPlatforms(
 *   article.content,
 *   article.title,
 *   ["linkedin", "instagram", "facebook"]
 * );
 *
 * // Generate images
 * const images = await imageGenerator.generateFromArticle(
 *   article.title,
 *   article.content,
 *   { name: "MyBrand", colors: ["#c7a962", "#0e1f2f"] }
 * );
 * ```
 *
 * @packageDocumentation
 */

// ============================================
// Providers
// ============================================

export {
  // Types
  type AIProvider,
  type GenerateTextOptions,
  type GenerateImageOptions,
  type TextGenerationResult,
  type ImageGenerationResult,
  type AnthropicProviderConfig,
  type OpenAIProviderConfig,
  type RetryOptions,

  // Error classes
  AIProviderError,
  AITimeoutError,
  AIRateLimitError,
  AIAuthenticationError,

  // Zod schemas
  GenerateTextOptionsSchema,
  GenerateImageOptionsSchema,

  // Anthropic
  AnthropicProvider,
  createAnthropicProvider,
  createAnthropicProviderFromEnv,

  // OpenAI
  OpenAIProvider,
  createOpenAIProvider,
  createOpenAIProviderFromEnv,
} from './providers/index.js';

// ============================================
// Services
// ============================================

export {
  // Types
  type ArticleTone,
  type ArticleLength,
  type ArticleCategory,
  type ArticleGenerationOptions,
  type GeneratedArticle,
  type ArticleOutline,
  type SocialPlatform,
  type SocialTone,
  type SocialAngle,
  type SocialFormat,
  type SocialPostGenerationOptions,
  type GeneratedSocialPost,
  type MultiPlatformPosts,
  type ImageGenerationOptions,
  type GeneratedImage,
  type ImprovementType,
  type TextImprovementOptions,
  type ImprovedText,

  // Zod schemas
  ArticleGenerationOptionsSchema,
  SocialPostGenerationOptionsSchema,
  TextImprovementOptionsSchema,

  // Content Generator
  ContentGenerator,
  createContentGenerator,

  // Social Generator
  SocialGenerator,
  createSocialGenerator,

  // Image Generator
  ImageGenerator,
  createImageGenerator,
  createImageGeneratorSingleProvider,

  // Text Improver
  TextImprover,
  createTextImprover,
} from './services/index.js';

// ============================================
// Prompts
// ============================================

export {
  // Blog article prompts
  buildArticlePrompt,
  buildOutlinePrompt,
  buildSectionPrompt,
  buildFaqPrompt,
  buildMetaDescriptionPrompt,
  buildTagsPrompt,
  LENGTH_CONFIG,
  TONE_DESCRIPTIONS,
  DEFAULT_SYSTEM_PROMPT,
  type ArticlePromptConfig,

  // Social post prompts
  buildSocialPostPrompt,
  buildMultiPlatformPrompt,
  PLATFORM_CONFIG,
  SOCIAL_TONE_DESCRIPTIONS,
  SOCIAL_ANGLE_DESCRIPTIONS,
  INSTAGRAM_FORMATS,
  THREADS_FORMATS,
  LINKEDIN_FORMATS,
  type SocialPromptConfig,

  // Image prompts
  buildImagePrompt,
  buildBrandedImagePrompt,
  buildImageDescriptionPrompt,
  buildImageVariationsPrompt,
  STYLE_DESCRIPTIONS,
  MOOD_DESCRIPTIONS,
  type ImagePromptConfig,
  type BrandedImageConfig,
  type ImageStyle,
  type ImageMood,
  type ImageSubject,
} from './prompts/index.js';

// ============================================
// Utilities
// ============================================

export {
  // Retry utilities
  withRetry,
  createRetryable,
  isRetriableError,
  sleep,
  calculateDelay,
  type RetryConfig,

  // Parsing utilities
  parseJsonSafe,
  extractXmlBlock,
  extractAllXmlBlocks,
  validateXmlTags,
  parseList,
  parseFaq,
  cleanMarkdown,
} from './utils/index.js';
