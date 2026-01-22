// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Eye, Users, TrendingUp, ArrowRight, Clock, BookOpen } from "lucide-react";
import Link from "next/link";

interface BlogArticleEngagement {
  avgScrollDepth: number | null;
  avgTimeOnPage: number | null;
  completedReads: number;
  completionRate: number | null;
}

interface BlogArticleStats {
  slug: string;
  views: number;
  uniqueVisitors: number;
  averageViews: string;
  lastViewed: string | null;
  engagement?: BlogArticleEngagement;
}

interface BlogAnalyticsData {
  articles: BlogArticleStats[];
  totalViews: number;
  totalUniqueVisitors: number;
}

export function BlogStatsWidget() {
  const [analytics, setAnalytics] = useState<BlogAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch("/api/blog/analytics");
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Error loading blog analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gold/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const topArticles = analytics.articles.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-gold" />
          <h2 className="text-lg font-semibold text-ivory">Statistiques Blog</h2>
        </div>
        <Link
          href="/admin/blog/analytics"
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition"
        >
          Voir plus
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gold/5 p-4">
          <p className="text-xs font-medium text-ivory/60">Vues totales</p>
          <p className="mt-2 text-xl font-bold text-gold">
            {analytics.totalViews.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-gold/5 p-4">
          <p className="text-xs font-medium text-ivory/60">Visiteurs uniques</p>
          <p className="mt-2 text-xl font-bold text-gold">
            {analytics.totalUniqueVisitors.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-gold/5 p-4">
          <p className="text-xs font-medium text-ivory/60">Moyenne par visiteur</p>
          <p className="mt-2 text-xl font-bold text-gold">
            {analytics.totalUniqueVisitors > 0
              ? (analytics.totalViews / analytics.totalUniqueVisitors).toFixed(2)
              : "0.00"}
          </p>
        </div>
      </div>

      {/* Top Articles */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-ivory">Top 5 Articles</h3>
        <div className="space-y-3">
          {topArticles.map((article, index) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg bg-gold/5 p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                    {index + 1}
                  </span>
                  <a
                    href={`/blog/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-ivory hover:text-gold transition"
                  >
                    {article.slug}
                  </a>
                </div>
                <div className="ml-4 flex items-center gap-4 shrink-0 text-right">
                  <div className="flex items-center gap-1 text-ivory/70">
                    <Eye className="h-3 w-3" />
                    <span>{article.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-ivory/70">
                    <Users className="h-3 w-3" />
                    <span>{article.uniqueVisitors.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {/* Reading engagement metrics */}
              {article.engagement && (article.engagement.avgTimeOnPage != null || article.engagement.avgScrollDepth != null) && (
                <div className="mt-2 flex items-center gap-4 pl-9 text-xs text-ivory/50">
                  {article.engagement.avgTimeOnPage != null && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {Math.floor(article.engagement.avgTimeOnPage / 60000)}m {Math.floor((article.engagement.avgTimeOnPage % 60000) / 1000)}s
                      </span>
                    </div>
                  )}
                  {article.engagement.avgScrollDepth != null && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3" />
                      <div className="w-10 h-1 bg-night/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-gold/60"
                          style={{ width: `${article.engagement.avgScrollDepth}%` }}
                        />
                      </div>
                      <span>{article.engagement.avgScrollDepth}%</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
