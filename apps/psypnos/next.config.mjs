/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpiler les packages du monorepo
  transpilePackages: ['@kairn/ui', '@kairn/core', '@kairn/config'],

  // Optimisations
  reactStrictMode: true,
  poweredByHeader: false,

  // Configuration des images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirections
  async redirects() {
    return [
      // Ajouter les redirections spécifiques ici
    ];
  },
};

export default nextConfig;
