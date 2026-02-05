/**
 * Page d'accueil de Psypnos - Server Component
 *
 * Cette page utilise le Server-Side Rendering pour précharger les données
 * et éviter les problèmes de fetch côté client sur Vercel.
 *
 * Les sections avec données dynamiques reçoivent leurs données initiales
 * en props, permettant un rendu instantané.
 */
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { Footer } from '../components/Footer';
import { NavigationMenu } from '../components/NavigationMenu';
import {
  getUpcomingSeminars,
  getFeaturedBlogPosts,
  getTestimonials,
  type SeminarData,
  type BlogPostData,
  type TestimonialData,
} from '../lib/server/data-fetchers';

import { HeroSection } from './(pages)/sections/hero';
import {
  ApproachSectionSkeleton,
  JourneySectionSkeleton,
  PricingSectionSkeleton,
  FormatsSectionSkeleton,
  TherapySectionsSkeleton,
  RespirationSectionSkeleton,
  SeminarsSectionSkeleton,
  BlogSectionSkeleton,
  TestimonialsSectionSkeleton,
  ContactSectionSkeleton,
} from './(pages)/sections/skeletons';

// Static sections - loaded with dynamic import for code splitting
const ApproachSection = dynamic(
  () => import('./(pages)/sections/approach').then(mod => mod.ApproachSection),
  { loading: () => <ApproachSectionSkeleton /> }
);

const JourneySection = dynamic(
  () => import('./(pages)/sections/journey').then(mod => mod.JourneySection),
  { loading: () => <JourneySectionSkeleton /> }
);

const PricingSection = dynamic(
  () => import('./(pages)/sections/pricing').then(mod => mod.PricingSection),
  { loading: () => <PricingSectionSkeleton /> }
);

const SessionFormatsSection = dynamic(
  () => import('./(pages)/sections/formats').then(mod => mod.SessionFormatsSection),
  { loading: () => <FormatsSectionSkeleton /> }
);

const TherapySections = dynamic(
  () => import('./(pages)/sections/therapy').then(mod => mod.TherapySections),
  { loading: () => <TherapySectionsSkeleton /> }
);

const RespirationSection = dynamic(
  () => import('./(pages)/sections/respiration').then(mod => mod.RespirationSection),
  { loading: () => <RespirationSectionSkeleton /> }
);

// Data-dependent sections - receive SSR data as props
const SeminarsSection = dynamic(
  () => import('./(pages)/sections/seminars').then(mod => mod.SeminarsSection),
  { loading: () => <SeminarsSectionSkeleton /> }
);

const BlogSection = dynamic(() => import('./(pages)/sections/blog').then(mod => mod.BlogSection), {
  loading: () => <BlogSectionSkeleton />,
});

const TestimonialsSection = dynamic(
  () => import('./(pages)/sections/testimonials').then(mod => mod.TestimonialsSection),
  { loading: () => <TestimonialsSectionSkeleton /> }
);

const ContactSection = dynamic(
  () => import('./(pages)/sections/contact').then(mod => mod.ContactSection),
  { loading: () => <ContactSectionSkeleton /> }
);

// Props types for sections that need server data
interface SeminarsSectionProps {
  initialData?: SeminarData[];
}

interface BlogSectionProps {
  initialData?: BlogPostData[];
}

interface TestimonialsSectionProps {
  initialData?: TestimonialData[];
}

export default async function HomePage() {
  // Parallel data fetching server-side for optimal performance
  const [seminars, blogPosts, testimonials] = await Promise.all([
    getUpcomingSeminars(3),
    getFeaturedBlogPosts(3),
    getTestimonials(10),
  ]);

  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      {/* Navigation sticky - apparaît au scroll */}
      <NavigationMenu />

      {/* Hero - loaded immediately (above the fold) */}
      <HeroSection />

      <main>
        {/* Static sections - no data dependencies */}
        <Suspense fallback={<ApproachSectionSkeleton />}>
          <ApproachSection />
        </Suspense>

        <Suspense fallback={<JourneySectionSkeleton />}>
          <JourneySection />
        </Suspense>

        <Suspense fallback={<FormatsSectionSkeleton />}>
          <SessionFormatsSection />
        </Suspense>

        <Suspense fallback={<PricingSectionSkeleton />}>
          <PricingSection />
        </Suspense>

        <Suspense fallback={<TherapySectionsSkeleton />}>
          <TherapySections />
        </Suspense>

        <Suspense fallback={<RespirationSectionSkeleton />}>
          <RespirationSection />
        </Suspense>

        {/* Data-dependent sections - receive SSR-prefetched data */}
        <Suspense fallback={<SeminarsSectionSkeleton />}>
          <SeminarsSection initialData={seminars} />
        </Suspense>

        <Suspense fallback={<BlogSectionSkeleton />}>
          <BlogSection initialData={blogPosts} />
        </Suspense>

        <Suspense fallback={<TestimonialsSectionSkeleton />}>
          <TestimonialsSection initialData={testimonials} />
        </Suspense>

        <Suspense fallback={<ContactSectionSkeleton />}>
          <ContactSection />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
