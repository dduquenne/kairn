/**
 * Page d'accueil de Psypnos - Server Component
 *
 * Cette page utilise le Server-Side Rendering pour précharger les données
 * via les API routes internes, évitant les problèmes de fetch côté client.
 *
 * Les sections avec données dynamiques reçoivent leurs données initiales
 * en props, permettant un rendu instantané.
 */

// Force dynamic rendering to ensure API calls run at request time
export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';

import { Footer } from '../components/Footer';
import { NavigationMenu } from '../components/NavigationMenu';
import type { SeminarData, BlogPostData, TestimonialData } from '../lib/server/data-fetchers';

import { ApproachSection } from './(pages)/sections/approach';
import { BlogSection } from './(pages)/sections/blog';
import { RespirationSection, ContactSection } from './(pages)/sections/dynamic-sections';
import { SessionFormatsSection } from './(pages)/sections/formats';
import { HeroSection } from './(pages)/sections/hero';
import { JourneySection } from './(pages)/sections/journey';
import { PricingSection } from './(pages)/sections/pricing';
import { SeminarsSection } from './(pages)/sections/seminars';
import { TestimonialsSection } from './(pages)/sections/testimonials';
import { TherapySections } from './(pages)/sections/therapy';

/**
 * Fetch data from internal API routes for SSR
 * Using internal fetch ensures we go through the same code path as client requests
 */
async function fetchSSRData() {
  // Get the host from headers for internal API calls
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // eslint-disable-next-line no-console
  console.log('[HomePage SSR] Fetching from:', baseUrl);

  try {
    const [seminarsRes, blogRes, testimonialsRes] = await Promise.all([
      fetch(`${baseUrl}/api/seminars?upcoming=true&limit=3`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/blog/posts?limit=3&featuredFirst=true`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/testimonials?limit=10`, { cache: 'no-store' }),
    ]);

    const seminars = seminarsRes.ok ? await seminarsRes.json() : [];
    const blogPosts = blogRes.ok ? await blogRes.json() : [];
    const testimonials = testimonialsRes.ok ? await testimonialsRes.json() : [];

    // eslint-disable-next-line no-console
    console.log('[HomePage SSR] Data fetched:', {
      seminars: seminars.length,
      blogPosts: blogPosts.length,
      testimonials: testimonials.length,
    });

    return { seminars, blogPosts, testimonials, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[HomePage SSR] ERROR:', error);
    return {
      seminars: [],
      blogPosts: [],
      testimonials: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default async function HomePage() {
  const { seminars, blogPosts, testimonials, error: ssrError } = await fetchSSRData();

  // Type assertions to match expected interfaces
  const seminarsData = seminars as SeminarData[];
  const blogPostsData = blogPosts as BlogPostData[];
  const testimonialsData = testimonials as TestimonialData[];

  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      {/* Navigation sticky - apparaît au scroll */}
      <NavigationMenu />

      {/* Hero - loaded immediately (above the fold) */}
      <HeroSection />

      {/* Debug: Show SSR error if any */}
      {ssrError && (
        <div className="m-4 rounded border border-red-500 bg-red-900/50 p-4 text-red-200">
          <strong>SSR Error:</strong> {ssrError}
        </div>
      )}

      <main>
        {/* Sections statiques - rendu côté serveur */}
        <ApproachSection />
        <JourneySection />
        <SessionFormatsSection />
        <PricingSection />
        <TherapySections />
        <RespirationSection />
        {/* Sections avec données préchargées via API routes */}
        <SeminarsSection initialData={seminarsData} />
        <BlogSection initialData={blogPostsData} />
        <TestimonialsSection initialData={testimonialsData} />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
