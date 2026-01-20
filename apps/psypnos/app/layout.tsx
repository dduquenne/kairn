import type { Metadata, Viewport } from 'next';
import { Open_Sans, Cormorant_Garamond } from 'next/font/google';
import { ToastProvider } from '@kairn/ui';
import { siteConfig } from '@/config/site.config';
import './globals.css';

// Fonts configuration
const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

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
  // verification: google verification is set in the site config if needed
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
    telephone: siteConfig.contact.phone,
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={siteConfig.locale}
      className={`${openSans.variable} ${cormorantGaramond.variable}`}
      suppressHydrationWarning
    >
      <head>
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
      <body className="min-h-screen bg-background font-sans antialiased">
        <ToastProvider position="top-right">
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-white"
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
