"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Eye, ArrowUp, ArrowDown, RotateCcw, Link2, HelpCircle, Clock, BookOpen, Trophy } from "lucide-react";

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
  score?: number;
}

type SortColumn = 'score' | 'views' | 'uniqueVisitors' | 'avgTimeOnPage' | 'avgScrollDepth' | 'lastViewed';
type SortDirection = 'asc' | 'desc';

interface AnalyticsData {
  articles: BlogArticleStats[];
  totalViews: number;
  totalUniqueVisitors: number;
}

interface CTAClicksData {
  clicks: Array<{ type: 'appointment' | 'seminar'; timestamp: string }>;
  summary: {
    appointment: number;
    seminar: number;
  };
}

interface FAQClicksData {
  clicks: Array<{
    faqId: string;
    articleSlug: string;
    faqIndex: number;
    question: string | null;
    timestamp: string
  }>;
  summary: {
    [faqId: string]: {
      opens: number;
      closes: number;
    };
  };
}

export default function BlogAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [ctaClicks, setCTAClicks] = useState<CTAClicksData | null>(null);
  const [faqClicks, setFAQClicks] = useState<FAQClicksData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week">("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, ctaRes, faqRes] = await Promise.all([
        fetch("/api/blog/analytics"),
        fetch("/api/blog/cta-clicks"),
        fetch("/api/blog/faq-clicks"),
      ]);

      if (!analyticsRes.ok) throw new Error("Failed to fetch analytics");

      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      if (ctaRes.ok) {
        const ctaData = await ctaRes.json();
        setCTAClicks(ctaData);
      }

      if (faqRes.ok) {
        const faqData = await faqRes.json();
        setFAQClicks(faqData);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    // Refresh analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  const handleResetStats = async (slug?: string) => {
    if (!window.confirm(
      slug
        ? "Êtes-vous sûr de vouloir réinitialiser les stats de cet article ?"
        : "Êtes-vous sûr de vouloir réinitialiser TOUTES les statistiques ?"
    )) {
      return;
    }

    try {
      const url = slug
        ? `/api/blog/analytics?slug=${slug}`
        : "/api/blog/analytics";

      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to reset stats");

      loadAnalytics();
    } catch (error) {
      console.error("Error resetting stats:", error);
    }
  };

  const handleResetCTAStats = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser les stats CTA ?")) {
      return;
    }

    try {
      const response = await fetch("/api/blog/cta-clicks", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to reset CTA stats");
      loadAnalytics();
    } catch (error) {
      console.error("Error resetting CTA stats:", error);
    }
  };

  const handleResetFAQStats = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser les stats FAQ ?")) {
      return;
    }

    try {
      const response = await fetch("/api/blog/faq-clicks", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to reset FAQ stats");
      loadAnalytics();
    } catch (error) {
      console.error("Error resetting FAQ stats:", error);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortedArticles = (articles: BlogArticleStats[]) => {
    return [...articles].sort((a, b) => {
      let valueA: number;
      let valueB: number;

      switch (sortColumn) {
        case 'score':
          valueA = a.score ?? 0;
          valueB = b.score ?? 0;
          break;
        case 'views':
          valueA = a.views;
          valueB = b.views;
          break;
        case 'uniqueVisitors':
          valueA = a.uniqueVisitors;
          valueB = b.uniqueVisitors;
          break;
        case 'avgTimeOnPage':
          valueA = a.engagement?.avgTimeOnPage ?? 0;
          valueB = b.engagement?.avgTimeOnPage ?? 0;
          break;
        case 'avgScrollDepth':
          valueA = a.engagement?.avgScrollDepth ?? 0;
          valueB = b.engagement?.avgScrollDepth ?? 0;
          break;
        case 'lastViewed':
          valueA = a.lastViewed ? new Date(a.lastViewed).getTime() : 0;
          valueB = b.lastViewed ? new Date(b.lastViewed).getTime() : 0;
          break;
        default:
          valueA = a.score ?? 0;
          valueB = b.score ?? 0;
      }

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
  };

  const SortHeader = ({ column, children, className = "" }: { column: SortColumn; children: React.ReactNode; className?: string }) => (
    <th
      className={`px-4 py-3 font-semibold text-ivory/70 cursor-pointer hover:text-gold transition select-none ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-center') ? 'justify-center' : className.includes('text-left') ? 'justify-start' : ''}`}>
        {children}
        {sortColumn === column && (
          sortDirection === 'desc' ? <ArrowDown className="h-3 w-3 text-gold" /> : <ArrowUp className="h-3 w-3 text-gold" />
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Administration</p>
            <h1 className="mt-2 text-3xl font-semibold text-ivory">Statistiques Blog</h1>
          </div>

          <button
            onClick={() => handleResetStats()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {/* Total Views Card */}
          <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ivory/70">Total des vues</p>
                <h3 className="mt-2 text-3xl font-bold text-gold">
                  {analytics.totalViews.toLocaleString()}
                </h3>
              </div>
              <Eye className="h-8 w-8 text-gold/40" />
            </div>
          </div>

          {/* Unique Visitors Card */}
          <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ivory/70">Visiteurs uniques</p>
                <h3 className="mt-2 text-3xl font-bold text-gold">
                  {analytics.totalUniqueVisitors.toLocaleString()}
                </h3>
              </div>
              <Users className="h-8 w-8 text-gold/40" />
            </div>
          </div>

          {/* Average Views Card */}
          <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ivory/70">Moyenne par visiteur</p>
                <h3 className="mt-2 text-3xl font-bold text-gold">
                  {analytics.totalUniqueVisitors > 0
                    ? (analytics.totalViews / analytics.totalUniqueVisitors).toFixed(2)
                    : "0.00"}
                </h3>
              </div>
              <TrendingUp className="h-8 w-8 text-gold/40" />
            </div>
          </div>

          {/* CTA Clicks Card */}
          {ctaClicks && (
            <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ivory/70">Clics CTA</p>
                  <h3 className="mt-2 text-3xl font-bold text-gold">
                    {(ctaClicks.summary.appointment + ctaClicks.summary.seminar).toLocaleString()}
                  </h3>
                  <p className="mt-2 text-xs text-ivory/50">
                    RDV: {ctaClicks.summary.appointment} | Séminaire: {ctaClicks.summary.seminar}
                  </p>
                </div>
                <Link2 className="h-8 w-8 text-gold/40" />
              </div>
            </div>
          )}

          {/* FAQ Clicks Card */}
          {faqClicks && (
            <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ivory/70">Clics FAQ</p>
                  <h3 className="mt-2 text-3xl font-bold text-gold">
                    {Object.values(faqClicks.summary).reduce((total, item) => total + item.opens, 0).toLocaleString()}
                  </h3>
                  <p className="mt-2 text-xs text-ivory/50">
                    Ouvertures
                  </p>
                </div>
                <HelpCircle className="h-8 w-8 text-gold/40" />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Articles Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm"
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold text-ivory">Articles (Classés par score de succès)</h2>
          </div>
          <div className="text-xs text-ivory/50 bg-night/50 rounded-lg px-3 py-2 border border-gold/10">
            <span className="text-gold">Score</span> = Vues (25%) + Visiteurs (20%) + Durée (25%) + Lecture (30%)
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gold/10" />
            ))}
          </div>
        ) : !analytics || analytics.articles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-ivory/50">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="px-4 py-3 text-left font-semibold text-ivory/70">Rang</th>
                  <SortHeader column="score" className="text-center">Score</SortHeader>
                  <th className="px-4 py-3 text-left font-semibold text-ivory/70">Article</th>
                  <SortHeader column="views" className="text-center">Vues</SortHeader>
                  <SortHeader column="uniqueVisitors" className="text-center">Visiteurs</SortHeader>
                  <SortHeader column="avgTimeOnPage" className="text-center">Durée moy.</SortHeader>
                  <SortHeader column="avgScrollDepth" className="text-center">% Lecture</SortHeader>
                  <SortHeader column="lastViewed" className="text-left">Dernière visite</SortHeader>
                  <th className="px-4 py-3 text-right font-semibold text-ivory/70">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedArticles(analytics.articles).map((article, index) => (
                  <motion.tr
                    key={article.slug}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gold/10 hover:bg-gold/5 transition"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold">
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="h-4 w-4 text-gold/60" />
                        <span className="font-bold text-gold text-lg">
                          {article.score ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <a
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-ivory hover:text-gold transition"
                      >
                        {article.slug}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4 text-gold/60" />
                        <span className="font-semibold text-ivory">
                          {article.views.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4 text-gold/60" />
                        <span className="text-ivory/80">
                          {article.uniqueVisitors.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 text-gold/60" />
                        <span className="text-ivory/80">
                          {article.engagement?.avgTimeOnPage != null
                            ? `${Math.floor(article.engagement.avgTimeOnPage / 60000)}m ${Math.floor((article.engagement.avgTimeOnPage % 60000) / 1000)}s`
                            : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <BookOpen className="h-4 w-4 text-gold/60" />
                        {article.engagement?.avgScrollDepth != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-night/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-gold to-gold/60"
                                style={{ width: `${article.engagement.avgScrollDepth}%` }}
                              />
                            </div>
                            <span className="text-ivory/80 text-xs">
                              {article.engagement.avgScrollDepth}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-ivory/80">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-ivory/70">
                      {article.lastViewed
                        ? new Date(article.lastViewed).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleResetStats(article.slug)}
                        className="rounded-lg p-2 text-ivory/70 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Reset stats for this article"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* CTA Statistics */}
      {ctaClicks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-gold" />
              <h2 className="text-lg font-semibold text-ivory">Statistiques CTA</h2>
            </div>
            <button
              onClick={handleResetCTAStats}
              className="rounded-lg p-2 text-ivory/70 transition hover:bg-red-500/10 hover:text-red-400"
              title="Reset CTA stats"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Appointment CTA */}
            <div className="rounded-lg bg-night/50 p-4 border border-gold/10">
              <p className="text-sm text-ivory/70 font-medium">Rendez-vous</p>
              <h3 className="mt-2 text-2xl font-bold text-gold">
                {ctaClicks.summary.appointment}
              </h3>
              <p className="mt-1 text-xs text-ivory/50">Clics sur le bouton</p>
            </div>

            {/* Seminar CTA */}
            <div className="rounded-lg bg-night/50 p-4 border border-gold/10">
              <p className="text-sm text-ivory/70 font-medium">Séminaire</p>
              <h3 className="mt-2 text-2xl font-bold text-gold">
                {ctaClicks.summary.seminar}
              </h3>
              <p className="mt-1 text-xs text-ivory/50">Clics sur le bouton</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* FAQ Statistics */}
      {faqClicks && Object.keys(faqClicks.summary).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-gold" />
              <h2 className="text-lg font-semibold text-ivory">Statistiques FAQ</h2>
            </div>
            <button
              onClick={handleResetFAQStats}
              className="rounded-lg p-2 text-ivory/70 transition hover:bg-red-500/10 hover:text-red-400"
              title="Reset FAQ stats"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="px-4 py-3 text-left font-semibold text-ivory/70">Article</th>
                  <th className="px-4 py-3 text-left font-semibold text-ivory/70">Question</th>
                  <th className="px-4 py-3 text-center font-semibold text-ivory/70">Ouvertures</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(faqClicks.summary)
                  .sort((a, b) => b[1].opens - a[1].opens) // Trier par nombre d'ouvertures
                  .map(([faqId, data]) => {
                    // Trouver le premier clic pour récupérer les détails
                    const faqClick = faqClicks.clicks.find(c => c.faqId === faqId);
                    const articleSlug = faqClick?.articleSlug || faqId.split('-').slice(0, -1).join('-');
                    const question = faqClick?.question;
                    const faqIndex = faqClick?.faqIndex;

                    return (
                      <tr key={faqId} className="border-b border-gold/10 hover:bg-gold/5 transition">
                        <td className="px-4 py-4">
                          <a
                            href={`/blog/${articleSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ivory/80 hover:text-gold transition text-xs"
                          >
                            {articleSlug}
                          </a>
                          <div className="mt-1 text-xs text-ivory/40">
                            FAQ #{typeof faqIndex === 'number' ? faqIndex + 1 : '?'}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-ivory max-w-md">
                          {question || <span className="text-ivory/40 italic">Question non disponible</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-gold/20 px-3 py-1 text-sm font-semibold text-gold">
                            {data.opens}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
