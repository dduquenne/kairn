"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Tag } from "lucide-react";
import type { BlogPostSummary } from "@/lib/blog";
import { resolvePostImage } from "@/lib/blog-utils";
import { getCategoryColors } from "@/lib/categoryColors";

interface FeaturedCarouselProps {
  posts: BlogPostSummary[];
}

export function FeaturedCarousel({ posts }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageExists, setImageExists] = useState<Record<string, boolean>>({});

  // Nombre d'articles visibles par page (responsive)
  const itemsPerPage = 3;
  const totalPages = Math.ceil(posts.length / itemsPerPage);

  // Vérifier l'existence des images pour tous les posts
  useEffect(() => {
    const checkImages = async () => {
      const results: Record<string, boolean> = {};
      for (const post of posts) {
        try {
          const imageUrl = resolvePostImage(post);
          if (!imageUrl) {
            results[post.slug] = false;
            continue;
          }

          const response = await fetch(imageUrl, { method: 'HEAD' });
          results[post.slug] = response.ok;
        } catch {
          results[post.slug] = false;
        }
      }
      setImageExists(results);
    };

    checkImages();
  }, [posts]);

  // Défilement automatique toutes les 7 secondes
  useEffect(() => {
    if (!isAutoPlaying || totalPages <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalPages]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const goToPage = useCallback((index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  }, []);

  if (posts.length === 0) return null;

  const startIdx = currentIndex * itemsPerPage;
  const visiblePosts = posts.slice(startIdx, startIdx + itemsPerPage);

  return (
    <section className="relative mb-16">
      {/* En-tête */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-gold fill-gold" />
          <h2 className="text-3xl font-bold text-gold">Articles mis en avant</h2>
        </div>

        {/* Indicateurs de page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-gold"
                    : "w-2 bg-ivory/30 hover:bg-ivory/50"
                }`}
                aria-label={`Aller à la page ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Carrousel */}
      <div className="relative">
        {/* Bouton Précédent */}
        {totalPages > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full border border-gold/30 bg-night/90 p-3 text-gold backdrop-blur-sm transition-all hover:border-gold hover:bg-night hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold"
            aria-label="Article précédent"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Articles */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visiblePosts.map((post, index) => {
                const colors = getCategoryColors(post.category);
                // Use explicit timezone to avoid hydration mismatch between server and client
                const formattedDate = new Date(post.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Europe/Paris",
                });

                return (
                  <motion.article
                    key={post.slug}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                    className={`group relative overflow-hidden rounded-xl border-2 border-ivory/10 bg-gradient-to-br from-night via-night/95 to-night/90 backdrop-blur-sm transition-all hover:shadow-2xl hover:shadow-gold/30 hover:border-ivory/20`}
                  >
                    {/* Badge Featured animé */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                      className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1 text-xs font-bold text-night backdrop-blur-sm shadow-lg shadow-gold/50"
                    >
                      <Star className="h-3 w-3 fill-night" />
                      Mis en avant
                    </motion.div>

                    {/* Barre de couleur à gauche */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${colors.gradient}`} />

                    {/* Animated background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <Link
                      href={`/blog/${post.slug}`}
                      className="block focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night rounded-lg"
                    >
                      {/* Image avec glow effect */}
                      {imageExists[post.slug] && (
                        <div className="relative h-56 overflow-hidden bg-night/80">
                          {/* Glow background */}
                          <div className="absolute inset-0 bg-gold/5 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                          <Image
                            src={resolvePostImage(post) || ''}
                            alt={post.title}
                            fill
                            unoptimized
                            className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            priority
                          />
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/30 to-transparent" />

                          {/* Gold rim glow on hover */}
                          <div className="absolute inset-0 border-2 border-gold/0 transition-all duration-500 group-hover:border-gold/20 group-hover:shadow-[inset_0_0_20px_rgba(199,169,98,0.2)]" />
                        </div>
                      )}

                      {/* Contenu */}
                      <div className="p-6 pl-8">
                        {/* Badge catégorie */}
                        <div className="mb-4 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-3 py-1.5 text-xs font-semibold ${colors.text}`}>
                            <Tag className="h-3 w-3" />
                            {post.category}
                          </span>
                        </div>

                        {/* Titre */}
                        <h3 className="mb-3 text-2xl font-bold text-ivory transition-colors group-hover:text-gold line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Description */}
                        <p className="mb-4 line-clamp-3 text-ivory/80">{post.excerpt}</p>

                        {/* Métadonnées */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-ivory/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={post.date}>{formattedDate}</time>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{post.readingTime}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-gold/10 border border-gold/20 px-2 py-1 text-xs text-gold/80"
                              >
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-ivory/50">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Indicateur hover */}
                      <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-gold via-gold to-gold/50 transition-transform duration-500 group-hover:scale-x-100" />
                    </Link>
                  </motion.article>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bouton Suivant */}
        {totalPages > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 rounded-full border border-gold/30 bg-night/90 p-3 text-gold backdrop-blur-sm transition-all hover:border-gold hover:bg-night hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold"
            aria-label="Article suivant"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Indicateur d'auto-play */}
      {totalPages > 1 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="text-xs text-ivory/50 hover:text-ivory/80 transition-colors"
          >
            {isAutoPlaying ? "⏸ Pause" : "▶ Lecture automatique"}
          </button>
        </div>
      )}
    </section>
  );
}
