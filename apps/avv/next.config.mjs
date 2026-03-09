import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */

// Security headers (CSP is set dynamically via middleware with nonce — see middleware.ts)
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

const nextConfig = {
  // Transpiler les packages du monorepo
  transpilePackages: ['@kairn/ui', '@kairn/core', '@kairn/config', '@kairn/admin', '@kairn/analytics', '@kairn/blog', '@kairn/social', '@kairn/ai'],

  // Optimisations
  reactStrictMode: true,
  poweredByHeader: false,

  // Configuration des images optimisée
  images: {
    // Formats modernes avec fallback
    formats: ['image/avif', 'image/webp'],
    // Tailles d'écran pour responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Tailles d'images pour les composants
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Durée du cache des images optimisées (7 jours)
    minimumCacheTTL: 604800,
    // Domains autorisés
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Désactiver le blur placeholder en production pour performances
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
  },

  // Optimisation des packages
  // Note: @kairn/ui removed from optimizePackageImports to preserve React context sharing
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
    // Enable system TLS certs for Turbopack to fetch Google Fonts
    turbopackUseSystemTlsCerts: true,
  },

  // Exclude large directories from serverless function bundles (moved from experimental)
  outputFileTracingExcludes: {
    '/api/**': [
      './public/**',
      './data/**',
      './.next/cache/**',
    ],
  },

  // Set the root for file tracing in monorepo
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,

  // Turbopack configuration (Next.js 16+)
  // Note: Turbopack handles monorepo packages better than Webpack, no alias needed
  turbopack: {},

  // Headers de sécurité et cache
  async headers() {
    return [
      // Security headers pour toutes les pages
      {
        source: '/:path*',
        headers: securityHeaders,
      },

      // ============================================
      // STATIC ASSETS - Long-term caching
      // ============================================

      // Images statiques (1 an, immutable)
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // Fonts (1 an, immutable)
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // Fichiers JS/CSS générés par Next.js (1 an, immutable)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // ============================================
      // API ENDPOINTS - Varied caching strategies
      // ============================================

      // API publiques (cache CDN 5 min, stale-while-revalidate 30 min)
      {
        source: '/api/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=1800',
          },
        ],
      },

      // API blog posts (cache CDN 10 min)
      {
        source: '/api/blog/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=3600',
          },
        ],
      },

      // API testimonials (cache CDN 30 min)
      {
        source: '/api/testimonials/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1800, stale-while-revalidate=3600',
          },
        ],
      },

      // API d'authentification - pas de cache
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },

      // API admin - pas de cache
      {
        source: '/api/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },

      // ============================================
      // PAGES - Smart caching
      // ============================================

      // Homepage - ISR cache (revalidate=120s in page.tsx)
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=120, stale-while-revalidate=86400',
          },
        ],
      },

      // Other pages (ISR compatible)
      {
        source: '/((?!api|_next|admin).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=86400',
          },
        ],
      },

      // Favicon et manifest (1 semaine)
      {
        source: '/(favicon.ico|site.webmanifest|robots.txt|sitemap.xml)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  // Redirections 301 — doivent correspondre à geoConfig.redirects (lib/geo-config.ts)
  async redirects() {
    return [
      { source: '/relaxologue-yonne', destination: '/sophrologie-yonne', permanent: true },
      { source: '/relaxologue-auxerre', destination: '/sophrologie-auxerre', permanent: true },
      { source: '/relaxologue-sens', destination: '/sophrologie-sens', permanent: true },
      { source: '/relaxologue-joigny', destination: '/sophrologie-joigny', permanent: true },
      { source: '/relaxologue-migennes', destination: '/sophrologie-migennes', permanent: true },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
