import { BreadcrumbSchema } from '@/components/BreadcrumbSchema';
import { getAllPostsAsync, getAllCategoriesAsync } from '@/lib/blog';

import { BlogPageClient } from './_components/BlogPageClient';

// Force dynamic rendering to avoid database access during build
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog',
  description:
    "Articles sur la sophrologie, la somatothérapie et la breathwork & rebirth par Nathalie Duquenne.",
  openGraph: {
    title: 'Blog | Appréciez Votre Vie',
    description: "Articles sur la sophrologie, la somatothérapie et la breathwork & rebirth.",
    url: 'https://appreciezvotrevie.fr/blog',
    type: 'website',
  },
  alternates: {
    canonical: 'https://appreciezvotrevie.fr/blog',
  },
};

const breadcrumbs = [
  { name: 'Accueil', url: 'https://appreciezvotrevie.fr' },
  { name: 'Blog', url: 'https://appreciezvotrevie.fr/blog' },
];

export default async function BlogPage() {
  const allPosts = await getAllPostsAsync();
  const categories = await getAllCategoriesAsync();

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <BlogPageClient allPosts={allPosts} categories={categories} />
    </>
  );
}
