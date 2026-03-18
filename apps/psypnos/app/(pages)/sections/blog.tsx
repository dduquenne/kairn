'use client';

/* eslint-disable no-console */

import { BlogSection as BlogSectionUI } from '@kairn/ui';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CTAButton } from '../../../components/CTAButton';
import type { BlogPostData } from '../../../lib/server/data-fetchers';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  Comprendre: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-300',
    gradient: 'from-blue-500 to-blue-600',
  },
  Traverser: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  Découvrir: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    gradient: 'from-purple-500 to-purple-600',
  },
  Cheminer: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    gradient: 'from-amber-500 to-amber-600',
  },
};

interface BlogSectionProps {
  initialData?: BlogPostData[];
  /** Whether the SSR fetch failed */
  ssrError?: boolean;
}

/**
 * Psypnos blog section wrapper.
 * Provides site-specific data fetching, category colors, and CTA to the shared @kairn/ui component.
 *
 * Si initialData contient des articles, ils sont affichés immédiatement.
 * Sinon, un fetch client est lancé avec un loading state visible.
 * Si le fetch échoue, un état d'erreur est affiché.
 */
export function BlogSection({ initialData, ssrError = false }: BlogSectionProps) {
  const hasInitialPosts = initialData && initialData.length > 0;
  const [blogPosts, setBlogPosts] = useState<BlogPostData[]>(initialData ?? []);
  const [loading, setLoading] = useState(!hasInitialPosts);
  const [fetchError, setFetchError] = useState(ssrError);

  useEffect(() => {
    if (hasInitialPosts) {
      return;
    }

    async function fetchPosts() {
      setLoading(true);
      setFetchError(false);
      try {
        const response = await fetch('/api/blog/posts?limit=3&featuredFirst=true');
        if (response.ok) {
          const data = await response.json();
          const posts = Array.isArray(data) ? data : [];
          setBlogPosts(posts);
          console.log('[BlogSection] Client fetch: received', posts.length, 'posts');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[BlogSection] Client fetch error:', response.status, errorData);
          setFetchError(true);
        }
      } catch (error) {
        console.error('[BlogSection] Client fetch exception:', error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [hasInitialPosts]);

  // Show error state if fetch failed and no posts available
  if (fetchError && blogPosts.length === 0 && !loading) {
    return (
      <section id="blog" className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-4 text-center">
            <p className="text-gold text-sm font-medium uppercase tracking-widest">
              Ressources & Articles
            </p>
            <h2 className="text-ivory text-3xl font-bold sm:text-4xl">
              Découvrez nos derniers contenus
            </h2>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
            <p className="text-ivory/70 text-lg">
              Les articles sont temporairement indisponibles. Veuillez réessayer dans quelques
              instants.
            </p>
            <p className="text-ivory/40 mt-2 text-sm">
              Si le problème persiste, consultez{' '}
              <a href="/api/debug/blog-status" className="text-gold underline">
                le diagnostic
              </a>{' '}
              pour plus d&apos;informations.
            </p>
          </div>
          <div className="flex justify-center">
            <CTAButton variant="secondary" href="/blog">
              Accéder au blog
            </CTAButton>
          </div>
        </div>
      </section>
    );
  }

  return (
    <BlogSectionUI
      posts={blogPosts}
      isLoading={loading}
      title={{
        eyebrow: 'Ressources & Articles',
        title: 'Découvrez nos derniers contenus',
        description:
          "Des articles pour mieux comprendre la psychothérapie, l'hypnose ericksonienne et la respiration holotropique. Ressources gratuites pour votre développement personnel et votre bien-être.",
      }}
      categoryColors={CATEGORY_COLORS}
      linkComponent={Link}
      imageComponent={({ src, alt, fill, className, sizes }) => (
        <Image src={src} alt={alt} fill={fill} className={className} sizes={sizes} />
      )}
      ctaComponent={
        <CTAButton variant="secondary" href="/blog">
          Découvrir tous les articles
        </CTAButton>
      }
      trackingName="Blog"
    />
  );
}
