"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, Tag } from "lucide-react";
import type { BlogPostSummary } from "@/lib/blog";
import { resolvePostImage } from "@/lib/blog-utils";
import { getCategoryColors } from "@/lib/categoryColors";

interface BlogListItemProps {
  post: BlogPostSummary;
  index?: number;
}

export function BlogListItem({ post, index = 0 }: BlogListItemProps) {
  const [imageExists, setImageExists] = useState(false);
  const colors = getCategoryColors(post.category);

  useEffect(() => {
    const checkImage = async () => {
      try {
        const imageUrl = resolvePostImage(post);
        if (!imageUrl) {
          setImageExists(false);
          return;
        }

        const response = await fetch(imageUrl, { method: 'HEAD' });
        setImageExists(response.ok);
      } catch {
        setImageExists(false);
      }
    };

    checkImage();
  }, [post]);

  const formattedDate = new Date(post.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-lg border border-ivory/10 bg-gradient-to-br from-night/60 via-night/50 to-night/60 backdrop-blur-sm transition-all hover:border-ivory/20 hover:bg-night/70 hover:shadow-[0_0_30px_rgba(199,169,98,0.15)]`}
    >
      {/* Barre de couleur à gauche */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${colors.gradient}`} />

      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Link href={`/blog/${post.slug}`} className="block focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night rounded-lg">
        <div className="flex flex-col sm:flex-row">
          {/* Image à gauche (vignette) */}
          {imageExists && (
            <div className="relative h-40 sm:h-auto sm:w-56 flex-shrink-0 overflow-hidden bg-night/80">
              <Image
                src={resolvePostImage(post) || ''}
                alt={post.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, 224px"
              />
              {/* Overlay gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          )}

          {/* Contenu à droite */}
          <div className="relative flex flex-1 flex-col justify-between p-6 pl-8">
            <div>
              {/* Badge catégorie */}
              <div className="mb-3 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-3 py-1 text-xs font-medium ${colors.text}`}>
                  <Tag className="h-3 w-3" />
                  {post.category}
                </span>
              </div>

              {/* Titre */}
              <h2 className="mb-2 text-xl font-semibold text-ivory transition-colors group-hover:text-gold line-clamp-2">
                {post.title}
              </h2>

              {/* Description */}
              <p className="mb-4 line-clamp-2 text-sm text-ivory/70">{post.excerpt}</p>
            </div>

            {/* Métadonnées et tags */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-xs text-ivory/60">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <time dateTime={post.date}>{formattedDate}</time>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{post.readingTime}</span>
                </div>
              </div>

              {/* Tags - Réduits */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-ivory/5 px-1.5 py-0.5 text-[10px] text-ivory/60"
                    >
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-[10px] text-ivory/55">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Indicateur hover */}
        <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-gold to-gold/50 transition-transform group-hover:scale-x-100" />
      </Link>
    </motion.article>
  );
}
