/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { FileText, Eye, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TopArticle {
  slug: string;
  title: string;
  views: number;
  trend?: number;
}

interface TopArticleWidgetProps {
  article: TopArticle | null;
  isLoading?: boolean;
}

export function TopArticleWidget({ article, isLoading = false }: TopArticleWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gold/10 rounded-xl" />
          <div className="flex-1">
            <div className="h-3 bg-gold/10 rounded w-1/4 mb-2" />
            <div className="h-5 bg-gold/10 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        href={`/blog/${article.slug}`}
        className="block bg-gold/5 border border-gold/20 rounded-2xl p-4 active:bg-gold/10 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="p-2.5 rounded-xl bg-gold/10 shrink-0">
            <FileText className="h-5 w-5 text-gold" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-ivory/50 uppercase tracking-wide font-medium">
                Article le plus lu
              </p>
              {article.trend !== undefined && article.trend > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  {article.trend}%
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-ivory line-clamp-2 mb-2">
              {article.title}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gold">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-bold">
                  {article.views.toLocaleString("fr-FR")}
                </span>
                <span className="text-xs text-ivory/40">vues</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-ivory/40">
                Lire
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
