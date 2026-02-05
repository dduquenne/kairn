/**
 * Page d'accueil de Psypnos - Server Component
 *
 * Cette page utilise le Server-Side Rendering pour précharger les données
 * directement via les mêmes fonctions Prisma que les API routes.
 *
 * Les sections avec données dynamiques reçoivent leurs données initiales
 * en props, permettant un rendu instantané.
 */

// Force dynamic rendering to ensure database queries run at request time
export const dynamic = 'force-dynamic';

import { Footer } from '../components/Footer';
import { NavigationMenu } from '../components/NavigationMenu';
import type { SeminarData, BlogPostData, TestimonialData } from '../lib/server/data-fetchers';

// Import the exact same functions used by the working API routes

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
import { getAllBlogPosts as getAPIBlogPosts } from './api/blog/prisma-store';
import {
  getUpcomingSeminars as getAPISeminars,
  getAllSeminars as getAllAPISeminars,
} from './api/seminars/prisma-store';
import { getAllTestimonials as getAPITestimonials } from './api/testimonials/prisma-store';

export default async function HomePage() {
  // Fetch data using the same functions as the API routes
  let seminarsData: SeminarData[] = [];
  let blogPostsData: BlogPostData[] = [];
  let testimonialsData: TestimonialData[] = [];
  let ssrError: string | null = null;

  try {
    // Get upcoming seminars, fallback to all if none upcoming
    let seminarsRaw = await getAPISeminars(3);
    if (seminarsRaw.length === 0) {
      const allSeminars = await getAllAPISeminars();
      seminarsRaw = allSeminars.slice(0, 3);
    }

    // Get blog posts with featured first
    const blogPostsRaw = await getAPIBlogPosts({ limit: 3, featuredFirst: true });

    // Get testimonials
    const testimonialsRaw = await getAPITestimonials(10);

    // eslint-disable-next-line no-console
    console.log('[HomePage SSR] Data fetched via API store functions:', {
      seminars: seminarsRaw.length,
      blogPosts: blogPostsRaw.length,
      testimonials: testimonialsRaw.length,
    });

    // The API store functions already return properly formatted data
    // Just cast to the expected types
    seminarsData = seminarsRaw as unknown as SeminarData[];

    // BlogPostSummary matches BlogPostData
    blogPostsData = blogPostsRaw as unknown as BlogPostData[];

    // TestimonialOutput matches TestimonialData
    testimonialsData = testimonialsRaw as unknown as TestimonialData[];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[HomePage SSR] ERROR:', error);
    ssrError = error instanceof Error ? error.message : String(error);
  }

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
