import { ToastProvider } from '@kairn/ui';
import type { Metadata, Viewport } from 'next';

import { siteConfig } from '../config/site.config';

import './globals.css';

// Metadata
export const metadata: Metadata = {
  metadataBase: new URL(`https://${siteConfig.domain}`),
  title: {
    default: `${siteConfig.name} - ${siteConfig.practitioner.title}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.seo.description,
  keywords: siteConfig.seo.keywords,
  authors: [{ name: siteConfig.practitioner.name }],
  creator: siteConfig.practitioner.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: `https://${siteConfig.domain}`,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - ${siteConfig.practitioner.title}`,
    description: siteConfig.seo.description,
    ...(siteConfig.seo.ogImage && {
      images: [
        {
          url: siteConfig.seo.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    }),
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - ${siteConfig.practitioner.title}`,
    description: siteConfig.seo.description,
    ...(siteConfig.seo.ogImage && { images: [siteConfig.seo.ogImage] }),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: `https://${siteConfig.domain}`,
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.theme.colors.primary,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD Structured Data
function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://${siteConfig.domain}`,
    name: siteConfig.name,
    description: siteConfig.seo.description,
    url: `https://${siteConfig.domain}`,
    email: siteConfig.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.address.street,
      addressLocality: siteConfig.contact.address.city,
      postalCode: siteConfig.contact.address.postalCode,
      addressCountry: siteConfig.contact.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.contact.coordinates.lat,
      longitude: siteConfig.contact.coordinates.lng,
    },
    priceRange: '€€',
    image: `https://${siteConfig.domain}/images/og-image.jpg`,
    founder: {
      '@type': 'Person',
      name: siteConfig.practitioner.name,
      jobTitle: siteConfig.practitioner.title,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteConfig.locale} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load fonts via stylesheet (more reliable than next/font during build) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData()),
          }}
        />
      </head>
      <body className="bg-background min-h-screen font-sans antialiased">
        <ToastProvider position="top-right">
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="focus:bg-primary sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:text-white"
          >
            Aller au contenu principal
          </a>

          {/* Main layout structure */}
          <div className="relative flex min-h-screen flex-col">
            {/* Header will be added here */}

            {/* Main content */}
            <main id="main-content" className="flex-1">
              {children}
            </main>

            {/* Footer will be added here */}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
