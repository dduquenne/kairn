/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Utilitaires pour les appels fetch robustes avec timeout et retry logic
 */

/**
 * Ajoute un timeout à un appel fetch
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Retry avec backoff exponentiel
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Ne pas retry si c'est la dernière tentative ou si shouldRetry retourne false
      if (attempt === maxRetries - 1 || !shouldRetry(error)) {
        throw error;
      }

      // Calculer le délai avec backoff exponentiel
      const delayMs = Math.min(
        initialDelayMs * Math.pow(2, attempt),
        maxDelayMs
      );

      // Attendre avant de réessayer
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Combine timeout et retry pour les appels fetch
 */
export async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit = {},
  config: {
    timeoutMs?: number;
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<Response> {
  const {
    timeoutMs = 10000,
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
  } = config;

  return retryWithBackoff(
    () => fetchWithTimeout(url, options, timeoutMs),
    {
      maxRetries,
      initialDelayMs,
      maxDelayMs,
      shouldRetry: (error) => {
        // Ne pas retry sur les erreurs 4xx (erreurs client)
        // Retry uniquement sur les erreurs réseau et 5xx (erreurs serveur)
        if (error instanceof Response) {
          return error.status >= 500;
        }
        return true;
      },
    }
  );
}
