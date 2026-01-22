import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Tag } from "lucide-react";
import { getPostBySlugAsync, getAllPostsAsync, getRelatedPostsAsync, getBlogPostImageAsync } from "@/lib/blog";

// PERFORMANCE : ISR avec revalidation toutes les 5 minutes (fallback)
// La revalidation à la demande est déclenchée par les API routes lors des opérations CRUD
export const revalidate = 300;
import { markdownToHtml, extractHeadings } from "@/lib/mdx";
import { BlogContent } from "../_components/BlogContent";
import { TableOfContents } from "../_components/TableOfContents";
import { MobileTableOfContents } from "../_components/MobileTableOfContents";
import { RelatedPosts } from "../_components/RelatedPosts";
import { ShareButton } from "../_components/ShareButton";
import { BlogPostTracker } from "./_components/BlogPostTracker";
import { FAQ } from "../_components/FAQ";
import { BlogHeader } from "../_components/BlogHeader";
import { Breadcrumb, BreadcrumbStructuredData } from "../_components/Breadcrumb";
import { ReadingProgress, ReadingProgressBadge } from "../_components/ReadingProgress";
import { SaveArticleButton } from "../_components/SaveArticleButton";
import { ArticleContentBox } from "../_components/ArticleContentBox";
import { BlogArticleHero } from "../_components/BlogArticleHero";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Génération des métadonnées SEO pour chaque article
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);

  if (!post) {
    return {
      title: "Article non trouvé",
    };
  }

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    keywords: [post.category, ...post.tags],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: [post.author],
      tags: [post.category, ...post.tags],
      url: `https://psypnos.fr/blog/${slug}`,
    },
    alternates: {
      canonical: `https://psypnos.fr/blog/${slug}`,
    },
  };
}

// Génération statique des pages uniquement pour les articles publiés
// Évite de générer des routes 404 pour les articles non publiés
export async function generateStaticParams() {
  const posts = await getAllPostsAsync();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);

  if (!post || !post.published) {
    notFound();
  }

  // Vérifier que la date de publication est <= aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const postDate = new Date(post.date);
  postDate.setHours(0, 0, 0, 0);

  if (postDate > today) {
    notFound();
  }

  // Conversion du Markdown en HTML
  const htmlContent = await markdownToHtml(post.content);

  // Extraction des headings pour la table des matières
  const headings = extractHeadings(post.content);

  // Récupération des articles similaires et de l'image en parallèle
  const [relatedPosts, blogImage] = await Promise.all([
    getRelatedPostsAsync(slug),
    getBlogPostImageAsync(slug),
  ]);

  // Formatage de la date
  const formattedDate = new Date(post.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Schema.org JSON-LD pour l'article
  // Utiliser le JSON-LD personnalisé s'il existe, sinon générer le JSON-LD par défaut
  const jsonLd = post.jsonLd || {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Psypnos",
      logo: {
        "@type": "ImageObject",
        url: "https://psypnos.fr/favicon.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://psypnos.fr/blog/${slug}`,
    },
    keywords: [post.category, ...post.tags].join(", "),
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Structured Data */}
      <BreadcrumbStructuredData post={post} />

      {/* Blog Analytics Tracker */}
      <BlogPostTracker slug={slug} />

      {/* Reading Progress Indicator */}
      <ReadingProgress />

      {/* Mobile Table of Contents Drawer */}
      <MobileTableOfContents headings={headings} />

      <div className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night text-ivory">
        {/* Blog Header persistent */}
        <BlogHeader showBackButton={true} currentPage="article" />

        {/* Image principale en sous-bandeau avec parallaxe */}
        {blogImage && (
          <BlogArticleHero
            image={blogImage}
            title={post.title}
            category={post.category}
          />
        )}

        {/* Contenu principal avec layout 2 colonnes */}
        <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10 lg:px-16">
          {/* Breadcrumb */}
          <Breadcrumb post={post} currentPage="article" />

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Colonne gauche: Contenu article */}
            <article className="lg:col-span-8">
              {/* Métadonnées enrichies */}
              <div className="mb-8 flex flex-wrap items-center justify-between gap-6 border-b border-ivory/10 pb-6">
                {/* Informations auteur et métadonnées */}
                <div className="flex flex-wrap items-center gap-6">
                  {/* Avatar auteur */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 text-gold font-semibold text-sm">
                      {post.author.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-ivory/90">Par {post.author}</span>
                      <time dateTime={post.date} className="text-xs text-ivory/60">{formattedDate}</time>
                    </div>
                  </div>

                  {/* Temps de lecture */}
                  <div className="flex items-center gap-2 text-ivory/70">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{post.readingTime}</span>
                  </div>
                </div>

                {/* Bouton sauvegarder */}
                <SaveArticleButton slug={post.slug} title={post.title} />
              </div>

              {/* Tags réduits */}
              {post.tags.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-ivory/5 px-2 py-1 text-[11px] text-ivory/50 hover:bg-gold/10 hover:text-gold transition"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share Button */}
              <div className="mb-8">
                <ShareButton title={post.title} description={post.description} />
              </div>

              {/* Contenu de l'article avec basculement jour/nuit */}
              <div className="relative mb-8">
                <ArticleContentBox content={htmlContent} />
              </div>

              {/* FAQ Section */}
              {post.faq && post.faq.length > 0 && (
                <div className="mt-10">
                  <FAQ items={post.faq} />
                </div>
              )}
            </article>

            {/* Colonne droite: Table des matières sticky + Progression de lecture */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <TableOfContents headings={headings} />
                <ReadingProgressBadge />
              </div>
            </aside>
          </div>

          {/* Articles similaires - pleine largeur */}
          <div className="mt-12 border-t border-ivory/10 pt-12">
            <RelatedPosts posts={relatedPosts} />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-ivory/10 bg-night/80 px-6 py-10 text-center text-xs text-ivory/50 sm:px-10 lg:px-16">
          {new Date().getFullYear()} Psypnos. Tous droits réservés.
        </footer>
      </div>
    </>
  );
}
