/**
 * Page d'accueil de Psypnos - Server Component
 *
 * Cette page utilise le Server-Side Rendering pour précharger les données
 * directement depuis la base de données via Prisma, évitant les problèmes
 * de fetch côté client sur Vercel.
 *
 * Les sections avec données dynamiques reçoivent leurs données initiales
 * en props, permettant un rendu instantané.
 */

// Force dynamic rendering to ensure database queries run at request time
// (not during build when DATABASE_URL may not be available)
export const dynamic = 'force-dynamic';

import { Footer } from '../components/Footer';
import { NavigationMenu } from '../components/NavigationMenu';
import {
  getUpcomingSeminars,
  getFeaturedBlogPosts,
  getTestimonials,
} from '../lib/server/data-fetchers';

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

export default async function HomePage() {
  console.log('[HomePage] Starting data fetch...');
  console.log('[HomePage] VERCEL_URL:', process.env.VERCEL_URL);

  // Prefetch all data in parallel
  let seminars, blogPosts, testimonials;
  try {
    [seminars, blogPosts, testimonials] = await Promise.all([
      getUpcomingSeminars(3),
      getFeaturedBlogPosts(3),
      getTestimonials(10),
    ]);
    console.log('[HomePage] Fetched data:', {
      seminars: seminars?.length ?? 'undefined',
      blogPosts: blogPosts?.length ?? 'undefined',
      testimonials: testimonials?.length ?? 'undefined',
    });
  } catch (error) {
    console.error('[HomePage] Error fetching data:', error);
    seminars = [];
    blogPosts = [];
    testimonials = [];
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
        {/* Sections avec données préchargées depuis Prisma */}
        <SeminarsSection initialData={seminars} />
        <BlogSection initialData={blogPosts} />
        <TestimonialsSection initialData={testimonials} />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
