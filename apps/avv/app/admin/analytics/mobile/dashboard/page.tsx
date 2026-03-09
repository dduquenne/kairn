"use client";

import { motion } from "framer-motion";
import { Eye, Users, Clock, Target } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

import { HeroStatCard } from "@/components/mobile/HeroStatCard";
import { MobileAreaChart } from "@/components/mobile/MobileAreaChart";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { RealTimeVisitors } from "@/components/mobile/RealTimeVisitors";
import { SecondaryMetricsRow } from "@/components/mobile/SecondaryMetricsRow";
import { TimeRangeSelector, TimeRange } from "@/components/mobile/TimeRangeSelector";
import { TopArticleWidget } from "@/components/mobile/TopArticleWidget";
import { TopPagesCondensed } from "@/components/mobile/TopPagesCondensed";
import { useRealTimeAnalytics } from "@/hooks/useRealTimeAnalytics";
import { isMockMode, generateMockChartData, logDataMode } from "@/lib/pwaDataMode";


interface DashboardData {
  totalVisits: number;
  uniqueVisitors: number;
  avgTimeOnSite: number;
  conversionRate: number;
  chartData: Array<{ date: string; value: number }>;
  previousChartData?: Array<{ date: string; value: number }>;
  trends: {
    visits: number;
    visitors: number;
    avgTime: number;
    conversion: number;
  };
  today: {
    visits: number;
    trend: number;
  };
}

interface TopArticle {
  slug: string;
  title: string;
  views: number;
  trend?: number;
}

export default function MobileDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [topArticle, setTopArticle] = useState<TopArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Real-time updates
  const handleRealTimeUpdate = useCallback((update: any) => {
    if (update.type === "visitors") {
      setActiveVisitors(update.data.count || 0);
    }
    setLastUpdate(new Date());
  }, []);

  const { isConnected } = useRealTimeAnalytics({
    enabled: true,
    onUpdate: handleRealTimeUpdate,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch dashboard data and blog stats in parallel
      const [dashboardRes, blogRes] = await Promise.all([
        fetch(`/api/analytics/summary?range=${timeRange}`),
        fetch(`/api/analytics/blog/stats?range=${timeRange}`),
      ]);

      if (dashboardRes.ok) {
        const result = await dashboardRes.json();

        // Use mock data only in mock mode, otherwise use real data (even if empty)
        const chartData = isMockMode()
          ? generateMockChartData(timeRange)
          : result.chartData || [];

        // Generate previous chart data for comparison
        const previousChartData = isMockMode()
          ? generateMockChartData(timeRange).map((d) => ({
              ...d,
              value: Math.round(d.value * (0.7 + Math.random() * 0.4)),
            }))
          : result.previousChartData || [];

        setData({
          totalVisits: result.totalVisits || 0,
          uniqueVisitors: result.totalSessions || result.uniqueSessions || 0,
          avgTimeOnSite: result.avgTimeOnSite || result.averageTimeOnSite || 0,
          conversionRate: result.conversionRate || 0,
          chartData,
          previousChartData,
          trends: result.trends || {
            visits: 0,
            visitors: 0,
            avgTime: 0,
            conversion: 0,
          },
          today: result.today || {
            visits: 0,
            trend: 0,
          },
        });
      }

      if (blogRes.ok) {
        const blogData = await blogRes.json();
        if (blogData.topArticles && blogData.topArticles.length > 0) {
          const top = blogData.topArticles[0];
          setTopArticle({
            slug: top.slug,
            title: top.title,
            views: top.views,
            trend: top.trend,
          });
        }
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    logDataMode();
    loadData();
  }, [timeRange]);

  // Simulate active visitors for demo
  useEffect(() => {
    if (isMockMode()) {
      setActiveVisitors(Math.floor(Math.random() * 15) + 3);
      const interval = setInterval(() => {
        setActiveVisitors((prev) => {
          const change = Math.floor(Math.random() * 5) - 2;
          return Math.max(1, prev + change);
        });
      }, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gold/10 rounded-lg animate-pulse w-1/2" />
        <div className="h-24 bg-gold/10 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gold/10 rounded-2xl animate-pulse" />
        <div className="h-16 bg-gold/10 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gold/10 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Prepare sparkline data from chart data
  const sparklineData = data.chartData.slice(-7).map((d) => d.value);

  // Secondary metrics
  const secondaryMetrics = [
    {
      label: "Visites",
      value: data.totalVisits,
      icon: Eye,
      trend: Math.round(data.trends.visits),
      color: "gold" as const,
    },
    {
      label: "Temps moy.",
      value: `${Math.round(data.avgTimeOnSite / 60)}m`,
      icon: Clock,
      trend: Math.round(data.trends.avgTime),
      color: "blue" as const,
    },
    {
      label: "Conversion",
      value: `${data.conversionRate.toFixed(1)}%`,
      icon: Target,
      trend: Math.round(data.trends.conversion),
      color: data.conversionRate > 5 ? ("green" as const) : ("gold" as const),
    },
  ];

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-ivory mb-1">Dashboard</h1>
          <p className="text-sm text-ivory/50">
            Vue d'ensemble des statistiques
            {lastUpdate && (
              <span className="ml-2 text-gold/60">
                • Mis à jour {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </motion.div>

        {/* Real-time visitors banner */}
        <RealTimeVisitors
          count={activeVisitors}
          isConnected={isConnected}
          todayVisits={data.today.visits}
          todayTrend={data.today.trend}
        />

        {/* Time range selector */}
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

        {/* Hero KPI - Unique Visitors */}
        <HeroStatCard
          title="Visiteurs Uniques"
          value={data.uniqueVisitors}
          trend={Math.round(data.trends.visitors)}
          trendLabel="vs période préc."
          icon={Users}
          sparklineData={sparklineData}
          color="gold"
        />

        {/* Secondary metrics row */}
        <SecondaryMetricsRow metrics={secondaryMetrics} />

        {/* Main chart with comparison */}
        <MobileAreaChart
          data={data.chartData}
          comparisonData={data.previousChartData}
          title="Évolution des Visites"
          showComparison={false}
          showAnnotations={true}
        />

        {/* Top pages */}
        <TopPagesCondensed timeRange={timeRange} />

        {/* Top article widget */}
        <TopArticleWidget article={topArticle} isLoading={isLoading} />

        {/* Offline indicator */}
        {!navigator.onLine && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center"
          >
            <p className="text-sm text-orange-400">
              Mode hors ligne • Données en cache
            </p>
          </motion.div>
        )}
      </div>
    </PullToRefresh>
  );
}
