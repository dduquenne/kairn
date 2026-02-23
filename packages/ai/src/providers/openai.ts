/**
 * OpenAI (GPT + DALL-E) AI Provider implementation
 * @package @kairn/ai
 */

import type OpenAI from 'openai';
import type { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import {
  AIProvider,
  OpenAIProviderConfig,
  GenerateTextOptions,
  GenerateImageOptions,
  TextGenerationResult,
  ImageGenerationResult,
  AIProviderError,
  AITimeoutError,
  AIRateLimitError,
  AIAuthenticationError,
} from './types.js';

const DEFAULT_TEXT_MODEL = 'gpt-4o';
const DEFAULT_IMAGE_MODEL = 'dall-e-3';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_MS = 120000; // 2 minutes

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly defaultTextModel: string;
  readonly defaultImageModel: string;
  private client: OpenAI | null = null;
  private readonly config: OpenAIProviderConfig;

  constructor(config: OpenAIProviderConfig) {
    this.config = config;
    this.defaultTextModel = config.textModel || DEFAULT_TEXT_MODEL;
    this.defaultImageModel = config.imageModel || DEFAULT_IMAGE_MODEL;
  }

  /**
   * Lazily initialize the OpenAI client
   */
  private async getClient(): Promise<OpenAI> {
    if (this.client) {
      return this.client;
    }

    try {
      // Dynamic import to avoid requiring the SDK when not used
      const { default: OpenAISDK } = await import('openai');
      this.client = new OpenAISDK({
        apiKey: this.config.apiKey,
        ...(this.config.organization && { organization: this.config.organization }),
        ...(this.config.baseUrl && { baseURL: this.config.baseUrl }),
      });
      return this.client;
    } catch (error) {
      throw new AIProviderError(
        'Failed to initialize OpenAI SDK. Make sure openai is installed.',
        this.name,
        'SDK_INIT_ERROR'
      );
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async generateText(
    prompt: string,
    options: GenerateTextOptions = {}
  ): Promise<TextGenerationResult> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new AIAuthenticationError(this.name);
    }

    const client = await this.getClient();

    const maxTokens = options.maxTokens ?? this.config.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;
    const timeoutMs = options.timeoutMs ?? this.config.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;

    const messages: ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const response = await this.withTimeout(
        client.chat.completions.create({
          model: this.defaultTextModel,
          messages,
          max_completion_tokens: maxTokens,
          ...(options.temperature !== undefined && { temperature: options.temperature }),
          ...(options.stopSequences && { stop: options.stopSequences }),
        }),
        timeoutMs
      );

      return this.parseTextResponse(response, startTime);
    } catch (error) {
      throw this.handleError(error, startTime);
    }
  }

  async generateFromMessages(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: GenerateTextOptions = {}
  ): Promise<TextGenerationResult> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new AIAuthenticationError(this.name);
    }

    const client = await this.getClient();

    const maxTokens = options.maxTokens ?? this.config.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;
    const timeoutMs = options.timeoutMs ?? this.config.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;

    const chatMessages: ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      chatMessages.push({ role: 'system', content: options.systemPrompt });
    }

    chatMessages.push(
      ...messages.map(m => ({
        role: m.role,
        content: m.content,
      }))
    );

    try {
      const response = await this.withTimeout(
        client.chat.completions.create({
          model: this.defaultTextModel,
          messages: chatMessages,
          max_completion_tokens: maxTokens,
          ...(options.temperature !== undefined && { temperature: options.temperature }),
          ...(options.stopSequences && { stop: options.stopSequences }),
        }),
        timeoutMs
      );

      return this.parseTextResponse(response, startTime);
    } catch (error) {
      throw this.handleError(error, startTime);
    }
  }

  async generateImage(
    prompt: string,
    options: GenerateImageOptions = {}
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new AIAuthenticationError(this.name);
    }

    const client = await this.getClient();

    const timeoutMs = options.timeoutMs ?? this.config.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    const count = options.count ?? 1;

    try {
      const response = await this.withTimeout(
        client.images.generate({
          model: this.defaultImageModel,
          prompt,
          n: count,
          size: options.size ?? '1792x1024',
          quality: options.quality ?? 'hd',
          style: options.style ?? 'vivid',
          response_format: 'url',
        }),
        timeoutMs
      );

      return {
        images: (response.data || []).map(img => ({
          url: img.url,
          revisedPrompt: img.revised_prompt,
        })),
        model: this.defaultImageModel,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      throw this.handleError(error, startTime);
    }
  }

  private parseTextResponse(response: ChatCompletion, startTime: number): TextGenerationResult {
    const choice = response.choices[0];
    const content = choice?.message?.content || '';

    let stopReason: TextGenerationResult['stopReason'] = 'end_turn';
    if (choice?.finish_reason === 'length') {
      stopReason = 'max_tokens';
    } else if (choice?.finish_reason === 'stop') {
      stopReason = 'end_turn';
    }

    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      content,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      model: response.model,
      stopReason,
      durationMs: Date.now() - startTime,
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new AITimeoutError(this.name, timeoutMs));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  private handleError(error: unknown, _startTime: number): AIProviderError {
    if (error instanceof AIProviderError) {
      return error;
    }

    // Handle OpenAI SDK errors
    if (error && typeof error === 'object' && 'status' in error) {
      const err = error as { status: number; message?: string; code?: string };

      if (err.status === 401) {
        return new AIAuthenticationError(this.name);
      }

      if (err.status === 429) {
        return new AIRateLimitError(this.name);
      }

      const isRetriable = err.status >= 500 || err.status === 408;
      return new AIProviderError(
        err.message || 'Unknown OpenAI error',
        this.name,
        err.code || 'UNKNOWN',
        err.status,
        isRetriable
      );
    }

    // Handle network errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const isRetriable =
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        message.includes('network');

      return new AIProviderError(error.message, this.name, 'NETWORK_ERROR', undefined, isRetriable);
    }

    return new AIProviderError('Unknown error occurred', this.name, 'UNKNOWN', undefined, false);
  }
}

/**
 * Create an OpenAI provider with configuration
 */
export function createOpenAIProvider(config: OpenAIProviderConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}

/**
 * Create an OpenAI provider from environment variables
 */
export function createOpenAIProviderFromEnv(): OpenAIProvider {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AIProviderError(
      'OPENAI_API_KEY environment variable is not set',
      'openai',
      'CONFIG_ERROR'
    );
  }

  return new OpenAIProvider({
    apiKey,
    textModel: process.env.OPENAI_TEXT_MODEL,
    imageModel: process.env.OPENAI_IMAGE_MODEL,
    organization: process.env.OPENAI_ORGANIZATION,
    baseUrl: process.env.OPENAI_BASE_URL,
  });
}
