/**
 * Types for AI Provider abstraction
 * @package @kairn/ai
 */

import { z } from 'zod';

// ============================================
// Generation Options
// ============================================

export interface GenerateTextOptions {
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** System prompt to set the AI behavior */
  systemPrompt?: string;
  /** Stop sequences to end generation */
  stopSequences?: string[];
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

export interface GenerateImageOptions {
  /** Image size */
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  /** Quality level */
  quality?: 'standard' | 'hd';
  /** Style of the image */
  style?: 'vivid' | 'natural';
  /** Number of images to generate */
  count?: number;
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

// ============================================
// Generation Results
// ============================================

export interface TextGenerationResult {
  /** Generated text content */
  content: string;
  /** Tokens used for input */
  inputTokens: number;
  /** Tokens used for output */
  outputTokens: number;
  /** Total tokens used */
  totalTokens: number;
  /** Model used for generation */
  model: string;
  /** Stop reason */
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'timeout' | 'error';
  /** Generation duration in milliseconds */
  durationMs: number;
}

export interface ImageGenerationResult {
  /** Array of generated image URLs or base64 data */
  images: Array<{
    url?: string;
    base64?: string;
    revisedPrompt?: string;
  }>;
  /** Model used for generation */
  model: string;
  /** Generation duration in milliseconds */
  durationMs: number;
}

// ============================================
// Provider Interface
// ============================================

export interface AIProvider {
  /** Provider name for identification */
  readonly name: string;

  /** Default model for text generation */
  readonly defaultTextModel: string;

  /** Default model for image generation (if supported) */
  readonly defaultImageModel?: string;

  /**
   * Generate text from a prompt
   * @param prompt The user prompt
   * @param options Generation options
   * @returns Promise with generation result
   */
  generateText(prompt: string, options?: GenerateTextOptions): Promise<TextGenerationResult>;

  /**
   * Generate text from messages (chat format)
   * @param messages Array of messages
   * @param options Generation options
   * @returns Promise with generation result
   */
  generateFromMessages?(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: GenerateTextOptions
  ): Promise<TextGenerationResult>;

  /**
   * Generate images from a prompt (optional, not all providers support this)
   * @param prompt The image generation prompt
   * @param options Image generation options
   * @returns Promise with image generation result
   */
  generateImage?(prompt: string, options?: GenerateImageOptions): Promise<ImageGenerationResult>;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;
}

// ============================================
// Provider Configuration
// ============================================

export interface AnthropicProviderConfig {
  /** Anthropic API key */
  apiKey: string;
  /** Model to use (default: claude-sonnet-4-5-20250929) */
  model?: string;
  /** Base URL for API (optional, for proxies) */
  baseUrl?: string;
  /** Default max tokens */
  defaultMaxTokens?: number;
  /** Default timeout in milliseconds */
  defaultTimeoutMs?: number;
}

export interface OpenAIProviderConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Model to use for text (default: gpt-4o) */
  textModel?: string;
  /** Model to use for images (default: dall-e-3) */
  imageModel?: string;
  /** Organization ID (optional) */
  organization?: string;
  /** Base URL for API (optional, for proxies) */
  baseUrl?: string;
  /** Default max tokens */
  defaultMaxTokens?: number;
  /** Default timeout in milliseconds */
  defaultTimeoutMs?: number;
}

// ============================================
// Retry Configuration
// ============================================

export interface RetryOptions {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;
  /** Initial delay between retries in ms (default: 1000) */
  initialDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay between retries in ms (default: 30000) */
  maxDelayMs?: number;
  /** Custom function to determine if an error is retriable */
  isRetriable?: (error: unknown) => boolean;
  /** Callback called on each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

// ============================================
// Zod Schemas for Validation
// ============================================

export const GenerateTextOptionsSchema = z.object({
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(1).optional(),
  systemPrompt: z.string().optional(),
  stopSequences: z.array(z.string()).optional(),
  timeoutMs: z.number().positive().optional(),
});

export const GenerateImageOptionsSchema = z.object({
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional(),
  count: z.number().min(1).max(4).optional(),
  timeoutMs: z.number().positive().optional(),
});

// ============================================
// Error Types
// ============================================

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly isRetriable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class AITimeoutError extends AIProviderError {
  constructor(provider: string, timeoutMs: number) {
    super(`AI request timed out after ${timeoutMs}ms`, provider, 'TIMEOUT', undefined, true);
    this.name = 'AITimeoutError';
  }
}

export class AIRateLimitError extends AIProviderError {
  constructor(provider: string, retryAfter?: number) {
    super(
      `Rate limit exceeded${retryAfter ? `, retry after ${retryAfter}s` : ''}`,
      provider,
      'RATE_LIMIT',
      429,
      true
    );
    this.name = 'AIRateLimitError';
  }
}

export class AIAuthenticationError extends AIProviderError {
  constructor(provider: string) {
    super(`Authentication failed for ${provider}`, provider, 'AUTH_ERROR', 401, false);
    this.name = 'AIAuthenticationError';
  }
}
