"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CTAButton } from "../../../components/CTAButton";
import { SectionTitle } from "../../../components/SectionTitle";

interface BlogPost {
  slug: string;
  title: string;
  description?: string;
  author: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
  featured: boolean;
  date: string;
}

const defaultColors = { bg: "bg-gold/20", text: "text-gold", gradient: "from-gold to-gold/60" };

const categoryColors: Record<string, { bg: string; text: string; gradient: string }> = {
  "Psychothérapie": { bg: "bg-blue-500/20", text: "text-blue-300", gradient: "from-blue-500 to-blue-600" },
  "Hypnose": { bg: "bg-purple-500/20", text: "text-purple-300", gradient: "from-purple-500 to-purple-600" },
  "Respiration": { bg: "bg-emerald-500/20", text: "text-emerald-300", gradient: "from-emerald-500 to-emerald-600" },
};

export function BlogSection() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch("/api/blog/posts?limit=3&featuredFirst=true");
        if (response.ok) {
          const data = await response.json();
          setBlogPosts(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des articles:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // Skeleton pendant le chargement pour éviter l'erreur d'hydratation
  if (loading) {
    return (
      <section
        id="blog"
        className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-ivory/10" />
            <div className="h-8 w-80 max-w-full animate-pulse rounded bg-ivory/10" />
            <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-ivory/10" />
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative flex h-72 flex-col overflow-hidden rounded-2xl border border-ivory/10 bg-night/50 p-6"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 animate-pulse bg-ivory/10" />
                <div className="pl-2 space-y-4">
                  <div className="h-6 w-24 animate-pulse rounded-full bg-ivory/10" />
                  <div className="h-6 w-full animate-pulse rounded bg-ivory/10" />
                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-ivory/10" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-ivory/10" />
                  </div>
                  <div className="h-4 w-32 animate-pulse rounded bg-ivory/10" />
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
    <section
      id="blog"
      className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16"
    >
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
            const formattedDate = new Date(post.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ivory/10 bg-night/50 shadow-xl shadow-night/60 transition-all hover:border-ivory/20 hover:bg-night/70"
              >
                {/* Barre de couleur selon la catégorie */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.gradient}`} />

                <Link
                  href={`/blog/${post.slug}`}
                  className="flex h-full flex-col p-6 pl-8 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
                >
                  {/* Badge catégorie */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} px-3 py-1 text-xs font-medium ${colors.text}`}>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {post.category}
                    </span>
                  </div>

                  {/* Titre */}
                  <h3 className="mb-3 text-xl font-semibold text-ivory transition-colors group-hover:text-gold">
                    {post.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 flex-1 line-clamp-3 text-sm text-ivory/70">
                    {post.description}
                  </p>

                  {/* Métadonnées */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ivory/60">
                    <div className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <time dateTime={post.date}>{formattedDate}</time>
                    </div>
                  </div>

                  {/* Indicateur "Lire" */}
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Lire l'article</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>

                  {/* Barre de progression au hover */}
                  <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-gold to-gold/50 transition-transform group-hover:scale-x-100" />
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
          <CTAButton
            variant="secondary"
            href="/blog"
          >
            Découvrir tous les articles
          </CTAButton>
        </motion.div>
      </div>
    </section>
  );
}
