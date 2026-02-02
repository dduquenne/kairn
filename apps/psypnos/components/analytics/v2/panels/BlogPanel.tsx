'use client';

import { motion } from 'framer-motion';
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
} from 'lucide-react';

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
    if (ms === null || ms === 0) return '—';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 overflow-x-hidden sm:space-y-6">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {/* Total Views */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gold/10 flex-shrink-0 rounded-lg p-2">
              <Eye size={18} className="text-gold sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Vues totales</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : (data?.totalViews ?? 0).toLocaleString('fr-FR')}
              </p>
              {data?.viewsChange !== undefined && (
                <p
                  className={`flex items-center gap-0.5 text-xs ${data.viewsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {data.viewsChange >= 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
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
          className="from-night/60 to-night/40 rounded-xl border border-blue-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-blue-500/10 p-2">
              <Users size={18} className="text-blue-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Visiteurs uniques</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : (data?.totalUniqueVisitors ?? 0).toLocaleString('fr-FR')}
              </p>
              {data?.visitorsChange !== undefined && (
                <p
                  className={`flex items-center gap-0.5 text-xs ${data.visitorsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {data.visitorsChange >= 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
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
          className="from-night/60 to-night/40 rounded-xl border border-green-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-green-500/10 p-2">
              <TrendingUp size={18} className="text-green-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Moy. par visiteur</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : (data?.avgViewsPerVisitor ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Clicks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="from-night/60 to-night/40 rounded-xl border border-purple-500/20 bg-gradient-to-br p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-purple-500/10 p-2">
              <Link2 size={18} className="text-purple-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Clics CTA</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : (data?.ctaStats?.total ?? 0).toLocaleString('fr-FR')}
              </p>
              {data?.ctaStats && (
                <p className="text-ivory/40 truncate text-xs">
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
          className="from-night/60 to-night/40 col-span-2 rounded-xl border border-orange-500/20 bg-gradient-to-br p-3 sm:col-span-1 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-orange-500/10 p-2">
              <HelpCircle size={18} className="text-orange-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-ivory/50 text-xs">Clics FAQ</p>
              <p className="text-ivory truncate text-lg font-bold sm:text-xl">
                {isLoading ? '...' : (data?.faqStats?.totalOpens ?? 0).toLocaleString('fr-FR')}
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
          className="border-gold/30 from-gold/10 to-gold/5 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <div className="flex items-start gap-4">
            <div className="bg-gold/20 flex-shrink-0 rounded-xl p-3">
              <Trophy size={24} className="text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gold/70 mb-1 text-xs uppercase tracking-wider">
                Article le plus performant
              </p>
              <h3 className="text-ivory truncate text-lg font-semibold">
                {data.topPerformingArticle.title || data.topPerformingArticle.slug}
              </h3>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span className="text-ivory/70 flex items-center gap-1.5">
                  <Eye size={14} className="text-gold/60" />
                  {data.topPerformingArticle.views.toLocaleString('fr-FR')} vues
                </span>
                <span className="text-ivory/70 flex items-center gap-1.5">
                  <Users size={14} className="text-gold/60" />
                  {data.topPerformingArticle.uniqueVisitors.toLocaleString('fr-FR')} visiteurs
                </span>
                <span className="text-ivory/70 flex items-center gap-1.5">
                  <Clock size={14} className="text-gold/60" />
                  {formatDuration(data.topPerformingArticle.avgTimeOnPage)}
                </span>
                <span className="text-ivory/70 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-gold/60" />
                  {data.topPerformingArticle.avgScrollDepth ?? 0}% lu
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-gold text-3xl font-bold">{data.topPerformingArticle.score}</p>
              <p className="text-gold/60 text-xs">Score</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Articles Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-gold text-base font-semibold sm:text-lg">Performance des articles</h3>
          <span className="text-ivory/40 text-xs">{data?.articles?.length ?? 0} articles</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gold/10 h-14 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : !data?.articles || data.articles.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen size={48} className="text-ivory/20 mx-auto mb-4" />
            <p className="text-ivory/50">Aucune donnée d'article disponible</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-gold/20 border-b">
                  <th className="text-ivory/70 px-4 py-3 text-left font-semibold">#</th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">Score</th>
                  <th className="text-ivory/70 px-4 py-3 text-left font-semibold">Article</th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">Vues</th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">Visiteurs</th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">Durée moy.</th>
                  <th className="text-ivory/70 px-4 py-3 text-center font-semibold">% Lecture</th>
                  <th className="text-ivory/70 px-4 py-3 text-left font-semibold">
                    Dernière visite
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.articles.slice(0, 10).map((article, index) => (
                  <motion.tr
                    key={article.slug}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-gold/10 hover:bg-ivory/5 border-b transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? 'bg-gold/20 text-gold'
                            : index === 1
                              ? 'bg-ivory/10 text-ivory/80'
                              : index === 2
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-ivory/5 text-ivory/50'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy size={14} className="text-gold/60" />
                        <span className="text-gold font-bold">{article.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ivory hover:text-gold block max-w-[200px] truncate font-medium transition-colors"
                        title={article.title || article.slug}
                      >
                        {article.title || article.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Eye size={14} className="text-gold/60" />
                        <span className="text-ivory font-semibold">
                          {article.views.toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users size={14} className="text-blue-400/60" />
                        <span className="text-ivory/80">
                          {article.uniqueVisitors.toLocaleString('fr-FR')}
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
                          <div className="bg-night/40 h-1.5 w-12 overflow-hidden rounded-full">
                            <div
                              className="from-gold to-gold/60 h-full bg-gradient-to-r"
                              style={{ width: `${article.avgScrollDepth}%` }}
                            />
                          </div>
                          <span className="text-ivory/80 text-xs">{article.avgScrollDepth}%</span>
                        </div>
                      ) : (
                        <span className="text-ivory/40">—</span>
                      )}
                    </td>
                    <td className="text-ivory/60 px-4 py-3 text-xs">
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
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* CTA Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Link2 size={18} className="text-purple-400" />
            <h3 className="text-gold text-base font-semibold sm:text-lg">Statistiques CTA</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="bg-gold/10 h-16 animate-pulse rounded-lg" />
              <div className="bg-gold/10 h-16 animate-pulse rounded-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-night/50 border-gold/10 rounded-lg border p-4">
                <p className="text-ivory/70 text-sm font-medium">Rendez-vous</p>
                <p className="text-gold mt-2 text-2xl font-bold">
                  {data?.ctaStats?.appointment ?? 0}
                </p>
                <p className="text-ivory/50 mt-1 text-xs">clics</p>
              </div>
              <div className="bg-night/50 border-gold/10 rounded-lg border p-4">
                <p className="text-ivory/70 text-sm font-medium">Séminaire</p>
                <p className="text-gold mt-2 text-2xl font-bold">{data?.ctaStats?.seminar ?? 0}</p>
                <p className="text-ivory/50 mt-1 text-xs">clics</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Top FAQ Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-gold/20 from-night/60 to-night/40 rounded-xl border bg-gradient-to-br p-4 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle size={18} className="text-orange-400" />
            <h3 className="text-gold text-base font-semibold sm:text-lg">
              Questions FAQ populaires
            </h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gold/10 h-12 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !data?.faqStats?.topQuestions || data.faqStats.topQuestions.length === 0 ? (
            <div className="py-8 text-center">
              <HelpCircle size={32} className="text-ivory/20 mx-auto mb-2" />
              <p className="text-ivory/50 text-sm">Aucune donnée FAQ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.faqStats.topQuestions.slice(0, 5).map((faq, index) => (
                <div
                  key={`${faq.articleSlug}-${faq.question}-${index}`}
                  className="hover:bg-ivory/5 flex items-center gap-3 rounded-lg p-3 transition-colors"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ivory truncate text-sm" title={faq.question}>
                      {faq.question || 'Question non disponible'}
                    </p>
                    <p className="text-ivory/40 text-xs">{faq.articleSlug}</p>
                  </div>
                  <span className="bg-gold/20 text-gold flex-shrink-0 rounded-full px-2 py-1 text-xs font-semibold">
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
