import { getAllPostsAsync, getAllCategoriesAsync } from "@/lib/blog";
import { BlogPageClient } from "./_components/BlogPageClient";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

// PERFORMANCE : ISR avec revalidation toutes les 5 minutes (fallback)
// La revalidation à la demande est déclenchée par les API routes lors des opérations CRUD
export const revalidate = 300;

export const metadata = {
  title: "Blog",
  description: "Articles sur la psychothérapie, l'hypnose et la respiration holotropique par David Duquenne.",
  openGraph: {
    title: "Blog | Psypnos",
    description: "Articles sur la psychothérapie, l'hypnose et la respiration holotropique.",
    url: "https://psypnos.fr/blog",
    type: "website",
  },
  alternates: {
    canonical: "https://psypnos.fr/blog",
  },
};

const breadcrumbs = [
  { name: "Accueil", url: "https://psypnos.fr" },
  { name: "Blog", url: "https://psypnos.fr/blog" },
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
