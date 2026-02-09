'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CTAButton } from '../../../components/CTAButton';
import { SectionTitle } from '../../../components/SectionTitle';
import type { BlogPostData } from '../../../lib/server/data-fetchers';

const defaultColors = { bg: 'bg-gold/20', text: 'text-gold', gradient: 'from-gold to-gold/60' };

const categoryColors: Record<string, { bg: string; text: string; gradient: string }> = {
  Psychothérapie: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-300',
    gradient: 'from-blue-500 to-blue-600',
  },
  Hypnose: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    gradient: 'from-purple-500 to-purple-600',
  },
  Respiration: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  Découvrir: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    gradient: 'from-amber-500 to-amber-600',
  },
};

interface BlogSectionProps {
  initialData?: BlogPostData[];
}

export function BlogSection({ initialData }: BlogSectionProps) {
  const [blogPosts, setBlogPosts] = useState<BlogPostData[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [hasMounted, setHasMounted] = useState(false);
  const [imageExists, setImageExists] = useState<Record<string, boolean>>({});

  // Track mounting to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Check which blog post images exist (client-side only)
  useEffect(() => {
    if (!hasMounted || blogPosts.length === 0) return;

    blogPosts.forEach(post => {
      const src = post.image || `/images/blog/${post.slug}.webp`;
      fetch(src, { method: 'HEAD' })
        .then(res => {
          setImageExists(prev => ({ ...prev, [post.slug]: res.ok }));
        })
        .catch(() => {
          setImageExists(prev => ({ ...prev, [post.slug]: false }));
        });
    });
  }, [hasMounted, blogPosts]);

  // Only fetch if no initialData provided
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      // Already have data, no need to fetch
      return;
    }

    async function fetchPosts() {
      try {
        const response = await fetch('/api/blog/posts?limit=3&featuredFirst=true');
        if (response.ok) {
          const data = await response.json();
          setBlogPosts(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [initialData]);

  // Show skeleton only if no initialData AND (not mounted OR still loading)
  if (!initialData && (!hasMounted || loading)) {
    return (
      <section id="blog" className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-4">
            <div className="bg-ivory/10 h-4 w-32 animate-pulse rounded" />
            <div className="bg-ivory/10 h-8 w-80 max-w-full animate-pulse rounded" />
            <div className="bg-ivory/10 h-4 w-full max-w-2xl animate-pulse rounded" />
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="border-ivory/10 bg-night/50 relative flex h-72 flex-col overflow-hidden rounded-2xl border p-6"
              >
                <div className="bg-ivory/10 absolute bottom-0 left-0 top-0 w-1 animate-pulse" />
                <div className="space-y-4 pl-2">
                  <div className="bg-ivory/10 h-6 w-24 animate-pulse rounded-full" />
                  <div className="bg-ivory/10 h-6 w-full animate-pulse rounded" />
                  <div className="space-y-2">
                    <div className="bg-ivory/10 h-4 w-full animate-pulse rounded" />
                    <div className="bg-ivory/10 h-4 w-3/4 animate-pulse rounded" />
                  </div>
                  <div className="bg-ivory/10 h-4 w-32 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Ne pas afficher la section si pas d'articles
  if (blogPosts.length === 0) {
    return null;
  }

  return (
    <section id="blog" className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle
          eyebrow="Ressources & Articles"
          title="Découvrez nos derniers contenus"
          description="Des articles pour mieux comprendre la psychothérapie, l'hypnose ericksonienne et la respiration holotropique. Ressources gratuites pour votre développement personnel et votre bien-être."
        />

        {/* Grille d'articles */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post, index) => {
            const colors = categoryColors[post.category] || defaultColors;
            const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'Europe/Paris',
            });

            return (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.1 }}
                className="border-ivory/10 bg-night/50 shadow-night/60 hover:border-ivory/20 hover:bg-night/70 group relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-xl transition-all"
              >
                {/* Barre de couleur selon la catégorie */}
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b ${colors.gradient}`}
                />

                <Link
                  href={`/blog/${post.slug}`}
                  className="focus:ring-gold focus:ring-offset-night flex h-full flex-col focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  {/* Vignette */}
                  {hasMounted && imageExists[post.slug] && (
                    <div className="relative h-48 overflow-hidden bg-night/80">
                      <Image
                        src={post.image || `/images/blog/${post.slug}.webp`}
                        alt={post.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6 pl-8">
                  {/* Badge catégorie */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} px-3 py-1 text-xs font-medium ${colors.text}`}
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      {post.category}
                    </span>
                  </div>

                  {/* Titre */}
                  <h3 className="text-ivory group-hover:text-gold mb-3 text-xl font-semibold transition-colors">
                    {post.title}
                  </h3>

                  {/* Description */}
                  <p className="text-ivory/70 mb-4 line-clamp-3 flex-1 text-sm">
                    {post.description}
                  </p>

                  {/* Métadonnées */}
                  <div className="text-ivory/60 flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <time dateTime={post.date}>{formattedDate}</time>
                    </div>
                  </div>

                  {/* Indicateur "Lire" */}
                  <div className="text-gold mt-4 flex items-center gap-2 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Lire l'article</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>
                  </div>

                  {/* Barre de progression au hover */}
                  <div className="from-gold to-gold/50 absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r transition-transform group-hover:scale-x-100" />
                </Link>
              </motion.article>
            );
          })}
        </div>

        {/* CTA vers le blog complet */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center"
        >
          <CTAButton variant="secondary" href="/blog">
            Découvrir tous les articles
          </CTAButton>
        </motion.div>
      </div>
    </section>
  );
}
