/**
 * Image Generation Service
 * @package @kairn/ai
 */

import {
  buildImagePrompt,
  buildBrandedImagePrompt,
  buildImageDescriptionPrompt,
  buildImageVariationsPrompt,
  type ImagePromptConfig,
  type BrandedImageConfig,
} from '../prompts/image-prompt.js';
import type { AIProvider, RetryOptions } from '../providers/types.js';
import { withRetry } from '../utils/retry.js';

import type { GeneratedImage, ImageGenerationOptions } from './types.js';

// ============================================
// Image Generator Service
// ============================================

export class ImageGenerator {
  private textProvider: AIProvider;
  private imageProvider: AIProvider;
  private retryOptions: RetryOptions;

  /**
   * Create an image generator
   * @param textProvider Provider for text generation (prompt creation)
   * @param imageProvider Provider for image generation (must support generateImage)
   */
  constructor(
    textProvider: AIProvider,
    imageProvider: AIProvider,
    options: {
      retryOptions?: RetryOptions;
    } = {}
  ) {
    this.textProvider = textProvider;
    this.imageProvider = imageProvider;
    this.retryOptions = options.retryOptions || {
      maxRetries: 2,
      initialDelayMs: 2000,
      backoffMultiplier: 2,
    };

    if (!this.imageProvider.generateImage) {
      throw new Error(
        `Image provider "${this.imageProvider.name}" does not support image generation`
      );
    }
  }

  /**
   * Generate images from a prompt configuration
   */
  async generateFromConfig(
    config: ImagePromptConfig,
    options: Omit<ImageGenerationOptions, 'prompt'> = {}
  ): Promise<GeneratedImage[]> {
    const prompt = buildImagePrompt(config);
    return this.generate({ ...options, prompt });
  }

  /**
   * Generate branded images with brand guidelines
   */
  async generateBranded(
    config: BrandedImageConfig,
    options: Omit<ImageGenerationOptions, 'prompt'> = {}
  ): Promise<GeneratedImage[]> {
    const prompt = buildBrandedImagePrompt(config);
    return this.generate({ ...options, prompt });
  }

  /**
   * Generate images from article content
   * First generates a prompt from the article, then generates images
   */
  async generateFromArticle(
    articleTitle: string,
    articleContent: string,
    brandConfig?: {
      name: string;
      colors: string[];
      style?: string;
    },
    options: Omit<ImageGenerationOptions, 'prompt'> = {}
  ): Promise<{
    images: GeneratedImage[];
    generatedPrompt: string;
    metadata: { promptTokens: number };
  }> {
    // First, generate the image prompt from the article
    const promptGenerationPrompt = buildImageDescriptionPrompt(
      articleTitle,
      articleContent,
      brandConfig
    );

    const promptResult = await withRetry(
      () =>
        this.textProvider.generateText(promptGenerationPrompt, {
          maxTokens: 500,
          temperature: 0.7,
        }),
      this.retryOptions
    );

    const generatedPrompt = promptResult.content.trim();

    // Generate images using the generated prompt
    const images = await this.generate({
      ...options,
      prompt: generatedPrompt,
    });

    return {
      images,
      generatedPrompt,
      metadata: {
        promptTokens: promptResult.totalTokens,
      },
    };
  }

  /**
   * Generate multiple image variations
   */
  async generateVariations(
    baseConfig: ImagePromptConfig,
    count: number = 3,
    options: Omit<ImageGenerationOptions, 'prompt' | 'count'> = {}
  ): Promise<GeneratedImage[]> {
    const basePrompt = buildImagePrompt(baseConfig);
    const prompts = buildImageVariationsPrompt(basePrompt, count);

    const results: GeneratedImage[] = [];

    // Generate each variation
    for (const prompt of prompts) {
      const images = await this.generate({
        ...options,
        prompt,
        count: 1,
      });
      results.push(...images);
    }

    return results;
  }

  /**
   * Core image generation method
   */
  async generate(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    const { prompt, count = 1, size, quality, style } = options;

    if (!this.imageProvider.generateImage) {
      throw new Error('Image provider does not support image generation');
    }

    const startTime = Date.now();

    const result = await withRetry(
      () =>
        this.imageProvider.generateImage!(prompt, {
          count,
          size,
          quality,
          style,
        }),
      this.retryOptions
    );

    return result.images.map(img => ({
      url: img.url,
      base64: img.base64,
      revisedPrompt: img.revisedPrompt,
      metadata: {
        durationMs: Date.now() - startTime,
        model: result.model,
      },
    }));
  }

  /**
   * Enhance a basic prompt with more details
   */
  async enhancePrompt(basicPrompt: string): Promise<string> {
    const enhancementPrompt = `Enhance this image generation prompt to be more detailed and visually descriptive:

"${basicPrompt}"

Add:
- Specific visual details (lighting, composition, textures)
- Color descriptions
- Atmosphere and mood
- Technical quality instructions

Return only the enhanced prompt, no explanations.`;

    const result = await withRetry(
      () =>
        this.textProvider.generateText(enhancementPrompt, {
          maxTokens: 500,
          temperature: 0.5,
        }),
      this.retryOptions
    );

    return result.content.trim();
  }
}

/**
 * Create an image generator with the given providers
 */
export function createImageGenerator(
  textProvider: AIProvider,
  imageProvider: AIProvider,
  options?: {
    retryOptions?: RetryOptions;
  }
): ImageGenerator {
  return new ImageGenerator(textProvider, imageProvider, options);
}

/**
 * Create an image generator with a single provider that supports both text and images
 */
export function createImageGeneratorSingleProvider(
  provider: AIProvider,
  options?: {
    retryOptions?: RetryOptions;
  }
): ImageGenerator {
  if (!provider.generateImage) {
    throw new Error(
      `Provider "${provider.name}" does not support image generation. Use createImageGenerator with separate text and image providers.`
    );
  }
  return new ImageGenerator(provider, provider, options);
}
