import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */

// Content Security Policy
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.resend.com https://*.supabase.co https://www.google-analytics.com;
  frame-src 'self' https://www.google.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const securityHeaders = [
  // DNS Prefetch Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  // HTTP Strict Transport Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Permissions Policy (disable unnecessary features)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  // Cross-Origin Policies
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
  // XSS Protection (legacy, but still useful for older browsers)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

const nextConfig = {
  // Transpiler les packages du monorepo
  transpilePackages: ['@kairn/ui', '@kairn/core', '@kairn/config', '@kairn/admin', '@kairn/analytics', '@kairn/blog', '@kairn/social', '@kairn/ai', '@kairn/api'],

  // Optimisations
  reactStrictMode: true,
  poweredByHeader: false,

  // Désactiver ESLint pendant le build (géré séparément)
  eslint: {
    ignoreDuringBuilds: true,
  },

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
    optimizePackageImports: [],
  },

  // Webpack configuration to ensure shared modules are not duplicated
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure @kairn/ui is treated as a singleton to preserve React context
      config.resolve.alias = {
        ...config.resolve.alias,
        '@kairn/ui': require.resolve('@kairn/ui'),
      };
    }
    return config;
  },

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

      // Pages statiques (ISR compatible)
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

  // Redirections
  async redirects() {
    return [
      // Redirections 301 : anciennes pages psychotherapeute vers psychotherapie
      {
        source: '/psychotherapeute-yonne',
        destination: '/psychotherapie-yonne',
        permanent: true,
      },
      {
        source: '/psychotherapeute-auxerre',
        destination: '/psychotherapie-auxerre',
        permanent: true,
      },
      {
        source: '/psychotherapeute-sens',
        destination: '/psychotherapie-sens',
        permanent: true,
      },
      {
        source: '/psychotherapeute-joigny',
        destination: '/psychotherapie-joigny',
        permanent: true,
      },
      {
        source: '/psychotherapeute-migennes',
        destination: '/psychotherapie-migennes',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
