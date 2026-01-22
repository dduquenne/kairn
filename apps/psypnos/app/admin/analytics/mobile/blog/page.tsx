"use client";

import { useEffect, useState } from "react";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { HeroStatCard } from "@/components/mobile/HeroStatCard";
import { SecondaryMetricsRow } from "@/components/mobile/SecondaryMetricsRow";
import { HorizontalBarChart } from "@/components/mobile/HorizontalBarChart";
import { TimeRangeSelector, TimeRange } from "@/components/mobile/TimeRangeSelector";
import { FileText, Eye, Clock, TrendingUp, Sparkles, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { logDataMode } from "@/lib/pwaDataMode";

interface BlogStats {
  totalArticles: number;
  totalViews: number;
  avgReadTime: number;
  engagement: number;
  topArticles: Array<{
    slug: string;
    title: string;
    views: number;
    trend?: number;
    publishedAt?: string;
  }>;
  trends?: {
    views: number;
    readTime: number;
    engagement: number;
  };
}

export default function MobileBlogPage() {
  const [data, setData] = useState<BlogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const router = useRouter();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/blog/stats?range=${timeRange}`);
      if (response.ok) {
        const result = await response.json();
        setData({
          totalArticles: result.totalArticles || 0,
          totalViews: result.totalViews || 0,
          avgReadTime: result.avgReadTime || 0,
          engagement: result.totalArticles > 0
            ? Math.round((result.totalViews / result.totalArticles) * 10) / 10
            : 0,
          topArticles: result.topArticles || [],
          trends: result.trends || {
            views: 0,
            readTime: 0,
            engagement: 0,
          },
        });
      }
    } catch (error) {
      console.error("Error loading blog stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    logDataMode();
    loadData();
  }, [timeRange]);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gold/10 rounded-lg animate-pulse w-1/3" />
        <div className="h-32 bg-gold/10 rounded-2xl animate-pulse" />
        <div className="h-16 bg-gold/10 rounded-2xl animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gold/10 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Secondary metrics
  const secondaryMetrics = [
    {
      label: "Articles",
      value: data.totalArticles,
      icon: FileText,
      color: "gold" as const,
    },
    {
      label: "Temps moy.",
      value: `${Math.round(data.avgReadTime / 60)}m`,
      icon: Clock,
      trend: data.trends?.readTime ? Math.round(data.trends.readTime) : undefined,
      color: "blue" as const,
    },
    {
      label: "Engagement",
      value: data.engagement.toFixed(1),
      icon: Sparkles,
      trend: data.trends?.engagement ? Math.round(data.trends.engagement) : undefined,
      color: "green" as const,
    },
  ];

  // Prepare chart data
  const chartData = data.topArticles.slice(0, 5).map((article) => ({
    label: article.title,
    value: article.views,
    trend: article.trend,
    subtitle: article.publishedAt
      ? new Date(article.publishedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })
      : undefined,
    onClick: () => router.push(`/blog/${article.slug}`),
  }));

  // Calculate max views for sparkline
  const viewsSparkline = data.topArticles.slice(0, 7).map((a) => a.views);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-ivory mb-1">Blog</h1>
          <p className="text-sm text-ivory/50">Statistiques des articles</p>
        </motion.div>

        {/* Time range selector */}
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

        {/* Hero KPI - Total Views */}
        <HeroStatCard
          title="Vues Totales"
          value={data.totalViews}
          trend={data.trends?.views ? Math.round(data.trends.views) : undefined}
          trendLabel="vs période préc."
          icon={Eye}
          sparklineData={viewsSparkline}
          color="gold"
        />

        {/* Secondary metrics */}
        <SecondaryMetricsRow metrics={secondaryMetrics} />

        {/* Top articles with horizontal bars */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gold/5 border border-gold/20 rounded-2xl p-4"
          >
            <HorizontalBarChart
              data={chartData}
              title="Top 5 Articles"
              showRank={true}
            />
          </motion.div>
        )}

        {/* Quick stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gold/5 border border-gold/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-semibold text-ivory/70 uppercase tracking-wide">
              Résumé
            </h3>
          </div>

          <div className="space-y-3">
            {/* Average views per article */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-ivory/60">Vues par article</span>
              <span className="text-sm font-bold text-ivory">
                {data.totalArticles > 0
                  ? Math.round(data.totalViews / data.totalArticles).toLocaleString("fr-FR")
                  : 0}
              </span>
            </div>

            {/* Reading engagement */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-ivory/60">Temps de lecture total</span>
              <span className="text-sm font-bold text-ivory">
                {Math.round((data.avgReadTime * data.totalViews) / 60).toLocaleString("fr-FR")}m
              </span>
            </div>

            {/* Best performer */}
            {data.topArticles[0] && (
              <div className="pt-3 border-t border-gold/10">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3 w-3 text-gold" />
                  <span className="text-xs text-gold uppercase tracking-wide font-medium">
                    Meilleur article
                  </span>
                </div>
                <p className="text-sm text-ivory font-medium line-clamp-1">
                  {data.topArticles[0].title}
                </p>
                <p className="text-xs text-ivory/50">
                  {data.topArticles[0].views.toLocaleString("fr-FR")} vues
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Empty state */}
        {data.topArticles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 px-6"
          >
            <FileText className="h-16 w-16 text-ivory/20 mb-4" />
            <p className="text-lg font-medium text-ivory/60 mb-2">
              Aucun article
            </p>
            <p className="text-sm text-ivory/40 text-center">
              Les statistiques apparaîtront une fois que des articles seront publiés
            </p>
          </motion.div>
        )}
      </div>
    </PullToRefresh>
  );
}
