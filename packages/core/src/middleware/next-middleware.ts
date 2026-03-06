/**
 * Factory pour créer un middleware Next.js réutilisable
 *
 * Centralise la logique commune des middlewares Next.js :
 * - Rate limiting par type de route (in-memory ou store externe)
 * - Extraction IP client (Vercel, Cloudflare, proxy)
 * - Génération de nonce CSP
 * - Application des headers de sécurité
 * - Cleanup périodique du store
 *
 * @module next-middleware
 */

// Rate limit imports are available via the middleware index for consumers

// ── Types ──────────────────────────────────────────────────────────────────

/** Configuration du rate limiting par type de route */
export interface MiddlewareRateLimitConfig {
  /** Nombre maximum de requêtes dans la fenêtre */
  maxRequests: number;
  /** Durée de la fenêtre en millisecondes */
  windowMs: number;
}

/** Règle de routage pour le rate limiting */
export interface MiddlewareRouteRule {
  /** Pattern de l'URL (startsWith) */
  pattern: string;
  /** Configuration de rate limiting pour cette route */
  rateLimit: MiddlewareRateLimitConfig;
}

/** Directives CSP personnalisées */
export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'frame-ancestors'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'object-src'?: string[];
  [key: string]: string[] | undefined;
}

/** Configuration complète du middleware */
export interface MiddlewareConfig {
  /** Règles de rate limiting par route (testées dans l'ordre) */
  routeRules: MiddlewareRouteRule[];
  /** Configuration de rate limiting par défaut pour les routes API */
  defaultApiRateLimit?: MiddlewareRateLimitConfig;
  /** Patterns de routes statiques à ignorer */
  staticPatterns?: string[];
  /** Directives CSP personnalisées (fusionnées avec les defaults) */
  cspDirectives?: CSPDirectives;
  /** Activer upgrade-insecure-requests dans la CSP */
  upgradeInsecureRequests?: boolean;
  /** Store externe pour le rate limiting (défaut: in-memory) */
  rateLimitStore?: EdgeRateLimitStore;
  /** Intervalle de cleanup du store in-memory en ms (défaut: 5 min) */
  cleanupIntervalMs?: number;
}

/** Résultat d'une vérification de rate limit */
export interface MiddlewareRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/** Interface minimale d'un store rate limit compatible Edge Runtime */
export interface EdgeRateLimitStore {
  /** Vérifie et incrémente le compteur pour une clé */
  check(key: string, config: MiddlewareRateLimitConfig): MiddlewareRateLimitResult;
  /** Nettoie les entrées expirées */
  cleanup(): void;
}

/** Interface minimale d'une requête Next.js */
export interface NextMiddlewareRequest {
  headers: Headers;
  nextUrl: { pathname: string };
}

/** Interface minimale d'une réponse Next.js */
export interface NextMiddlewareResponse {
  headers: Headers;
}

// ── Store in-memory compatible Edge Runtime ─────────────────────────────

/**
 * Store in-memory pour le rate limiting dans les middlewares Edge
 *
 * Compatible Edge Runtime (pas de dépendance Node.js).
 * Pour une solution partagée entre instances Serverless, injecter un store Redis.
 */
export class EdgeMemoryRateLimitStore implements EdgeRateLimitStore {
  private store = new Map<string, { count: number; resetAt: number }>();

