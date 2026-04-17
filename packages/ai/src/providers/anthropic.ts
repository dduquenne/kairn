/**
 * Anthropic (Claude) AI Provider implementation
 * @package @kairn/ai
 */

import type Anthropic from '@anthropic-ai/sdk';
import type {
  Message,
  MessageCreateParamsNonStreaming,
  TextBlock,
} from '@anthropic-ai/sdk/resources/messages';

import { CLAUDE_DEFAULT_MODEL } from '../models.js';

import {
  AIProvider,
  AnthropicProviderConfig,
  GenerateTextOptions,
  TextGenerationResult,
  AIProviderError,
  AITimeoutError,
  AIRateLimitError,
  AIAuthenticationError,
} from './types.js';
const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_TIMEOUT_MS = 120000; // 2 minutes

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  readonly defaultTextModel: string;
  private client: Anthropic | null = null;
  private readonly config: AnthropicProviderConfig;

  constructor(config: AnthropicProviderConfig) {
    this.config = config;
    this.defaultTextModel = config.model || CLAUDE_DEFAULT_MODEL;
  }

  /**
   * Lazily initialize the Anthropic client
   */
  private async getClient(): Promise<Anthropic> {
    if (this.client) {
      return this.client;
    }

    try {
      // Dynamic import to avoid requiring the SDK when not used
      const { default: AnthropicSDK } = await import('@anthropic-ai/sdk');
      this.client = new AnthropicSDK({
        apiKey: this.config.apiKey,
        ...(this.config.baseUrl && { baseURL: this.config.baseUrl }),
      });
      return this.client;
    } catch (error) {
      throw new AIProviderError(
        'Failed to initialize Anthropic SDK. Make sure @anthropic-ai/sdk is installed.',
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

    const params: MessageCreateParamsNonStreaming = {
      model: this.defaultTextModel,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      ...(options.systemPrompt && { system: options.systemPrompt }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.stopSequences && { stop_sequences: options.stopSequences }),
    };

    try {
      const response = await this.withTimeout(client.messages.create(params), timeoutMs);

      return this.parseResponse(response, startTime);
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

    const params: MessageCreateParamsNonStreaming = {
      model: this.defaultTextModel,
      max_tokens: maxTokens,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      ...(options.systemPrompt && { system: options.systemPrompt }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.stopSequences && { stop_sequences: options.stopSequences }),
    };

    try {
      const response = await this.withTimeout(client.messages.create(params), timeoutMs);

      return this.parseResponse(response, startTime);
    } catch (error) {
      throw this.handleError(error, startTime);
    }
  }

  private parseResponse(response: Message, startTime: number): TextGenerationResult {
    const content = response.content
      .filter((block): block is TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    let stopReason: TextGenerationResult['stopReason'] = 'end_turn';
    if (response.stop_reason === 'max_tokens') {
      stopReason = 'max_tokens';
    } else if (response.stop_reason === 'stop_sequence') {
      stopReason = 'stop_sequence';
    }

    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
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

    // Handle Anthropic SDK errors
    if (error && typeof error === 'object' && 'status' in error) {
      const err = error as { status: number; message?: string; error?: { type?: string } };

      if (err.status === 401) {
        return new AIAuthenticationError(this.name);
      }

      if (err.status === 429) {
        return new AIRateLimitError(this.name);
      }

      const isRetriable = err.status >= 500 || err.status === 408;
      return new AIProviderError(
        err.message || 'Unknown Anthropic error',
        this.name,
        err.error?.type || 'UNKNOWN',
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
 * Create an Anthropic provider with configuration
 */
export function createAnthropicProvider(config: AnthropicProviderConfig): AnthropicProvider {
  return new AnthropicProvider(config);
}

/**
 * Create an Anthropic provider from environment variables
 */
export function createAnthropicProviderFromEnv(): AnthropicProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new AIProviderError(
      'ANTHROPIC_API_KEY environment variable is not set',
      'anthropic',
      'CONFIG_ERROR'
    );
  }

  return new AnthropicProvider({
    apiKey,
    model: process.env.ANTHROPIC_MODEL,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
  });
}
