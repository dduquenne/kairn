/**
 * Next.js Middleware for Appréciez Votre Vie (AVV)
 *
 * Utilise la factory createMiddleware de @kairn/core pour :
 * - Nonce-based Content Security Policy (CSP) pour la protection XSS
 * - Rate limiting par type de route (in-memory)
 *
 * Note: Static security headers are set in next.config.mjs (single source of truth)
 */

import { createMiddleware } from '@kairn/core/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { handler, matcherConfig } = createMiddleware({
  siteId: 'avv',
  rateLimitSkipPatterns: ['/api/cron'],
  routeRules: [
    { pattern: '/api/auth', rateLimit: { maxRequests: 10, windowMs: 15 * 60 * 1000 } },
    { pattern: '/api/contact', rateLimit: { maxRequests: 5, windowMs: 60 * 60 * 1000 } },
    { pattern: '/api/admin', rateLimit: { maxRequests: 200, windowMs: 15 * 60 * 1000 } },
  ],
  defaultApiRateLimit: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
  cspDirectives: {
    'script-src': [
      "'self'",
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://www.clarity.ms',
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': [
      "'self'",
      'https://api.resend.com',
      'https://*.supabase.co',
      'https://www.google-analytics.com',
      'https://api.anthropic.com',
      'https://api.openai.com',
      'https://www.clarity.ms',
    ],
    'frame-src': ["'self'", 'https://www.google.com'],
  },
});

/**
 * Middleware Next.js — délègue à la factory @kairn/core
 */
export function middleware(request: NextRequest) {
  return handler(
    request,
    ({ requestHeaders }) => {
      return NextResponse.next({ request: { headers: requestHeaders } });
    },
    (body, options) => {
      return new NextResponse(body, {
        status: options.status,
        headers: options.headers,
      });
    }
  );
}

// Next.js requiert un objet statique pour la config du middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)'],
};
