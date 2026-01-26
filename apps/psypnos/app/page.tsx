/**
 * Page d'accueil de Psypnos
 *
 * Cette page utilise next/dynamic pour le lazy loading des sections sous le pli.
 * next/dynamic gère correctement le SSR et évite les erreurs d'hydratation
 * contrairement à React.lazy() qui ne fonctionne pas bien avec SSR.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { HeroSection } from "./(pages)/sections/hero";
import { SocialLinks } from "../components/SocialLinks";
import { CurrentYear } from "../components/CurrentYear";
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
} from "./(pages)/sections/skeletons";

// Dynamic import with SSR disabled to prevent hydration mismatches
// ssr: false ensures the component only renders on the client
const ApproachSection = dynamic(
  () => import("./(pages)/sections/approach").then((mod) => mod.ApproachSection),
  { loading: () => <ApproachSectionSkeleton />, ssr: false }
);

const JourneySection = dynamic(
  () => import("./(pages)/sections/journey").then((mod) => mod.JourneySection),
  { loading: () => <JourneySectionSkeleton />, ssr: false }
);

const PricingSection = dynamic(
  () => import("./(pages)/sections/pricing").then((mod) => mod.PricingSection),
  { loading: () => <PricingSectionSkeleton />, ssr: false }
);

const SessionFormatsSection = dynamic(
  () => import("./(pages)/sections/formats").then((mod) => mod.SessionFormatsSection),
  { loading: () => <FormatsSectionSkeleton />, ssr: false }
);

const TherapySections = dynamic(
  () => import("./(pages)/sections/therapy").then((mod) => mod.TherapySections),
  { loading: () => <TherapySectionsSkeleton />, ssr: false }
);

const RespirationSection = dynamic(
  () => import("./(pages)/sections/respiration").then((mod) => mod.RespirationSection),
  { loading: () => <RespirationSectionSkeleton />, ssr: false }
);

const SeminarsSection = dynamic(
  () => import("./(pages)/sections/seminars").then((mod) => mod.SeminarsSection),
  { loading: () => <SeminarsSectionSkeleton />, ssr: false }
);

const BlogSection = dynamic(
  () => import("./(pages)/sections/blog").then((mod) => mod.BlogSection),
  { loading: () => <BlogSectionSkeleton />, ssr: false }
);

const TestimonialsSection = dynamic(
  () => import("./(pages)/sections/testimonials").then((mod) => mod.TestimonialsSection),
  { loading: () => <TestimonialsSectionSkeleton />, ssr: false }
);

const ContactSection = dynamic(
  () => import("./(pages)/sections/contact").then((mod) => mod.ContactSection),
  { loading: () => <ContactSectionSkeleton />, ssr: false }
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night text-ivory">
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

      <footer className="border-t border-ivory/10 bg-night/80 px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Liens réseaux sociaux */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-ivory/50">Retrouvez-moi sur les réseaux</p>
            <SocialLinks variant="inline" />
          </div>

          {/* Séparateur */}
          <div className="border-t border-ivory/10" />

          {/* Copyright et liens */}
          <div className="flex flex-col items-center gap-2 text-center text-xs text-ivory/50 sm:flex-row sm:justify-center sm:gap-4">
            <span><CurrentYear /> Psypnos. Tous droits réservés.</span>
            <span className="hidden sm:inline text-ivory/30">|</span>
            <Link
              href="/blog"
              className="text-ivory/70 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Blog
            </Link>
            <span className="hidden sm:inline text-ivory/30">|</span>
            <Link
              href="/admin"
              className="text-ivory/70 transition hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Accès privé
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
