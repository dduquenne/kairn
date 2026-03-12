/* eslint-disable no-console */
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema';
import type { BlogPostSummary } from '@/lib/blog';
import { getAllPostsAsync, getAllCategoriesAsync } from '@/lib/blog';

import { BlogPageClient } from './_components/BlogPageClient';

// Force dynamic rendering to avoid database access during build
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog',
  description:
    "Articles sur la psychothérapie, l'hypnose et la respiration holotropique par David Duquenne.",
  openGraph: {
    title: 'Blog | Psypnos',
    description: "Articles sur la psychothérapie, l'hypnose et la respiration holotropique.",
    url: 'https://psypnos.fr/blog',
    type: 'website',
  },
  alternates: {
    canonical: 'https://psypnos.fr/blog',
  },
};

const breadcrumbs = [
  { name: 'Accueil', url: 'https://psypnos.fr' },
  { name: 'Blog', url: 'https://psypnos.fr/blog' },
];

/**
 * Blog listing page - fetches all posts with error handling
 */
export default async function BlogPage() {
  let allPosts: BlogPostSummary[] = [];
  let categories: string[] = [];
  let fetchError = false;

  try {
    [allPosts, categories] = await Promise.all([getAllPostsAsync(), getAllCategoriesAsync()]);
    console.log(`[BlogPage] Fetched ${allPosts.length} posts, ${categories.length} categories`);
  } catch (error) {
    console.error('[BlogPage] Error fetching blog data:', error);
    fetchError = true;
  }

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <BlogPageClient allPosts={allPosts} categories={categories} fetchError={fetchError} />
    </>
  );
}
