/**
 * Next.js Middleware for Psypnos
 *
 * Implements:
 * - Rate limiting for API routes
 * - Security headers (additional to those in next.config.mjs)
 *
 * Note: CSP is handled by next.config.mjs for consistent script handling.
 * Using nonce-based CSP in middleware requires complex integration with
 * Next.js script rendering that can cause JavaScript hydration failures.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration (per 15 minutes window)
const RATE_LIMIT_CONFIG = {
  // General API routes
  api: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
  // Auth routes (stricter)
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  // Contact form
  contact: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  // Admin routes
  admin: { maxRequests: 200, windowMs: 15 * 60 * 1000 },
} as const;

// In-memory rate limit store (for edge runtime)
// Note: In production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Extract client IP from request
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
 * Check rate limit for a request
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
  return { allowed: true, remaining: config.maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Clean up expired rate limit entries periodically
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // Periodic cleanup
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupRateLimitStore();
    lastCleanup = now;
  }

  // Skip rate limiting for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

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

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));
    return response;
  }

  // For HTML pages: Don't override CSP from next.config.mjs
  // The nonce-based CSP requires proper integration with Next.js which is complex
  // Security headers from next.config.mjs are sufficient for HTML pages
  // Only add additional security headers here (CSP is already set in next.config.mjs)
  const response = NextResponse.next();

  // Additional security headers (CSP is handled by next.config.mjs for consistency)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  );
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
