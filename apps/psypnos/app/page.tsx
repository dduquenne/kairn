/**
 * Page d'accueil de Psypnos
 *
 * Cette page utilise le lazy loading pour toutes les sections sous le pli
 * afin d'optimiser les performances de chargement initial.
 */
"use client";

import { Suspense, lazy } from "react";
import Link from "next/link";
import { HeroSection } from "./(pages)/sections/hero";
import { SocialLinks } from "../components/SocialLinks";
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

// Lazy load all sections except Hero (above the fold)
const ApproachSection = lazy(() =>
  import("./(pages)/sections/approach").then((mod) => ({ default: mod.ApproachSection }))
);

const JourneySection = lazy(() =>
  import("./(pages)/sections/journey").then((mod) => ({ default: mod.JourneySection }))
);

const PricingSection = lazy(() =>
  import("./(pages)/sections/pricing").then((mod) => ({ default: mod.PricingSection }))
);

const SessionFormatsSection = lazy(() =>
  import("./(pages)/sections/formats").then((mod) => ({ default: mod.SessionFormatsSection }))
);

const TherapySections = lazy(() =>
  import("./(pages)/sections/therapy").then((mod) => ({ default: mod.TherapySections }))
);

const RespirationSection = lazy(() =>
  import("./(pages)/sections/respiration").then((mod) => ({ default: mod.RespirationSection }))
);

const SeminarsSection = lazy(() =>
  import("./(pages)/sections/seminars").then((mod) => ({ default: mod.SeminarsSection }))
);

const BlogSection = lazy(() =>
  import("./(pages)/sections/blog").then((mod) => ({ default: mod.BlogSection }))
);

const TestimonialsSection = lazy(() =>
  import("./(pages)/sections/testimonials").then((mod) => ({ default: mod.TestimonialsSection }))
);

const ContactSection = lazy(() =>
  import("./(pages)/sections/contact").then((mod) => ({ default: mod.ContactSection }))
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night text-ivory">
      {/* Hero - loaded immediately (above the fold) */}
      <HeroSection />

      <main>
        {/* Approach - lazy loaded with Suspense */}
        <Suspense fallback={<ApproachSectionSkeleton />}>
          <ApproachSection />
        </Suspense>

        {/* Journey - lazy loaded with Suspense */}
        <Suspense fallback={<JourneySectionSkeleton />}>
          <JourneySection />
        </Suspense>

        {/* Session Formats - lazy loaded with Suspense */}
        <Suspense fallback={<FormatsSectionSkeleton />}>
          <SessionFormatsSection />
        </Suspense>

        {/* Tarifs - lazy loaded with Suspense */}
        <Suspense fallback={<PricingSectionSkeleton />}>
          <PricingSection />
        </Suspense>

        {/* Therapy Sections (Psychotherapy + Hypnose) - lazy loaded with Suspense */}
        <Suspense fallback={<TherapySectionsSkeleton />}>
          <TherapySections />
        </Suspense>

        {/* Respiration - lazy loaded with Suspense */}
        <Suspense fallback={<RespirationSectionSkeleton />}>
          <RespirationSection />
        </Suspense>

        {/* Seminars - lazy loaded with Suspense */}
        <Suspense fallback={<SeminarsSectionSkeleton />}>
          <SeminarsSection />
        </Suspense>

        {/* Blog - lazy loaded with Suspense */}
        <Suspense fallback={<BlogSectionSkeleton />}>
          <BlogSection />
        </Suspense>

        {/* Testimonials - lazy loaded with Suspense */}
        <Suspense fallback={<TestimonialsSectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>

        {/* Contact - lazy loaded with Suspense */}
        <Suspense fallback={<ContactSectionSkeleton />}>
          <ContactSection />
        </Suspense>
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
            <span>{new Date().getFullYear()} Psypnos. Tous droits réservés.</span>
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
