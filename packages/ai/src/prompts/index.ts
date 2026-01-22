/**
 * Prompt templates exports
 * @package @kairn/ai
 */

// Blog article prompts
export {
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
} from './blog-article.js';

// Social post prompts
export {
  buildSocialPostPrompt,
  buildMultiPlatformPrompt,
  PLATFORM_CONFIG,
  SOCIAL_TONE_DESCRIPTIONS,
  SOCIAL_ANGLE_DESCRIPTIONS,
  INSTAGRAM_FORMATS,
  THREADS_FORMATS,
  LINKEDIN_FORMATS,
  type SocialPromptConfig,
} from './social-post.js';

// Image prompts
export {
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
} from './image-prompt.js';
