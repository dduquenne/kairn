"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

import type { BlogPostSummary } from "@/lib/blog";
import { getCategoryColors } from "@/lib/categoryColors";

interface RelatedPostsProps {
  posts: BlogPostSummary[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-ivory/10 pt-12">
      <h2 className="mb-8 text-2xl font-semibold text-ivory">Articles similaires</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => {
          const colors = getCategoryColors(post.category);
          const formattedDate = new Date(post.date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Europe/Paris",
          });

          return (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-lg border ${colors.border} bg-night/30 backdrop-blur-sm transition-all ${colors.hover} hover:bg-night/50`}
            >
              {/* Barre de couleur à gauche */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.gradient}`} />

              <Link href={`/blog/${post.slug}`} className="block p-6 pl-8 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night rounded-lg">
                {/* Catégorie */}
                <span className={`mb-3 inline-block rounded-full ${colors.bg} px-3 py-1 text-xs font-medium ${colors.text}`}>
                  {post.category}
                </span>

                {/* Titre */}
                <h3 className="mb-2 text-lg font-semibold text-ivory transition-colors group-hover:text-gold">
                  {post.title}
                </h3>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-ivory/60">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.date}>{formattedDate}</time>
                </div>

                {/* Lien "Lire" */}
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold transition-all group-hover:gap-3">
                  <span>Lire l'article</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
