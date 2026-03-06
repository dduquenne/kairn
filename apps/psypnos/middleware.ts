/**
 * Next.js Middleware for Psypnos
 *
 * Implements:
 * - Nonce-based Content Security Policy (CSP) for XSS protection
 * - Rate limiting for API routes (single point of enforcement)
 * Note: Static security headers are set in next.config.mjs (single source of truth)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration (per window)
const RATE_LIMIT_CONFIG = {
  api: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  contact: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  admin: { maxRequests: 200, windowMs: 15 * 60 * 1000 },
} as const;

// In-memory rate limit store (for Edge Runtime)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const firstIp = vercelIp.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  return 'unknown';
}

/**
 * Check rate limit for a given key
 */
function checkRateLimit(
  key: string,
  config: { maxRequests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
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
 * Clean up expired rate limit entries
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Generate a cryptographic nonce for CSP (Edge Runtime compatible)
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let hex = '';
  for (let i = 0; i < array.length; i++) {
    hex += array[i]!.toString(16).padStart(2, '0');
  }
  return btoa(hex);
}

/**
 * Build Content Security Policy with nonce
 *
 * - script-src uses nonce + strict-dynamic (no unsafe-inline/unsafe-eval)
 * - style-src keeps unsafe-inline (lower XSS risk, needed for Tailwind/Next.js)
 */
function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.google.com https://www.gstatic.com https://www.clarity.ms`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.resend.com https://*.supabase.co https://www.google-analytics.com https://api.anthropic.com https://api.openai.com https://www.clarity.ms",
    "frame-src 'self' https://www.google.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // Periodic cleanup
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupRateLimitStore();
    lastCleanup = now;
  }

  // Skip for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Generate nonce for CSP
  const nonce = generateNonce();
  const cspHeader = buildCSP(nonce);

  // Determine rate limit config based on route
  let rateLimitKey: keyof typeof RATE_LIMIT_CONFIG = 'api';
  let shouldRateLimit = false;

  if (pathname.startsWith('/api/auth')) {
    rateLimitKey = 'auth';
    shouldRateLimit = true;
  } else if (pathname.startsWith('/api/contact')) {
    rateLimitKey = 'contact';
    shouldRateLimit = true;
  } else if (pathname.startsWith('/api/admin')) {
    rateLimitKey = 'admin';
    shouldRateLimit = true;
  } else if (pathname.startsWith('/api')) {
    rateLimitKey = 'api';
    shouldRateLimit = true;
  }

  // Check rate limit for API routes
  if (shouldRateLimit) {
    const config = RATE_LIMIT_CONFIG[rateLimitKey];
    const key = `${rateLimitKey}:${ip}`;
    const result = checkRateLimit(key, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - now) / 1000);
      return new NextResponse(
        JSON.stringify({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // Pass nonce to downstream via request header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  // For HTML pages: set nonce-based CSP and pass nonce via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)'],
};
