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
// (not during build when DATABASE_URL may not be available)
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable ISR completely
export const fetchCache = 'force-no-store';

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

    // The API store functions already return properly formatted data
    seminarsData = seminarsRaw as unknown as SeminarData[];
    blogPostsData = blogPostsRaw as unknown as BlogPostData[];
    testimonialsData = testimonialsRaw as unknown as TestimonialData[];
  } catch (error) {
    // Log error but don't break the page - sections will show loading state
    // eslint-disable-next-line no-console
    console.error('[HomePage SSR] Error fetching data:', error);
  }

  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      {/* Navigation sticky - apparaît au scroll */}
      <NavigationMenu />

      {/* Hero - loaded immediately (above the fold) */}
      <HeroSection />

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
