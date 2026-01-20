/**
 * API Response Cache Middleware
 *
 * Provides caching for API responses with support for:
 * - Conditional caching based on request method
 * - Cache key generation from request
 * - ETag support for conditional requests
 * - Cache-Control header generation
 * - Automatic cache invalidation on mutations
 */

import { Cache, getCache, CACHE_TTL, type CacheSetOptions } from '../cache';
import { createHash } from 'crypto';

/**
 * HTTP Cache-Control directives
 */
export interface CacheControlOptions {
  /** Enable public caching (CDN) */
  public?: boolean;
  /** Enable private caching (browser only) */
  private?: boolean;
  /** Max age in seconds */
  maxAge?: number;
  /** Shared max age for CDNs */
  sMaxAge?: number;
  /** Allow stale content while revalidating */
  staleWhileRevalidate?: number;
  /** Allow stale content if origin is unavailable */
  staleIfError?: number;
  /** Must revalidate before serving stale */
  mustRevalidate?: boolean;
  /** No caching at all */
  noCache?: boolean;
  /** No storage at all */
  noStore?: boolean;
  /** Response can be transformed by proxies */
  noTransform?: boolean;
  /** Immutable content */
  immutable?: boolean;
}

/**
 * API cache configuration
 */
export interface ApiCacheConfig {
  /** TTL in seconds */
  ttl?: number;
  /** Cache tags for invalidation */
  tags?: string[];
  /** Cache-Control options */
  cacheControl?: CacheControlOptions;
  /** Custom key generator */
  keyGenerator?: (request: ApiCacheRequest) => string;
  /** Condition to determine if response should be cached */
  shouldCache?: (response: ApiCacheResponse) => boolean;
  /** Whether to include query params in cache key */
  includeQueryParams?: boolean;
  /** Specific query params to include (if includeQueryParams is true) */
  queryParamsToInclude?: string[];
  /** Whether to vary cache by user */
  varyByUser?: boolean;
  /** Custom vary headers */
  varyHeaders?: string[];
}

/**
 * Minimal request interface for cache key generation
 */
export interface ApiCacheRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  userId?: string;
}

/**
 * Cached response structure
 */
export interface ApiCacheResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

/**
 * Cache result
 */
export interface CacheResult {
  hit: boolean;
  response: ApiCacheResponse | null;
  etag?: string;
}

/**
 * Generate ETag from response body
 */
function generateETag(body: unknown): string {
  const content = typeof body === 'string' ? body : JSON.stringify(body);
  const hash = createHash('md5').update(content).digest('hex');
  return `"${hash}"`;
}

/**
 * Build Cache-Control header value
 */
export function buildCacheControlHeader(options: CacheControlOptions): string {
  const directives: string[] = [];

  if (options.noStore) {
    return 'no-store';
  }

  if (options.noCache) {
    directives.push('no-cache');
  }

  if (options.public) {
    directives.push('public');
  } else if (options.private) {
    directives.push('private');
  }

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  if (options.staleIfError !== undefined) {
    directives.push(`stale-if-error=${options.staleIfError}`);
  }

  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }

  if (options.noTransform) {
    directives.push('no-transform');
  }

  if (options.immutable) {
    directives.push('immutable');
  }

  return directives.join(', ');
}

/**
 * Default cache key generator
 */
function defaultKeyGenerator(request: ApiCacheRequest, config: ApiCacheConfig): string {
  const parts: string[] = [request.method.toUpperCase(), request.url];

  // Add query params if configured
  if (config.includeQueryParams && request.query) {
    const params = config.queryParamsToInclude
      ? Object.fromEntries(
          Object.entries(request.query).filter(([key]) =>
            config.queryParamsToInclude!.includes(key)
          )
        )
      : request.query;

    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    if (sortedParams) {
      parts.push(sortedParams);
    }
  }

  // Add user ID if varying by user
  if (config.varyByUser && request.userId) {
    parts.push(`user:${request.userId}`);
  }

  // Add vary headers
  if (config.varyHeaders) {
    for (const header of config.varyHeaders) {
      const value = request.headers[header.toLowerCase()];
      if (value) {
        parts.push(`${header}:${Array.isArray(value) ? value.join(',') : value}`);
      }
    }
  }

  return `api:${parts.join(':')}`;
}

/**
 * API Cache Manager
 */
export class ApiCacheManager {
  private cache: Cache;
  private defaultConfig: ApiCacheConfig;

  constructor(cache?: Cache, defaultConfig?: ApiCacheConfig) {
    this.cache = cache ?? getCache();
    this.defaultConfig = {
      ttl: CACHE_TTL.MEDIUM,
      includeQueryParams: true,
      shouldCache: (response) => response.status >= 200 && response.status < 300,
      ...defaultConfig,
    };
  }

  /**
   * Check cache for a request
   */
  async get(request: ApiCacheRequest, config?: ApiCacheConfig): Promise<CacheResult> {
    // Only cache GET and HEAD requests
    if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
      return { hit: false, response: null };
    }

