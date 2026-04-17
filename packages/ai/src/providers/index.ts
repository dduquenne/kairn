/**
 * AI Providers exports
 * @package @kairn/ai
 */

// Model constants
export {
  CLAUDE_DEFAULT_MODEL,
  OPENAI_DEFAULT_TEXT_MODEL,
  OPENAI_DEFAULT_IMAGE_MODEL,
} from '../models.js';

// Types
export type {
  AIProvider,
  GenerateTextOptions,
  GenerateImageOptions,
  TextGenerationResult,
  ImageGenerationResult,
  AnthropicProviderConfig,
  OpenAIProviderConfig,
  RetryOptions,
} from './types.js';

// Error classes
export {
  AIProviderError,
  AITimeoutError,
  AIRateLimitError,
  AIAuthenticationError,
} from './types.js';

// Zod schemas
export { GenerateTextOptionsSchema, GenerateImageOptionsSchema } from './types.js';

// Anthropic provider
export {
  AnthropicProvider,
  createAnthropicProvider,
  createAnthropicProviderFromEnv,
} from './anthropic.js';

// OpenAI provider
export { OpenAIProvider, createOpenAIProvider, createOpenAIProviderFromEnv } from './openai.js';
