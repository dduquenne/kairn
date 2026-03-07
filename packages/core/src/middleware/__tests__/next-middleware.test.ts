import { describe, it, expect, beforeEach } from 'vitest';

import {
  createMiddleware,
  getClientIP,
  generateCSPNonce,
  buildCSPHeader,
  EdgeMemoryRateLimitStore,
} from '../next-middleware';

// ── getClientIP ────────────────────────────────────────────────────────────

describe('getClientIP', () => {
  it("extrait l'IP depuis x-forwarded-for", () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIP(headers)).toBe('1.2.3.4');
  });

  it("extrait l'IP depuis x-real-ip", () => {
    const headers = new Headers({ 'x-real-ip': '10.0.0.1' });
    expect(getClientIP(headers)).toBe('10.0.0.1');
  });

  it("extrait l'IP depuis x-vercel-forwarded-for", () => {
    const headers = new Headers({ 'x-vercel-forwarded-for': '192.168.1.1, 10.0.0.1' });
    expect(getClientIP(headers)).toBe('192.168.1.1');
  });

  it("extrait l'IP depuis cf-connecting-ip", () => {
    const headers = new Headers({ 'cf-connecting-ip': '172.16.0.1' });
    expect(getClientIP(headers)).toBe('172.16.0.1');
  });

  it('retourne "unknown" sans headers', () => {
    const headers = new Headers();
    expect(getClientIP(headers)).toBe('unknown');
  });

  it('respecte la priorité des headers', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.1.1.1',
      'x-real-ip': '2.2.2.2',
      'cf-connecting-ip': '3.3.3.3',
    });
    expect(getClientIP(headers)).toBe('1.1.1.1');
  });
});

// ── generateCSPNonce ───────────────────────────────────────────────────────

describe('generateCSPNonce', () => {
  it('génère un nonce non vide', () => {
    const nonce = generateCSPNonce();
    expect(nonce).toBeTruthy();
    expect(nonce.length).toBeGreaterThan(0);
  });

  it('génère des nonces uniques', () => {
    const nonce1 = generateCSPNonce();
    const nonce2 = generateCSPNonce();
    expect(nonce1).not.toBe(nonce2);
  });
});

// ── buildCSPHeader ─────────────────────────────────────────────────────────

