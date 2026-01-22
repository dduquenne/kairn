/**
 * AI Services exports
 * @package @kairn/ai
 */

// Types
export type {
  ArticleTone,
  ArticleLength,
  ArticleCategory,
  ArticleGenerationOptions,
  GeneratedArticle,
  ArticleOutline,
  SocialPlatform,
  SocialTone,
  SocialAngle,
  SocialFormat,
  SocialPostGenerationOptions,
  GeneratedSocialPost,
  MultiPlatformPosts,
  ImageGenerationOptions,
  GeneratedImage,
  ImprovementType,
  TextImprovementOptions,
  ImprovedText,
} from './types.js';

// Zod schemas
export {
  ArticleGenerationOptionsSchema,
  SocialPostGenerationOptionsSchema,
  TextImprovementOptionsSchema,
} from './types.js';

// Content Generator
export { ContentGenerator, createContentGenerator } from './content-generator.js';

// Social Generator
export { SocialGenerator, createSocialGenerator } from './social-generator.js';

// Image Generator
export {
  ImageGenerator,
  createImageGenerator,
  createImageGeneratorSingleProvider,
} from './image-generator.js';

// Text Improver
export { TextImprover, createTextImprover } from './text-improver.js';
