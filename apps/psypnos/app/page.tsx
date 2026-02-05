/**
 * Page d'accueil de Psypnos
 *
 * Cette page utilise le Server-Side Rendering (SSR) pour un chargement initial rapide.
 * Les données sont préchargées côté serveur et passées aux sections client.
 * Les sections avec interactions lourdes utilisent dynamic imports avec ssr: false.
 */
import { Footer } from '../components/Footer';
import { NavigationMenu } from '../components/NavigationMenu';
import type { Seminar, Testimonial } from '../lib/hooks';

import { ApproachSection } from './(pages)/sections/approach';
import { BlogSection, type BlogPost } from './(pages)/sections/blog';
import { RespirationSection, ContactSection } from './(pages)/sections/dynamic-sections';
import { SessionFormatsSection } from './(pages)/sections/formats';
import { HeroSection } from './(pages)/sections/hero';

// Sections statiques - SSR activé pour un rendu initial rapide
import { JourneySection } from './(pages)/sections/journey';
import { PricingSection } from './(pages)/sections/pricing';
import { SeminarsSection } from './(pages)/sections/seminars';
import { TestimonialsSection } from './(pages)/sections/testimonials';
import { TherapySections } from './(pages)/sections/therapy';

// Sections dynamiques (Client Component wrapper)

// Base URL for API calls (server-side)
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return 'http://localhost:3000';
};

// Server-side data fetching functions
async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/blog/posts?limit=3&featuredFirst=true`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchSeminars(): Promise<Seminar[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/seminars?upcoming=true&limit=3`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/testimonials?limit=10`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  // Prefetch all data in parallel for optimal performance
  const [blogPosts, seminars, testimonials] = await Promise.all([
    fetchBlogPosts(),
    fetchSeminars(),
    fetchTestimonials(),
  ]);

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
        {/* Sections avec données préchargées côté serveur */}
        <SeminarsSection initialData={seminars} />
        <BlogSection initialData={blogPosts} />
        <TestimonialsSection initialData={testimonials} />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
