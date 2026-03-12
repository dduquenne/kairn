'use client';

import { BlogSection as BlogSectionUI } from '@kairn/ui';
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
}

/**
 * Psypnos blog section wrapper.
 * Provides site-specific data fetching, category colors, and CTA to the shared @kairn/ui component.
 *
 * Si initialData contient des articles, ils sont affichés immédiatement.
 * Sinon, un fetch client est lancé avec un loading state visible.
 */
export function BlogSection({ initialData }: BlogSectionProps) {
  const hasInitialPosts = initialData && initialData.length > 0;
  const [blogPosts, setBlogPosts] = useState<BlogPostData[]>(initialData ?? []);
  const [loading, setLoading] = useState(!hasInitialPosts);

  useEffect(() => {
    if (hasInitialPosts) {
      return;
    }

    async function fetchPosts() {
      setLoading(true);
      try {
        const response = await fetch('/api/blog/posts?limit=3&featuredFirst=true');
        if (response.ok) {
          const data = await response.json();
          setBlogPosts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [hasInitialPosts]);

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
      ctaComponent={
        <CTAButton variant="secondary" href="/blog">
          Découvrir tous les articles
        </CTAButton>
      }
      trackingName="Blog"
    />
  );
}
