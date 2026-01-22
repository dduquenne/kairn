/**
 * Retry utilities with exponential backoff
 * @package @kairn/ai
 */

import { AIProviderError } from '../providers/types.js';

export interface RetryConfig {
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

const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, 'onRetry' | 'isRetriable'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
};

/**
 * Default function to determine if an error is retriable
 */
export function isRetriableError(error: unknown): boolean {
  // Check AIProviderError
  if (error instanceof AIProviderError) {
    return error.isRetriable;
  }

  // Check standard Error message
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('rate_limit') ||
      message.includes('overloaded') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('network')
    );
  }

  // Check HTTP-like errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 || status === 408 || status === 429;
  }

  return false;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for a given retry attempt with exponential backoff
 */
export function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  backoffMultiplier: number,
  maxDelayMs: number
): number {
  const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, maxDelayMs);
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn Function to execute
 * @param config Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => provider.generateText(prompt),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error}`);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries,
    initialDelayMs = DEFAULT_RETRY_CONFIG.initialDelayMs,
    backoffMultiplier = DEFAULT_RETRY_CONFIG.backoffMultiplier,
    maxDelayMs = DEFAULT_RETRY_CONFIG.maxDelayMs,
    isRetriable = isRetriableError,
    onRetry,
  } = config;

  let lastError: unknown;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > maxRetries || !isRetriable(error)) {
        throw error;
      }

      const delay = calculateDelay(attempt, initialDelayMs, backoffMultiplier, maxDelayMs);

      if (onRetry) {
        onRetry(attempt, error, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of an async function
 *
 * @param fn Function to wrap
 * @param config Retry configuration
 * @returns Wrapped function with retry logic
 *
 * @example
 * ```typescript
 * const generateWithRetry = createRetryable(
 *   (prompt: string) => provider.generateText(prompt),
 *   { maxRetries: 3 }
 * );
 * const result = await generateWithRetry("Hello");
 * ```
 */
export function createRetryable<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: RetryConfig = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), config);
}
