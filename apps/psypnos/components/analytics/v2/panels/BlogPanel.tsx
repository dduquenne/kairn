"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Users,
  Clock,
  BookOpen,
  Trophy,
  Link2,
  HelpCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export interface BlogArticleStats {
  slug: string;
  title?: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number | null;
  avgScrollDepth: number | null;
  score: number;
  lastViewed: string | null;
}

export interface BlogCTAStats {
  appointment: number;
  seminar: number;
  total: number;
}

export interface BlogFAQStats {
  totalOpens: number;
  topQuestions: Array<{
    question: string;
    articleSlug: string;
    opens: number;
  }>;
}

export interface BlogPanelData {
  articles: BlogArticleStats[];
  totalViews: number;
  totalUniqueVisitors: number;
  avgViewsPerVisitor: number;
  ctaStats: BlogCTAStats;
  faqStats: BlogFAQStats;
  topPerformingArticle: BlogArticleStats | null;
  viewsChange?: number;
  visitorsChange?: number;
}

interface BlogPanelProps {
  data: BlogPanelData | null;
  isLoading?: boolean;
}

export function BlogPanel({ data, isLoading = false }: BlogPanelProps) {
  const formatDuration = (ms: number | null): string => {
    if (ms === null || ms === 0) return "—";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Views */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 flex-shrink-0">
              <Eye size={18} className="text-gold sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Vues totales</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : (data?.totalViews ?? 0).toLocaleString("fr-FR")}
              </p>
              {data?.viewsChange !== undefined && (
                <p className={`text-xs flex items-center gap-0.5 ${data.viewsChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {data.viewsChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(data.viewsChange).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Unique Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
              <Users size={18} className="text-blue-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Visiteurs uniques</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : (data?.totalUniqueVisitors ?? 0).toLocaleString("fr-FR")}
              </p>
              {data?.visitorsChange !== undefined && (
                <p className={`text-xs flex items-center gap-0.5 ${data.visitorsChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {data.visitorsChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(data.visitorsChange).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Avg Views per Visitor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
              <TrendingUp size={18} className="text-green-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Moy. par visiteur</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : (data?.avgViewsPerVisitor ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Clicks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
              <Link2 size={18} className="text-purple-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Clics CTA</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : (data?.ctaStats?.total ?? 0).toLocaleString("fr-FR")}
              </p>
              {data?.ctaStats && (
                <p className="text-xs text-ivory/40 truncate">
                  RDV: {data.ctaStats.appointment} | Sém: {data.ctaStats.seminar}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* FAQ Opens */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4 col-span-2 sm:col-span-1"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 flex-shrink-0">
              <HelpCircle size={18} className="text-orange-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Clics FAQ</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : (data?.faqStats?.totalOpens ?? 0).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Performing Article Highlight */}
      {data?.topPerformingArticle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5 p-4 sm:p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gold/20 flex-shrink-0">
              <Trophy size={24} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gold/70 uppercase tracking-wider mb-1">Article le plus performant</p>
              <h3 className="text-lg font-semibold text-ivory truncate">
                {data.topPerformingArticle.title || data.topPerformingArticle.slug}
              </h3>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-ivory/70">
                  <Eye size={14} className="text-gold/60" />
                  {data.topPerformingArticle.views.toLocaleString("fr-FR")} vues
                </span>
                <span className="flex items-center gap-1.5 text-ivory/70">
                  <Users size={14} className="text-gold/60" />
                  {data.topPerformingArticle.uniqueVisitors.toLocaleString("fr-FR")} visiteurs
                </span>
                <span className="flex items-center gap-1.5 text-ivory/70">
                  <Clock size={14} className="text-gold/60" />
                  {formatDuration(data.topPerformingArticle.avgTimeOnPage)}
                </span>
                <span className="flex items-center gap-1.5 text-ivory/70">
                  <BookOpen size={14} className="text-gold/60" />
                  {data.topPerformingArticle.avgScrollDepth ?? 0}% lu
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-3xl font-bold text-gold">{data.topPerformingArticle.score}</p>
              <p className="text-xs text-gold/60">Score</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Articles Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gold">Performance des articles</h3>
          <span className="text-xs text-ivory/40">
            {data?.articles?.length ?? 0} articles
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gold/10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : !data?.articles || data.articles.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen size={48} className="mx-auto text-ivory/20 mb-4" />
            <p className="text-ivory/50">Aucune donnée d'article disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="px-4 py-3 text-left font-semibold text-ivory/70">#</th>
                  <th className="px-4 py-3 text-center font-semibold text-ivory/70">Score</th>
                  <th className="px-4 py-3 text-left font-semibold text-ivory/70">Article</th>
                  <th className="px-4 py-3 text-center font-semibold text-ivory/70">Vues</th>
                  <th className="px-4 py-3 text-center font-semibold text-ivory/70">Visiteurs</th>
                  <th className="px-4 py-3 text-center font-semibold text-ivory/70">Durée moy.</th>
                  <th className="px-4 py-3 text-center font-semibold text-ivory/70">% Lecture</th>
                  <th className="px-4 py-3 text-left font-semibold text-ivory/70">Dernière visite</th>
                </tr>
              </thead>
              <tbody>
                {data.articles.slice(0, 10).map((article, index) => (
                  <motion.tr
                    key={article.slug}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gold/10 hover:bg-ivory/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? "bg-gold/20 text-gold"
                            : index === 1
                            ? "bg-ivory/10 text-ivory/80"
                            : index === 2
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-ivory/5 text-ivory/50"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy size={14} className="text-gold/60" />
                        <span className="font-bold text-gold">{article.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-ivory hover:text-gold transition-colors truncate block max-w-[200px]"
                        title={article.title || article.slug}
                      >
                        {article.title || article.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Eye size={14} className="text-gold/60" />
                        <span className="font-semibold text-ivory">
                          {article.views.toLocaleString("fr-FR")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users size={14} className="text-blue-400/60" />
                        <span className="text-ivory/80">
                          {article.uniqueVisitors.toLocaleString("fr-FR")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock size={14} className="text-green-400/60" />
                        <span className="text-ivory/80">
                          {formatDuration(article.avgTimeOnPage)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {article.avgScrollDepth !== null ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-1.5 bg-night/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gold to-gold/60"
                              style={{ width: `${article.avgScrollDepth}%` }}
                            />
                          </div>
                          <span className="text-ivory/80 text-xs">
                            {article.avgScrollDepth}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-ivory/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ivory/60 text-xs">
                      {formatDate(article.lastViewed)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* CTA & FAQ Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* CTA Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={18} className="text-purple-400" />
            <h3 className="text-base sm:text-lg font-semibold text-gold">Statistiques CTA</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 bg-gold/10 animate-pulse rounded-lg" />
              <div className="h-16 bg-gold/10 animate-pulse rounded-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-night/50 p-4 border border-gold/10">
                <p className="text-sm text-ivory/70 font-medium">Rendez-vous</p>
                <p className="mt-2 text-2xl font-bold text-gold">
                  {data?.ctaStats?.appointment ?? 0}
                </p>
                <p className="mt-1 text-xs text-ivory/50">clics</p>
              </div>
              <div className="rounded-lg bg-night/50 p-4 border border-gold/10">
                <p className="text-sm text-ivory/70 font-medium">Séminaire</p>
                <p className="mt-2 text-2xl font-bold text-gold">
                  {data?.ctaStats?.seminar ?? 0}
                </p>
                <p className="mt-1 text-xs text-ivory/50">clics</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Top FAQ Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={18} className="text-orange-400" />
            <h3 className="text-base sm:text-lg font-semibold text-gold">Questions FAQ populaires</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gold/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !data?.faqStats?.topQuestions || data.faqStats.topQuestions.length === 0 ? (
            <div className="py-8 text-center">
              <HelpCircle size={32} className="mx-auto text-ivory/20 mb-2" />
              <p className="text-sm text-ivory/50">Aucune donnée FAQ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.faqStats.topQuestions.slice(0, 5).map((faq, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-ivory/5 transition-colors"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ivory truncate" title={faq.question}>
                      {faq.question || "Question non disponible"}
                    </p>
                    <p className="text-xs text-ivory/40">{faq.articleSlug}</p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-semibold">
                    {faq.opens}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