  /**
   * Vérifie et incrémente le compteur pour une clé
   *
   * @param key - Clé unique (ex: "auth:192.168.1.1")
   * @param config - Configuration de rate limiting
   * @returns Résultat avec allowed, remaining, resetAt
   */
  check(key: string, config: MiddlewareRateLimitConfig): MiddlewareRateLimitResult {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      const resetAt = now + config.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: config.maxRequests - 1, resetAt };
    }

    if (record.count >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  /**
   * Nettoie les entrées expirées du store
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// ── Extraction IP client ────────────────────────────────────────────────

/**
 * Extrait l'adresse IP du client depuis les headers de la requête
 *
 * Ordre de priorité :
 * 1. x-forwarded-for (premier IP de la chaîne)
 * 2. x-real-ip
 * 3. x-vercel-forwarded-for (spécifique Vercel)
 * 4. cf-connecting-ip (spécifique Cloudflare)
 * 5. 'unknown' en fallback
 *
 * @param headers - Headers de la requête
 * @returns Adresse IP du client
 */
export function getClientIP(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const firstIp = vercelIp.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  return 'unknown';
}

// ── Génération nonce CSP ────────────────────────────────────────────────

/**
 * Génère un nonce cryptographique pour la CSP (compatible Edge Runtime)
 *
 * @returns Nonce encodé en base64
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let hex = '';
  for (let i = 0; i < array.length; i++) {
    const byte = array[i] ?? 0;
    hex += byte.toString(16).padStart(2, '0');
  }
  return btoa(hex);
}

// ── Construction CSP ────────────────────────────────────────────────────

const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

/**
 * Construit le header Content-Security-Policy avec un nonce
 *
 * @param nonce - Nonce cryptographique
 * @param customDirectives - Directives CSP personnalisées (fusionnées avec les defaults)
 * @param upgradeInsecureRequests - Ajouter upgrade-insecure-requests
 * @returns Header CSP complet
 */
export function buildCSPHeader(
  nonce: string,
  customDirectives?: CSPDirectives,
  upgradeInsecureRequests = true
): string {
  const directives: CSPDirectives = { ...DEFAULT_CSP_DIRECTIVES };

  // Fusionner les directives personnalisées
  if (customDirectives) {
    for (const [key, values] of Object.entries(customDirectives)) {
      if (values) {
        directives[key] = values;
      }
    }
  }

  // Ajouter le nonce à script-src
  const scriptSrc = directives['script-src'] || ["'self'"];
  directives['script-src'] = [`'nonce-${nonce}'`, "'strict-dynamic'", ...scriptSrc];

  const parts: string[] = [];
  for (const [key, values] of Object.entries(directives)) {
    if (values && values.length > 0) {
      parts.push(`${key} ${values.join(' ')}`);
    }
  }

  if (upgradeInsecureRequests) {
    parts.push('upgrade-insecure-requests');
  }

  return parts.join('; ');
}

// ── Factory createMiddleware ────────────────────────────────────────────

const DEFAULT_STATIC_PATTERNS = ['/_next', '/images', '/fonts'];
const DEFAULT_CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Crée un middleware Next.js avec rate limiting, CSP et headers de sécurité
 *
 * @param config - Configuration du middleware
 * @returns Fonction middleware compatible Next.js
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createMiddleware } from '@kairn/core';
 *
 * const { middleware, config } = createMiddleware({
 *   routeRules: [
 *     { pattern: '/api/auth', rateLimit: { maxRequests: 10, windowMs: 15 * 60 * 1000 } },
 *     { pattern: '/api/contact', rateLimit: { maxRequests: 5, windowMs: 60 * 60 * 1000 } },
 *   ],
 *   defaultApiRateLimit: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
 *   cspDirectives: {
 *     'script-src': ["'self'", 'https://www.google.com'],
 *     'connect-src': ["'self'", 'https://api.resend.com'],
 *   },
 * });
 *
 * export { middleware, config };
 * ```
 */
export function createMiddleware(middlewareConfig: MiddlewareConfig) {
  const store = middlewareConfig.rateLimitStore ?? new EdgeMemoryRateLimitStore();
  const staticPatterns = middlewareConfig.staticPatterns ?? DEFAULT_STATIC_PATTERNS;
  const cleanupInterval = middlewareConfig.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL;

  let lastCleanup = Date.now();

  /**
   * Détermine la règle de rate limiting pour un pathname
   */
  function getRouteRule(pathname: string): MiddlewareRouteRule | null {
    for (const rule of middlewareConfig.routeRules) {
      if (pathname.startsWith(rule.pattern)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Vérifie si le pathname est une route statique à ignorer
   */
  function isStaticRoute(pathname: string): boolean {
    if (pathname.includes('.')) return true;
    return staticPatterns.some(p => pathname.startsWith(p));
  }

  /**
   * Handler de middleware
   *
   * @param request - Requête Next.js entrante
   * @param createResponse - Factory pour créer la réponse NextResponse.next()
   * @param createErrorResponse - Factory pour créer une réponse d'erreur 429
   * @returns Réponse middleware
   */
  function handler<TReq extends NextMiddlewareRequest, TRes extends NextMiddlewareResponse>(
    request: TReq,
    createResponse: (options: { requestHeaders: Headers }) => TRes,
    createErrorResponse: (
      body: string,
      options: {
        status: number;
        headers: Record<string, string>;
      }
    ) => TRes
  ): TRes {
    const { pathname } = request.nextUrl;

    // Cleanup périodique
    const now = Date.now();
    if (now - lastCleanup > cleanupInterval) {
      store.cleanup();
      lastCleanup = now;
    }

    // Ignorer les routes statiques
    if (isStaticRoute(pathname)) {
      return createResponse({ requestHeaders: request.headers });
    }

    // Générer le nonce CSP
    const nonce = generateCSPNonce();
    const cspHeader = buildCSPHeader(
      nonce,
      middlewareConfig.cspDirectives,
      middlewareConfig.upgradeInsecureRequests ?? true
    );

    // Préparer les headers de requête avec le nonce
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    // Déterminer le rate limiting
    const routeRule = getRouteRule(pathname);
    const isApiRoute = pathname.startsWith('/api');
    const rateLimitConfig =
      routeRule?.rateLimit ?? (isApiRoute ? middlewareConfig.defaultApiRateLimit : null);

    if (rateLimitConfig) {
      const ip = getClientIP(request.headers);
      const key = `${routeRule?.pattern ?? 'api'}:${ip}`;
      const result = store.check(key, rateLimitConfig);

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - now) / 1000);
        return createErrorResponse(
          JSON.stringify({
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(result.resetAt),
              'Retry-After': String(retryAfter),
            },
          }
        );
      }

      const response = createResponse({ requestHeaders });
      response.headers.set('X-RateLimit-Limit', String(rateLimitConfig.maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(result.resetAt));
      response.headers.set('Content-Security-Policy', cspHeader);
      return response;
    }

    // Pas de rate limiting — appliquer uniquement la CSP
    const response = createResponse({ requestHeaders });
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  return {
    handler,
    /** Config matcher standard pour Next.js */
    matcherConfig: {
      matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)'],
    },
  };
}
