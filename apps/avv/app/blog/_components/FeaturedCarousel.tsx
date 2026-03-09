'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Calendar, Clock, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import type { BlogPostSummary } from '@/lib/blog';
import { resolvePostImage } from '@/lib/blog-utils';
import { getCategoryColors } from '@/lib/categoryColors';

interface FeaturedCarouselProps {
  posts: BlogPostSummary[];
}

export function FeaturedCarousel({ posts }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageExists, setImageExists] = useState<Record<string, boolean>>({});
  const [hasMounted, setHasMounted] = useState(false);

  // Nombre d'articles visibles par page (responsive)
  const itemsPerPage = 3;
  const totalPages = Math.ceil(posts.length / itemsPerPage);

  // Track mounting to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Vérifier l'existence des images pour tous les posts (only after mounting)
  useEffect(() => {
    if (!hasMounted) return;

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
  }, [posts, hasMounted]);

  // Défilement automatique toutes les 7 secondes (only after mounting)
  useEffect(() => {
    if (!hasMounted || !isAutoPlaying || totalPages <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalPages);
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalPages, hasMounted]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  const goToPage = useCallback((index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  }, []);

  if (posts.length === 0) return null;

  // During SSR and initial client render, show skeleton to prevent hydration mismatch
  if (!hasMounted) {
    return (
      <section className="relative mb-16">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="text-gold fill-gold h-6 w-6" />
            <h2 className="font-display text-gold-accessible text-3xl font-bold">
              Articles mis en avant
            </h2>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="border-ivory/10 from-night via-night/95 to-night/90 relative animate-pulse overflow-hidden rounded-xl border-2 bg-gradient-to-br"
            >
              <div className="bg-ivory/10 absolute bottom-0 left-0 top-0 w-2" />
              <div className="bg-night/80 h-56" />
              <div className="space-y-4 p-6 pl-8">
                <div className="bg-ivory/10 h-6 w-24 rounded-full" />
                <div className="bg-ivory/10 h-8 w-full rounded" />
                <div className="space-y-2">
                  <div className="bg-ivory/10 h-4 w-full rounded" />
                  <div className="bg-ivory/10 h-4 w-3/4 rounded" />
                </div>
                <div className="flex gap-4">
                  <div className="bg-ivory/10 h-4 w-24 rounded" />
                  <div className="bg-ivory/10 h-4 w-16 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const startIdx = currentIndex * itemsPerPage;
  const visiblePosts = posts.slice(startIdx, startIdx + itemsPerPage);

  return (
    <section className="relative mb-16">
      {/* En-tête */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="text-gold fill-gold h-6 w-6" />
          <h2 className="font-display text-gold-accessible text-3xl font-bold">
            Articles mis en avant
          </h2>
        </div>

        {/* Indicateurs de page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-gold w-8' : 'bg-ivory/30 hover:bg-ivory/50 w-2'
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
            className="border-gold/30 bg-night/90 text-gold hover:border-gold hover:bg-night focus:ring-gold absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full border p-3 backdrop-blur-sm transition-all hover:scale-110 focus:outline-none focus:ring-2"
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
                const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'Europe/Paris',
                });

                return (
                  <motion.article
                    key={post.slug}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                    className={`border-ivory/10 from-night via-night/95 to-night/90 hover:shadow-gold/30 hover:border-ivory/20 group relative overflow-hidden rounded-xl border-2 bg-gradient-to-br backdrop-blur-sm transition-all hover:shadow-2xl`}
                  >
                    {/* Badge Featured animé */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                      className="bg-gold/90 text-night shadow-gold/50 absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-sm"
                    >
                      <Star className="fill-night h-3 w-3" />
                      Mis en avant
                    </motion.div>

                    {/* Barre de couleur à gauche */}
                    <div
                      className={`absolute bottom-0 left-0 top-0 w-2 bg-gradient-to-b ${colors.gradient}`}
                    />

                    {/* Animated background gradient on hover */}
                    <div className="from-gold/10 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <Link
                      href={`/blog/${post.slug}`}
                      className="focus:ring-gold focus:ring-offset-night block rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                    >
                      {/* Image avec glow effect */}
                      {imageExists[post.slug] && (
                        <div className="bg-night/80 relative h-56 overflow-hidden">
                          {/* Glow background */}
                          <div className="bg-gold/5 absolute inset-0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

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
                          <div className="from-night/90 via-night/30 absolute inset-0 bg-gradient-to-t to-transparent" />

                          {/* Gold rim glow on hover */}
                          <div className="border-gold/0 group-hover:border-gold/20 absolute inset-0 border-2 transition-all duration-500 group-hover:shadow-[inset_0_0_20px_rgba(199,169,98,0.2)]" />
                        </div>
                      )}

                      {/* Contenu */}
                      <div className="p-6 pl-8">
                        {/* Badge catégorie */}
                        <div className="mb-4 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-3 py-1.5 text-xs font-semibold ${colors.text}`}
                          >
                            <Tag className="h-3 w-3" />
                            {post.category}
                          </span>
                        </div>

                        {/* Titre */}
                        <h3 className="text-ivory group-hover:text-gold mb-3 line-clamp-2 text-2xl font-bold transition-colors">
                          {post.title}
                        </h3>

                        {/* Description */}
                        <p className="text-ivory/80 mb-4 line-clamp-3">{post.excerpt}</p>

                        {/* Métadonnées */}
                        <div className="text-ivory/60 flex flex-wrap items-center gap-4 text-sm">
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
                            {post.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="bg-gold/10 border-gold/20 text-gold/80 rounded-md border px-2 py-1 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-ivory/50 text-xs">+{post.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Indicateur hover */}
                      <div className="from-gold via-gold to-gold/50 absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100" />
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
            className="border-gold/30 bg-night/90 text-gold hover:border-gold hover:bg-night focus:ring-gold absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 rounded-full border p-3 backdrop-blur-sm transition-all hover:scale-110 focus:outline-none focus:ring-2"
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
            className="text-ivory/50 hover:text-ivory/80 text-xs transition-colors"
          >
            {isAutoPlaying ? '⏸ Pause' : '▶ Lecture automatique'}
          </button>
        </div>
      )}
    </section>
  );
}
