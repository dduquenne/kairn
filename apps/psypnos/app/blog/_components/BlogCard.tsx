"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, Tag } from "lucide-react";
import type { BlogPostSummary } from "@/lib/blog";
import { getCategoryColors } from "@/lib/categoryColors";

interface BlogCardProps {
  post: BlogPostSummary;
  index?: number;
}

export function BlogCard({ post, index = 0 }: BlogCardProps) {
  const [imageExists, setImageExists] = useState(false);
  const colors = getCategoryColors(post.category);

  useEffect(() => {
    const checkImage = async () => {
      try {
        const response = await fetch(`/images/blog/${post.slug}.webp`, { method: 'HEAD' });
        setImageExists(response.ok);
      } catch {
        setImageExists(false);
      }
    };

    checkImage();
  }, [post.slug]);

  const formattedDate = new Date(post.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`group relative overflow-hidden rounded-lg border ${colors.border} ${colors.hover} bg-night/50 backdrop-blur-sm transition-all hover:bg-night/70`}
    >
      {/* Barre de couleur à gauche */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.gradient}`} />

      <Link href={`/blog/${post.slug}`} className="block focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night rounded-lg">
        {/* Image */}
        {imageExists && (
          <div className="relative h-48 overflow-hidden bg-night/80">
            <Image
              src={`/images/blog/${post.slug}.webp`}
              alt={post.title}
              fill
              unoptimized
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Contenu */}
        <div className="p-6 pl-8">
          {/* Badge catégorie */}
          <div className="mb-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-3 py-1 text-xs font-medium ${colors.text}`}>
              <Tag className="h-3 w-3" />
              {post.category}
            </span>
          </div>

          {/* Titre */}
          <h2 className="mb-3 text-2xl font-semibold text-ivory transition-colors group-hover:text-gold">
            {post.title}
          </h2>

          {/* Description */}
          <p className="mb-4 line-clamp-3 text-ivory/70">{post.excerpt}</p>

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

          {/* Tags - Réduits */}
          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
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

        {/* Indicateur hover */}
        <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-gold to-gold/50 transition-transform group-hover:scale-x-100" />
      </Link>
    </motion.article>
  );
}