    const mergedConfig = { ...this.defaultConfig, ...config };
    const keyGenerator = mergedConfig.keyGenerator ?? ((r) => defaultKeyGenerator(r, mergedConfig));
    const key = keyGenerator(request);

    const cached = await this.cache.get<ApiCacheResponse & { etag: string }>(key);

    if (cached) {
      // Check If-None-Match header for conditional request
      const ifNoneMatch = request.headers['if-none-match'];
      if (ifNoneMatch && cached.etag === ifNoneMatch) {
        return {
          hit: true,
          response: { status: 304, body: null },
          etag: cached.etag,
        };
      }

      return {
        hit: true,
        response: {
          status: cached.status,
          body: cached.body,
          headers: cached.headers,
        },
        etag: cached.etag,
      };
    }

    return { hit: false, response: null };
  }

  /**
   * Store response in cache
   */
  async set(
    request: ApiCacheRequest,
    response: ApiCacheResponse,
    config?: ApiCacheConfig
  ): Promise<string> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // Check if response should be cached
    if (mergedConfig.shouldCache && !mergedConfig.shouldCache(response)) {
      return '';
    }

    const keyGenerator = mergedConfig.keyGenerator ?? ((r) => defaultKeyGenerator(r, mergedConfig));
    const key = keyGenerator(request);
    const etag = generateETag(response.body);

    const cacheOptions: CacheSetOptions = {
      ttl: mergedConfig.ttl,
      tags: mergedConfig.tags,
    };

    await this.cache.set(
      key,
      {
        ...response,
        etag,
      },
      cacheOptions
    );

    return etag;
  }

  /**
   * Invalidate cache for specific tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    return this.cache.invalidateByTag(tag);
  }

  /**
   * Invalidate cache by URL pattern
   */
  async invalidateByUrl(urlPattern: string): Promise<void> {
    await this.cache.invalidateByPattern(`api:*${urlPattern}*`);
  }

  /**
   * Get response headers for caching
   */
  getResponseHeaders(config?: ApiCacheConfig, etag?: string): Record<string, string> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const headers: Record<string, string> = {};

    // Cache-Control header
    if (mergedConfig.cacheControl) {
      headers['Cache-Control'] = buildCacheControlHeader(mergedConfig.cacheControl);
    } else if (mergedConfig.ttl) {
      headers['Cache-Control'] = buildCacheControlHeader({
        public: true,
        maxAge: mergedConfig.ttl,
        staleWhileRevalidate: 60,
      });
    }

    // ETag header
    if (etag) {
      headers['ETag'] = etag;
    }

    // Vary header
    const varyParts: string[] = [];
    if (mergedConfig.varyByUser) {
      varyParts.push('Authorization');
    }
    if (mergedConfig.varyHeaders) {
      varyParts.push(...mergedConfig.varyHeaders);
    }
    if (varyParts.length > 0) {
      headers['Vary'] = varyParts.join(', ');
    }

    return headers;
  }
}

/**
 * Pre-configured cache configurations for common scenarios
 */
export const API_CACHE_PRESETS = {
  /** Public data that changes rarely (e.g., site config) */
  static: {
    ttl: CACHE_TTL.DAY,
    cacheControl: {
      public: true,
      maxAge: CACHE_TTL.DAY,
      staleWhileRevalidate: CACHE_TTL.HOUR,
      immutable: false,
    },
  } satisfies ApiCacheConfig,

  /** Public data that changes occasionally (e.g., blog posts list) */
  public: {
    ttl: CACHE_TTL.LONG,
    cacheControl: {
      public: true,
      maxAge: CACHE_TTL.MEDIUM,
      sMaxAge: CACHE_TTL.LONG,
      staleWhileRevalidate: CACHE_TTL.MEDIUM,
    },
  } satisfies ApiCacheConfig,

  /** User-specific data */
  private: {
    ttl: CACHE_TTL.SHORT,
    varyByUser: true,
    cacheControl: {
      private: true,
      maxAge: CACHE_TTL.SHORT,
      mustRevalidate: true,
    },
  } satisfies ApiCacheConfig,

  /** Dynamic data that should be revalidated often */
  dynamic: {
    ttl: CACHE_TTL.SHORT,
    cacheControl: {
      public: true,
      maxAge: 0,
      sMaxAge: CACHE_TTL.SHORT,
      staleWhileRevalidate: CACHE_TTL.SHORT,
    },
  } satisfies ApiCacheConfig,

  /** No caching at all */
  none: {
    ttl: 0,
    cacheControl: {
      noStore: true,
    },
    shouldCache: () => false,
  } satisfies ApiCacheConfig,
} as const;

/**
 * Global API cache manager instance
 */
let globalApiCacheManager: ApiCacheManager | null = null;

/**
 * Get or create the global API cache manager
 */
export function getApiCacheManager(): ApiCacheManager {
  if (!globalApiCacheManager) {
    globalApiCacheManager = new ApiCacheManager();
  }
  return globalApiCacheManager;
}
