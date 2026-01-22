/**
 * Fil d'Ariane (Breadcrumb) pour la navigation
 * À intégrer dans app/blog/[slug]/page.tsx
 *
 * IMPACT: 🔥🔥🔥 Améliore l'orientation utilisateur
 * DIFFICULTÉ: 🟢 Facile (1h)
 */

"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

interface BreadcrumbProps {
  post?: BlogPost;
  currentPage?: "list" | "article";
}

export function Breadcrumb({ post, currentPage = "list" }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="mb-6 flex items-center gap-2 text-sm text-ivory/60 overflow-x-auto py-2"
    >
      {/* Accueil */}
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-gold transition-colors whitespace-nowrap"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Accueil</span>
      </Link>

      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />

      {/* Blog */}
      <Link
        href="/blog"
        className={`hover:text-gold transition-colors whitespace-nowrap ${
          currentPage === "list" ? "font-medium text-gold" : ""
        }`}
      >
        Blog
      </Link>

      {/* Article spécifique */}
      {post && currentPage === "article" && (
        <>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />

          {/* Catégorie */}
          <Link
            href={`/blog?category=${encodeURIComponent(post.category)}`}
            className="hover:text-gold transition-colors whitespace-nowrap"
          >
            {post.category}
          </Link>

          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />

          {/* Titre de l'article (tronqué sur mobile) */}
          <span className="font-medium text-gold truncate max-w-xs sm:max-w-md">
            {post.title}
          </span>
        </>
      )}
    </nav>
  );
}

/**
 * UTILISATION dans app/blog/page.tsx (liste) :
 *
 * import { Breadcrumb } from "@/components/Breadcrumb";
 *
 * export default function BlogPage() {
 *   return (
 *     <div className="min-h-screen...">
 *       <BlogHeader />
 *
 *       <main className="mx-auto max-w-7xl px-6 py-12">
 *         <Breadcrumb currentPage="list" />
 *         {/* Reste du contenu *\/}
 *       </main>
 *     </div>
 *   );
 * }
 */

/**
 * UTILISATION dans app/blog/[slug]/page.tsx (article) :
 *
 * import { Breadcrumb } from "@/components/Breadcrumb";
 *
 * export default function BlogPostPage({ params }: PageProps) {
 *   const post = getPostBySlug(params.slug);
 *
 *   return (
 *     <div className="min-h-screen...">
 *       <BlogHeader />
 *
 *       <main className="mx-auto max-w-7xl px-6 py-8">
 *         <Breadcrumb post={post} currentPage="article" />
 *
 *         <div className="lg:grid lg:grid-cols-12 lg:gap-8">
 *           {/* Contenu de l'article *\/}
 *         </div>
 *       </main>
 *     </div>
 *   );
 * }
 */

/**
 * VERSION STRUCTURÉE (Schema.org) pour le SEO :
 */
export function BreadcrumbStructuredData({ post }: { post?: BlogPost }) {
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Accueil",
      item: "https://psypnos.fr",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: "https://psypnos.fr/blog",
    },
  ];

  if (post) {
    items.push(
      {
        "@type": "ListItem",
        position: 3,
        name: post.category,
        item: `https://psypnos.fr/blog?category=${encodeURIComponent(post.category)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.title,
        item: `https://psypnos.fr/blog/${post.slug}`,
      }
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * UTILISATION du Schema.org dans app/blog/[slug]/page.tsx :
 *
 * import { BreadcrumbStructuredData } from "@/components/Breadcrumb";
 *
 * export default function BlogPostPage({ params }: PageProps) {
 *   const post = getPostBySlug(params.slug);
 *
 *   return (
 *     <>
 *       <BreadcrumbStructuredData post={post} />
 *       <div className="min-h-screen...">
 *         {/* Reste du contenu *\/}
 *       </div>
 *     </>
 *   );
 * }
 */
