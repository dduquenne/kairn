"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPostSummary } from "@/lib/blog";
import { getCategoryColors } from "@/lib/categoryColors";

interface ArticlesListProps {
  posts: BlogPostSummary[];
  postsPerPage?: number;
}

/**
 * Mini-carte d'article compacte pour la liste
 */
function MiniArticleCard({
  post,
  index = 0,
}: {
  post: BlogPostSummary;
  index?: number;
}) {
  const [imageExists, setImageExists] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const colors = getCategoryColors(post.category);

  // Track mounting to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // Only check images after mounting to avoid hydration mismatch
    if (!hasMounted) return;

    const checkImage = async () => {
      try {
        const response = await fetch(`/images/blog/${post.slug}.webp`, {
          method: "HEAD",
        });
        setImageExists(response.ok);
      } catch {
        setImageExists(false);
      }
    };

    checkImage();
  }, [post.slug, hasMounted]);

  // Use explicit timezone to avoid hydration mismatch between server and client
  const formattedDate = new Date(post.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

  // Show image only after mounting and check completes to prevent hydration mismatch
  const showImage = hasMounted && imageExists;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-lg border ${colors.border} ${colors.hover} bg-night/50 backdrop-blur-sm transition-all hover:bg-night/70`}
    >
      {/* Barre de couleur à gauche */}
      <div
        className={`absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b ${colors.gradient}`}
      />

      <Link
        href={`/blog/${post.slug}`}
        className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image (optionnelle) - only show after client-side check to prevent hydration mismatch */}
          {showImage && (
            <div className="relative h-40 w-full flex-shrink-0 overflow-hidden bg-night/80 sm:h-auto sm:w-40">
              <Image
                src={`/images/blog/${post.slug}.webp`}
                alt={post.title}
                fill
                unoptimized
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 160px"
              />
            </div>
          )}

          {/* Contenu */}
          <div className="flex-1 p-5 pl-6">
            {/* Badge catégorie */}
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full ${colors.bg} px-2 py-0.5 text-xs font-medium ${colors.text}`}
              >
                {post.category}
              </span>
            </div>

            {/* Titre */}
            <h3 className="mb-2 text-lg font-semibold leading-tight text-ivory transition-colors group-hover:text-gold">
              {post.title}
            </h3>

            {/* Description tronquée */}
            <p className="mb-3 line-clamp-2 text-sm text-ivory/60">
              {post.excerpt}
            </p>

            {/* Métadonnées */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-ivory/50">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <time dateTime={post.date}>{formattedDate}</time>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.readingTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateur hover */}
        <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-gold to-gold/50 transition-transform group-hover:scale-x-100" />
      </Link>
    </motion.article>
  );
}

/**
 * Composant de pagination compact
 */
function MiniPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Générer les numéros de page visibles
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1"
      aria-label="Pagination des articles"
    >
      {/* Previous Button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center gap-1 rounded-md border border-ivory/20 bg-night/50 px-3 py-1.5 text-sm text-ivory transition-all hover:border-gold/50 hover:bg-night/80 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ivory/20 disabled:hover:bg-night/50 disabled:hover:text-ivory"
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Préc.</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-ivory/40"
              >
                ...
              </span>
            );
          }

          const page = pageNum as number;
          const isActive = page === currentPage;

          return (
            <button
              type="button"
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] rounded-md border px-2 py-1 text-sm transition-all ${
                isActive
                  ? "border-gold bg-gold/10 text-gold shadow-sm shadow-gold/20"
                  : "border-ivory/20 bg-night/50 text-ivory hover:border-gold/50 hover:bg-night/80 hover:text-gold"
              }`}
              aria-label={`Page ${page}`}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 rounded-md border border-ivory/20 bg-night/50 px-3 py-1.5 text-sm text-ivory transition-all hover:border-gold/50 hover:bg-night/80 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ivory/20 disabled:hover:bg-night/50 disabled:hover:text-ivory"
        aria-label="Page suivante"
      >
        <span className="sr-only sm:not-sr-only">Suiv.</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

/**
 * Liste paginée d'articles pour la page psychothérapie
 */
export function ArticlesList({ posts, postsPerPage = 10 }: ArticlesListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculer le nombre total de pages
  const totalPages = useMemo(
    () => Math.ceil(posts.length / postsPerPage),
    [posts.length, postsPerPage]
  );

  // Obtenir les articles de la page courante
  const currentPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return posts.slice(startIndex, endIndex);
  }, [posts, currentPage, postsPerPage]);

  // Gestion du changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll vers le haut de la liste (with SSR safety check)
    if (typeof document !== "undefined") {
      const articlesSection = document.getElementById("articles-list");
      if (articlesSection) {
        articlesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Réinitialiser la page si les posts changent
  useEffect(() => {
    setCurrentPage(1);
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-ivory/10 bg-night/40 p-8 text-center">
        <p className="text-ivory/60">
          Aucun article disponible pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div id="articles-list" className="scroll-mt-24">
      {/* Compteur d'articles */}
      <div className="mb-4 text-sm text-ivory/50">
        {posts.length} article{posts.length > 1 ? "s" : ""} disponible
        {posts.length > 1 ? "s" : ""}
        {totalPages > 1 &&
          ` — Page ${currentPage} sur ${totalPages}`}
      </div>

      {/* Liste des articles */}
      <div className="space-y-4">
        {currentPosts.map((post, index) => (
          <MiniArticleCard key={post.slug} post={post} index={index} />
        ))}
      </div>

      {/* Pagination */}
      <MiniPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
