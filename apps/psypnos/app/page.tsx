'use client';

/**
 * Page d'accueil de Psypnos
 *
 * Cette page utilise next/dynamic pour le lazy loading des sections sous le pli.
 * next/dynamic gère correctement le SSR et évite les erreurs d'hydratation
 * contrairement à React.lazy() qui ne fonctionne pas bien avec SSR.
 */
import dynamic from 'next/dynamic';

import { Footer } from '../components/Footer';
import { NavigationMenu } from '../components/NavigationMenu';

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

// Dynamic import with SSR disabled to prevent hydration mismatches
// ssr: false ensures the component only renders on the client
const ApproachSection = dynamic(
  () => import('./(pages)/sections/approach').then(mod => mod.ApproachSection),
  { loading: () => <ApproachSectionSkeleton />, ssr: false }
);

const JourneySection = dynamic(
  () => import('./(pages)/sections/journey').then(mod => mod.JourneySection),
  { loading: () => <JourneySectionSkeleton />, ssr: false }
);

const PricingSection = dynamic(
  () => import('./(pages)/sections/pricing').then(mod => mod.PricingSection),
  { loading: () => <PricingSectionSkeleton />, ssr: false }
);

const SessionFormatsSection = dynamic(
  () => import('./(pages)/sections/formats').then(mod => mod.SessionFormatsSection),
  { loading: () => <FormatsSectionSkeleton />, ssr: false }
);

const TherapySections = dynamic(
  () => import('./(pages)/sections/therapy').then(mod => mod.TherapySections),
  { loading: () => <TherapySectionsSkeleton />, ssr: false }
);

const RespirationSection = dynamic(
  () => import('./(pages)/sections/respiration').then(mod => mod.RespirationSection),
  { loading: () => <RespirationSectionSkeleton />, ssr: false }
);

const SeminarsSection = dynamic(
  () => import('./(pages)/sections/seminars').then(mod => mod.SeminarsSection),
  { loading: () => <SeminarsSectionSkeleton />, ssr: false }
);

const BlogSection = dynamic(() => import('./(pages)/sections/blog').then(mod => mod.BlogSection), {
  loading: () => <BlogSectionSkeleton />,
  ssr: false,
});

const TestimonialsSection = dynamic(
  () => import('./(pages)/sections/testimonials').then(mod => mod.TestimonialsSection),
  { loading: () => <TestimonialsSectionSkeleton />, ssr: false }
);

const ContactSection = dynamic(
  () => import('./(pages)/sections/contact').then(mod => mod.ContactSection),
  { loading: () => <ContactSectionSkeleton />, ssr: false }
);

export default function HomePage() {
  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      {/* Navigation sticky - apparaît au scroll */}
      <NavigationMenu />

      {/* Hero - loaded immediately (above the fold) */}
      <HeroSection />

      <main>
        {/* All sections below use next/dynamic with ssr: false */}
        {/* This ensures they only render on client, preventing hydration mismatches */}
        <ApproachSection />
        <JourneySection />
        <SessionFormatsSection />
        <PricingSection />
        <TherapySections />
        <RespirationSection />
        <SeminarsSection />
        <BlogSection />
        <TestimonialsSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
