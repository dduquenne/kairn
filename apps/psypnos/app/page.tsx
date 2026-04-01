/**
 * Page d'accueil de Psypnos - Server Component
 *
 * Cette page utilise le Server-Side Rendering pour précharger les données
 * directement via les mêmes fonctions Prisma que les API routes.
 *
 * Les sections avec données dynamiques reçoivent leurs données initiales
 * en props, permettant un rendu instantané.
 *
 * @version 2.1.0 - ISR enabled (revalidate=120s) for CDN caching
 */

// ISR: revalidate every 120 seconds for fresh data with CDN caching
// During build, DATABASE_URL is available via Vercel environment
export const revalidate = 120;

import { Footer } from '../components/Footer';
import { NavigationMenu } from '../components/NavigationMenu';

import { ApproachSection } from './(pages)/sections/approach';
import { BlogSection } from './(pages)/sections/blog';
import { ContactSection } from './(pages)/sections/contact';
import { SessionFormatsSection } from './(pages)/sections/formats';
import { HeroSection } from './(pages)/sections/hero';
import { JourneySection } from './(pages)/sections/journey';
import { PricingSection } from './(pages)/sections/pricing';
import { RespirationSection } from './(pages)/sections/respiration';
import { SeminarsSection } from './(pages)/sections/seminars';
import { TestimonialsSection } from './(pages)/sections/testimonials';
import { TherapySections } from './(pages)/sections/therapy';
import { getAllBlogPosts as getAPIBlogPosts, type BlogPostSummary } from './api/blog/prisma-store';
import {
  getUpcomingSeminars as getAPISeminars,
  getAllSeminars as getAllAPISeminars,
  type SeminarOutput,
} from './api/seminars/prisma-store';
import {
  getAllTestimonials as getAPITestimonials,
  type TestimonialOutput,
} from './api/testimonials/prisma-store';

/**
 * Fetch data with isolated error handling per section.
 * Each section fetches independently so one failure doesn't break the others.
 */
async function fetchHomePageData(): Promise<{
  seminars: SeminarOutput[];
  blogPosts: BlogPostSummary[];
  testimonials: TestimonialOutput[];
  blogError: boolean;
}> {
  const [seminarsResult, blogResult, testimonialsResult] = await Promise.allSettled([
    (async () => {
      const seminars = await getAPISeminars(3);
      if (seminars.length === 0) {
        const allSeminars = await getAllAPISeminars();
        return allSeminars.slice(0, 3);
      }
      return seminars;
    })(),
    getAPIBlogPosts({ limit: 3, featuredFirst: true }),
    getAPITestimonials(10),
  ]);

  if (seminarsResult.status === 'rejected') {
    // eslint-disable-next-line no-console
    console.error('[HomePage SSR] Erreur fetch séminaires:', seminarsResult.reason);
  }
  if (blogResult.status === 'rejected') {
    // eslint-disable-next-line no-console
    console.error('[HomePage SSR] Erreur fetch blog:', blogResult.reason);
  }
  if (testimonialsResult.status === 'rejected') {
    // eslint-disable-next-line no-console
    console.error('[HomePage SSR] Erreur fetch témoignages:', testimonialsResult.reason);
  }

  return {
    seminars: seminarsResult.status === 'fulfilled' ? seminarsResult.value : [],
    blogPosts: blogResult.status === 'fulfilled' ? blogResult.value : [],
    testimonials: testimonialsResult.status === 'fulfilled' ? testimonialsResult.value : [],
    blogError: blogResult.status === 'rejected',
  };
}

export default async function HomePage() {
  const {
    seminars: seminarsData,
    blogPosts: blogPostsData,
    testimonials: testimonialsData,
    blogError: blogFetchError,
  } = await fetchHomePageData();

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
        <BlogSection initialData={blogPostsData} ssrError={blogFetchError} />
        <TestimonialsSection initialData={testimonialsData} />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
