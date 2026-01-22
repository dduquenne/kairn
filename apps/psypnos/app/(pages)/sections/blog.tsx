"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CTAButton } from "../../../components/CTAButton";
import { SectionTitle } from "../../../components/SectionTitle";

// Articles statiques (à remplacer par API plus tard)
const blogPosts = [
  {
    slug: "comprendre-anxiete",
    title: "Comprendre l'anxiété : origines et accompagnement",
    excerpt: "L'anxiété est une réponse naturelle du corps face au stress. Découvrez comment la psychothérapie et l'hypnose peuvent vous aider à mieux la gérer.",
    category: "Psychothérapie",
    date: "2024-01-15",
    readingTime: "5 min",
  },
  {
    slug: "hypnose-mythes-realites",
    title: "L'hypnose ericksonienne : mythes et réalités",
    excerpt: "Loin des clichés du spectacle, l'hypnose ericksonienne est un outil thérapeutique puissant et respectueux de votre autonomie.",
    category: "Hypnose",
    date: "2024-01-10",
    readingTime: "7 min",
  },
  {
    slug: "respiration-holotropique-introduction",
    title: "Introduction à la respiration holotropique",
    excerpt: "Découvrez cette technique de respiration profonde qui permet d'accéder à des états modifiés de conscience pour la guérison et la transformation.",
    category: "Respiration",
    date: "2024-01-05",
    readingTime: "6 min",
  },
];

const defaultColors = { bg: "bg-gold/20", text: "text-gold", gradient: "from-gold to-gold/60" };

const categoryColors: Record<string, { bg: string; text: string; gradient: string }> = {
  "Psychothérapie": { bg: "bg-blue-500/20", text: "text-blue-300", gradient: "from-blue-500 to-blue-600" },
  "Hypnose": { bg: "bg-purple-500/20", text: "text-purple-300", gradient: "from-purple-500 to-purple-600" },
  "Respiration": { bg: "bg-emerald-500/20", text: "text-emerald-300", gradient: "from-emerald-500 to-emerald-600" },
};

export function BlogSection() {
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

                  {/* Excerpt */}
                  <p className="mb-4 flex-1 line-clamp-3 text-sm text-ivory/70">
                    {post.excerpt}
                  </p>

                  {/* Métadonnées */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ivory/60">
                    <div className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <time dateTime={post.date}>{formattedDate}</time>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{post.readingTime}</span>
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