describe('buildCSPHeader', () => {
  it('inclut le nonce dans script-src', () => {
    const csp = buildCSPHeader('test-nonce');
    expect(csp).toContain("'nonce-test-nonce'");
    expect(csp).toContain("'strict-dynamic'");
  });

  it('inclut upgrade-insecure-requests par défaut', () => {
    const csp = buildCSPHeader('nonce');
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('exclut upgrade-insecure-requests si désactivé', () => {
    const csp = buildCSPHeader('nonce', undefined, false);
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('fusionne les directives personnalisées', () => {
    const csp = buildCSPHeader('nonce', {
      'connect-src': ["'self'", 'https://api.example.com'],
    });
    expect(csp).toContain('https://api.example.com');
  });
});

// ── EdgeMemoryRateLimitStore ───────────────────────────────────────────────

describe('EdgeMemoryRateLimitStore', () => {
  let store: EdgeMemoryRateLimitStore;

  beforeEach(() => {
    store = new EdgeMemoryRateLimitStore();
  });

  it('autorise les requêtes dans la limite', () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    const r1 = store.check('key', config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = store.check('key', config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = store.check('key', config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('bloque les requêtes au-delà de la limite', () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    store.check('key', config);
    const r2 = store.check('key', config);
    expect(r2.allowed).toBe(false);
    expect(r2.remaining).toBe(0);
  });

  it('isole les clés différentes', () => {
    const config = { maxRequests: 1, windowMs: 60000 };
    store.check('key1', config);
    const r = store.check('key2', config);
    expect(r.allowed).toBe(true);
  });

  it('nettoie les entrées expirées', () => {
    const config = { maxRequests: 1, windowMs: 1 }; // 1ms window
    store.check('key', config);

    // Attendre l'expiration
    const start = Date.now();
    while (Date.now() - start < 5) {
      // busy wait
    }

    store.cleanup();
    const r = store.check('key', config);
    expect(r.allowed).toBe(true);
  });
});

// ── createMiddleware ───────────────────────────────────────────────────────

describe('createMiddleware', () => {
  it('retourne un handler et un matcherConfig', () => {
    const { handler, matcherConfig } = createMiddleware({
      routeRules: [],
    });
    expect(handler).toBeTypeOf('function');
    expect(matcherConfig).toBeDefined();
    expect(matcherConfig.matcher).toBeDefined();
  });

  it('ignore les routes statiques', () => {
    const { handler } = createMiddleware({ routeRules: [] });

    const headers = new Headers();
    const request = { headers, nextUrl: { pathname: '/_next/static/chunk.js' } };

    let responseCreated = false;
    handler(
      request,
      () => {
        responseCreated = true;
        return { headers: new Headers() };
      },
      () => ({ headers: new Headers() })
    );
    expect(responseCreated).toBe(true);
  });

  it('applique la CSP sur les pages HTML', () => {
    const { handler } = createMiddleware({ routeRules: [] });

    const request = {
      headers: new Headers(),
      nextUrl: { pathname: '/about' },
    };

    const response = handler(
      request,
      ({ requestHeaders }) => {
        expect(requestHeaders.get('x-nonce')).toBeTruthy();
        return { headers: new Headers() };
      },
      () => ({ headers: new Headers() })
    );

    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
  });

  it('applique le rate limiting sur les routes API', () => {
    const { handler } = createMiddleware({
      routeRules: [{ pattern: '/api/auth', rateLimit: { maxRequests: 1, windowMs: 60000 } }],
    });

    const request = {
      headers: new Headers({ 'x-forwarded-for': '1.2.3.4' }),
      nextUrl: { pathname: '/api/auth/login' },
    };

    // Première requête autorisée
    const r1 = handler(
      request,
      () => ({ headers: new Headers() }),
      (body, opts) => ({ headers: new Headers(opts.headers), status: opts.status, body })
    );
    expect((r1 as { status?: number }).status).toBeUndefined();

    // Deuxième requête bloquée
    const r2 = handler(
      request,
      () => ({ headers: new Headers() }),
      (body, opts) => ({ headers: new Headers(opts.headers), status: opts.status, body })
    );
    expect((r2 as { status: number }).status).toBe(429);
  });

  it('isole le rate limiting par siteId', () => {
    const { handler: handlerA } = createMiddleware({
      routeRules: [{ pattern: '/api/auth', rateLimit: { maxRequests: 1, windowMs: 60000 } }],
      siteId: 'site-a',
    });
    const { handler: handlerB } = createMiddleware({
      routeRules: [{ pattern: '/api/auth', rateLimit: { maxRequests: 1, windowMs: 60000 } }],
      siteId: 'site-b',
    });

    const request = {
      headers: new Headers({ 'x-forwarded-for': '1.2.3.4' }),
      nextUrl: { pathname: '/api/auth/login' },
    };

    // Exhaust site A
    handlerA(
      request,
      () => ({ headers: new Headers() }),
      (body, opts) => ({ headers: new Headers(opts.headers), status: opts.status, body })
    );
    const r2 = handlerA(
      request,
      () => ({ headers: new Headers() }),
      (body, opts) => ({ headers: new Headers(opts.headers), status: opts.status, body })
    );
    expect((r2 as { status: number }).status).toBe(429);

    // Site B should still allow requests (different store)
    const rB = handlerB(
      request,
      () => ({ headers: new Headers() }),
      (body, opts) => ({ headers: new Headers(opts.headers), status: opts.status, body })
    );
    expect((rB as { status?: number }).status).toBeUndefined();
  });

  it('exclut les routes CRON du rate limiting', () => {
    const { handler } = createMiddleware({
      routeRules: [],
      defaultApiRateLimit: { maxRequests: 1, windowMs: 60000 },
      rateLimitSkipPatterns: ['/api/cron'],
    });

    const request = {
      headers: new Headers({ 'x-forwarded-for': '1.2.3.4' }),
      nextUrl: { pathname: '/api/cron/cleanup' },
    };

    // Multiple CRON requests should always be allowed
    for (let i = 0; i < 5; i++) {
      const r = handler(
        request,
        () => ({ headers: new Headers() }),
        (body, opts) => ({ headers: new Headers(opts.headers), status: opts.status, body })
      );
      expect((r as { status?: number }).status).toBeUndefined();
    }
  });

  it('utilise le defaultApiRateLimit pour les routes API sans règle spécifique', () => {
    const { handler } = createMiddleware({
      routeRules: [],
      defaultApiRateLimit: { maxRequests: 1, windowMs: 60000 },
    });

    const request = {
      headers: new Headers({ 'x-forwarded-for': '5.5.5.5' }),
      nextUrl: { pathname: '/api/some-endpoint' },
    };

    handler(
      request,
      () => ({ headers: new Headers() }),
      () => ({ headers: new Headers() })
    );

    const r2 = handler(
      request,
      () => ({ headers: new Headers() }),
      (body, opts) => ({ headers: new Headers(opts.headers), status: opts.status, body })
    );
    expect((r2 as { status: number }).status).toBe(429);
  });
});
