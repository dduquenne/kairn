"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { StatCard } from "../../../components/analytics/StatCard";
import { ExecutiveSummary } from "../../../components/analytics/ExecutiveSummary";
import { BarChart, LineChart } from "../../../components/analytics/ChartsRecharts";
import { ConversionFunnel } from "../../../components/analytics/ConversionFunnel";
import { SectionHeatmap } from "../../../components/analytics/SectionHeatmap";
import { BlogStatsWidget } from "../../../components/analytics/BlogStatsWidget";
import { SocialPostsWidget } from "../../../components/analytics/SocialPostsWidget";
import { AIInsights } from "../../../components/analytics/AIInsights";
import { DateRangePicker } from "../../../components/analytics/DateRangePicker";
import { ExportButton } from "../../../components/analytics/ExportButton";
import { Tooltip } from "../../../components/analytics/Tooltip";
import { SortableTable, Column } from "../../../components/analytics/SortableTable";
import { GoalsDashboard } from "../../../components/analytics/GoalsDashboard";
import { AdvancedFunnel } from "../../../components/analytics/AdvancedFunnel";
import { CohortAnalysis } from "../../../components/analytics/CohortAnalysis";
import { AttributionComparison } from "../../../components/analytics/AttributionComparison";
import { ClarityIntegration } from "../../../components/analytics/ClarityIntegration";
import { AlertsManager } from "../../../components/analytics/AlertsManager";
import { AnomaliesWidget } from "../../../components/analytics/AnomaliesWidget";
import { ScheduledReportsManager } from "../../../components/analytics/ScheduledReportsManager";
import { BotTrackingWidget } from "../../../components/analytics/BotTrackingWidget";
import GeolocationMap from "../../../components/admin/analytics/GeolocationMap";
import { AlertCircle, CheckCircle, Trash2, RotateCw, ChevronDown, ChevronUp, Bell, Activity, Calendar, Eye, Users, Clock, Target, Zap, RefreshCw, Radio, Database, AlertTriangle, Bot } from "lucide-react";
import { isMockMode } from "../../../lib/pwaDataMode";

type TimeRange = "realtime" | "last24h" | "daily" | "weekly" | "monthly" | "yearly";

interface AnalyticsSummary {
  totalVisits: number;
  uniqueSessions: number;
  averageTimeOnSite: number;
  conversionRate: number;
  topSections: Array<{ section: string; avgTime: number; visits: number }>;
  conversionByType: Record<string, { clicks: number; completed: number; rate: number }>;
}

interface AnalyticsComparison {
  current: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
  };
  previous: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
  };
  comparison: {
    totalVisitsChange: number;
    uniqueSessionsChange: number;
    averageTimeOnSiteChange: number;
    conversionRateChange: number;
  };
}

interface SectionHeatmapData {
  section: string;
  visitors: number;
  avgTimeSeconds: number;
  scrollRate: number;
  conversionsFromSection: number;
  conversionsByType: Record<
    string,
    { count: number; type: "appointment_request" | "seminar_registration" | "contact_form" }
  >;
}

interface TrafficSource {
  source: string;
  medium: string;
  visits: number;
  uniqueSessions: number;
  conversionRate: number;
}

interface DeviceData {
  deviceType: string;
  visits: number;
  uniqueSessions: number;
  avgTimeOnSite: number;
}

const TIME_RANGE_CONFIG: Record<TimeRange, { days: number; format: (d: Date) => string; label: string }> = {
  realtime: {
    days: 0, // Last hour
    label: "Temps réel (dernière heure)",
    format: (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  last24h: {
    days: 1,
    label: "Dernières 24 heures",
    format: (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  },
  daily: {
    days: 7,
    label: "Quotidien (7 jours)",
    format: (d) => d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
  },
  weekly: {
    days: 28,
    label: "Hebdomadaire (4 semaines)",
    format: (d) => {
      const monday = new Date(d);
      monday.setDate(d.getDate() - d.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}`;
    },
  },
  monthly: {
    days: 0, // Calendar month
    label: "Mensuel (1er - dernier jour)",
    format: (d) => d.toLocaleDateString("fr-FR", { day: "numeric" }),
  },
  yearly: {
    days: 0, // Calendar year
    label: "Annuel (Jan - Dec)",
    format: (d) => d.toLocaleDateString("fr-FR", { month: "short" }),
  },
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [comparison, setComparison] = useState<AnalyticsComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeDate, setPurgeDate] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<any>(null);
  const [visitChartData, setVisitChartData] = useState<Array<{ label: string; value: number }>>([]);
  const [heatmapData, setHeatmapData] = useState<SectionHeatmapData[]>([]);
  const [sevenDayTrendsData, setSevenDayTrendsData] = useState<Array<{ label: string; value: number }>>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] ?? ""
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split("T")[0] ?? ""
  );

  // Phase 2 Analytics sections (collapsible)
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

  // Phase 3 Analytics sections (collapsible)
  const [showPhase3Analytics, setShowPhase3Analytics] = useState(false);
  const [activePhase3Tab, setActivePhase3Tab] = useState<"alerts" | "anomalies" | "reports">("alerts");

  // Bot Tracking section (collapsible)
  const [showBotTracking, setShowBotTracking] = useState(true);

  // Last update timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auto-refresh for realtime mode
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(30);

  // Ref for the advanced analytics section
  const advancedAnalyticsRef = useRef<HTMLDivElement | null>(null);

  const handlePurge = async () => {
    if (!purgeDate) return;

    setIsPurging(true);
    try {
      const response = await fetch("/api/analytics/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purgeDate }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression des données");
      }

      const result = await response.json();
      setPurgeResult(result);
      setPurgeDate("");

      // Refresh analytics data after purge
      setTimeout(() => {
        setShowPurgeModal(false);
        setPurgeResult(null);
        // Trigger a full refresh of all dashboard data
        handleRefresh();
      }, 2000);
    } catch (err) {
      setPurgeResult({
        error: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setIsPurging(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      // For realtime and last24h, we use "hour" mode to get raw visit data
      const mappedTimeRange =
        timeRange === "realtime" ? "hour" :
        timeRange === "last24h" ? "hour" :
        timeRange === "daily" ? "day" :
        timeRange === "weekly" ? "week" :
        timeRange === "monthly" ? "month" : "year";
      params.append("timeRange", mappedTimeRange);

      // For realtime and last24h, we need to set custom date ranges
      if (timeRange === "realtime") {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        params.append("startDate", oneHourAgo.toISOString());
        params.append("endDate", now.toISOString());
      } else if (timeRange === "last24h") {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        params.append("startDate", twentyFourHoursAgo.toISOString());
        params.append("endDate", now.toISOString());
      }

      if (useCustomDates && customStartDate && customEndDate) {
        params.append("startDate", new Date(customStartDate).toISOString());
        params.append("endDate", new Date(customEndDate).toISOString());
      }

      // Use consolidated endpoint
      const response = await fetch(`/api/analytics/dashboard?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      // Update all state from consolidated response
      setSummary(data.summary);
      setComparison(data.comparison);
      setHeatmapData(data.heatmap);
      setTrafficSources(data.trafficSources);
      setDeviceData(data.deviceBreakdown);

      // Transform visits data for chart
      const now = new Date();
      const chartData: Array<{ label: string; value: number }> = [];
      const periodData = data.visits;

      if (timeRange === "realtime") {
        // Display last 12 intervals of 5 minutes each (last hour)
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMinutes(date.getMinutes() - (i * 5));
          // Round to nearest 5-minute interval
          date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
          date.setSeconds(0);
          date.setMilliseconds(0);

          // For realtime, we aggregate visits from the raw data
          const intervalStart = new Date(date);
          const intervalEnd = new Date(date.getTime() + 5 * 60 * 1000);

          // Count visits in this interval from the raw period data
          const visitsInInterval = periodData.filter((d: any) => {
            const visitDate = new Date(d.period || d.timestamp);
            return visitDate >= intervalStart && visitDate < intervalEnd;
          }).reduce((sum: number, d: any) => sum + (d.visits || 1), 0);

          chartData.push({
            label: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            value: visitsInInterval,
          });
        }
      } else if (timeRange === "last24h") {
        // Display last 24 hours in 1-hour intervals
        // periodData contains raw visits with timestamps (like realtime mode)
        for (let i = 23; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(date.getHours() - i);
          date.setMinutes(0);
          date.setSeconds(0);
          date.setMilliseconds(0);

          const intervalStart = new Date(date);
          const intervalEnd = new Date(date.getTime() + 60 * 60 * 1000); // 1 hour later

          // Count visits in this hour interval from raw data
          const visitsInHour = periodData.filter((d: any) => {
            const visitDate = new Date(d.period || d.timestamp);
            return visitDate >= intervalStart && visitDate < intervalEnd;
          }).reduce((sum: number, d: any) => sum + (d.visits || 1), 0);

          chartData.push({
            label: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            value: visitsInHour,
          });
        }
      } else if (timeRange === "daily") {
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const dayData = periodData.find((d: any) => d.period === dateStr);
          chartData.push({
            label: date.toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "numeric"
            }),
            value: dayData?.visits || 0,
          });
        }
      } else if (timeRange === "weekly") {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          const tempDate = new Date(date);
          tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
          const yearStart = new Date(tempDate.getFullYear(), 0, 1);
          const weekNum = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
          const year = date.getFullYear();
          const weekKey = `${year}-W${weekNum.toString().padStart(2, "0")}`;
          const weekData = periodData.find((d: any) => d.period === weekKey);
          chartData.push({
            label: `S${weekNum}`,
            value: weekData?.visits || 0,
          });
        }
      } else if (timeRange === "monthly") {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const monthData = periodData.find((d: any) => d.period === monthKey);
          chartData.push({
            label: date.toLocaleDateString("fr-FR", { month: "short" }),
            value: monthData?.visits || 0,
          });
        }
      } else {
        for (let i = 9; i >= 0; i--) {
          const date = new Date(now.getFullYear() - i, 0, 1);
          const yearKey = `${date.getFullYear()}`;
          const yearData = periodData.find((d: any) => d.period === yearKey);
          chartData.push({
            label: date.toLocaleDateString("fr-FR", { year: "2-digit" }),
            value: yearData?.visits || 0,
          });
        }
      }

      setVisitChartData(chartData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error refreshing analytics:", err);
      setError("Erreur lors du rafraîchissement des données");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load all data on mount and when time range or custom dates change
  useEffect(() => {
    setIsLoading(true);
    handleRefresh().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, useCustomDates, customStartDate, customEndDate]);

  // Handle click on "Voir le rapport détaillé" - scroll to advanced analytics
  const handleDetailedReportClick = useCallback(() => {
    // Open the advanced analytics section
    setShowAdvancedAnalytics(true);

    // Wait for the section to open, then scroll to it
    setTimeout(() => {
      if (advancedAnalyticsRef.current) {
        advancedAnalyticsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  }, []);

  // Auto-refresh for realtime mode (every 30 seconds)
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (timeRange === "realtime") {
      setIsAutoRefreshing(true);
      setNextRefreshIn(30);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setNextRefreshIn((prev) => {
          if (prev <= 1) {
            return 30; // Reset countdown
          }
          return prev - 1;
        });
      }, 1000);

      // Refresh data every 30 seconds
      refreshIntervalRef.current = setInterval(() => {
        handleRefresh();
      }, 30000);

      return () => {
        clearInterval(countdownInterval);
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        setIsAutoRefreshing(false);
      };
    } else {
      setIsAutoRefreshing(false);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gold/20" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded bg-gold/20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
        {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-lg border border-gold/20 bg-night/40 p-8 text-center text-ivory/70">
        Aucune donnée d'analytiques disponible
      </div>
    );
  }

  // Format average time on site
  const avgTimeMinutes = Math.round(summary.averageTimeOnSite / 60000);

  // Sort sections by visits (descending) for chart display
  // Use spread operator to create a copy before sorting to avoid mutating the original array
  const sectionChartData = [...summary.topSections]
    .sort((a, b) => b.visits - a.visits)
    .map((section) => ({
      label: section.section.substring(0, 15),
      value: section.visits,
    }));

  // Sort sections by average time spent (descending) for engagement chart
  // Use spread operator to create a copy before sorting to avoid mutating the original array
  const sectionTimeChartData = [...summary.topSections]
    .sort((a, b) => b.avgTime - a.avgTime)
    .map((section) => ({
      label: section.section.substring(0, 15),
      value: Math.round(section.avgTime / 1000), // Convert to seconds
    }));

  // Sort sections by visits count (descending) for table display
  const sortedSectionsByVisits = [...summary.topSections].sort((a, b) => b.visits - a.visits);

  // Calculate total visits for percentage calculation
  const totalSectionVisits = summary.topSections.reduce((sum, s) => sum + s.visits, 0);

  // Sort sections by percentage of total (descending) for engagement table
  const sortedSectionsByPercentage = [...summary.topSections]
    .map((section) => ({
      ...section,
      percentage: totalSectionVisits > 0 ? (section.visits / totalSectionVisits) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Tableau de bord</p>
            <h1 className="mt-2 text-3xl font-semibold text-ivory">Analytiques du site</h1>

            {/* Tracking Status Indicator */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Tracking enabled/disabled */}
              {process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false' ? (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span className="text-xs font-medium text-amber-300">Tracking désactivé</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/40 px-3 py-1">
                  <Radio size={14} className="text-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-green-300">Tracking actif</span>
                </div>
              )}

              {/* Data source indicator */}
              {isMockMode() ? (
                <div className="flex items-center gap-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-1">
                  <Database size={14} className="text-purple-400" />
                  <span className="text-xs font-medium text-purple-300">Données simulées</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-1">
                  <Database size={14} className="text-blue-400" />
                  <span className="text-xs font-medium text-blue-300">Données réelles</span>
                </div>
              )}
            </div>

            {lastUpdated && (
              <p className="mt-2 text-xs text-ivory/40 flex items-center gap-1">
                <RefreshCw size={12} className={isAutoRefreshing ? "animate-spin" : ""} />
                Dernière mise à jour : {lastUpdated.toLocaleTimeString("fr-FR")}
                {isAutoRefreshing && (
                  <span className="ml-2 text-gold">
                    (Prochain rafraîchissement dans {nextRefreshIn}s)
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {/* Time Range Selector */}
            <div className="flex flex-wrap gap-2">
              {(["realtime", "last24h", "daily", "weekly", "monthly", "yearly"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  title={TIME_RANGE_CONFIG[range].label}
                  className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition ${
                    timeRange === range
                      ? range === "realtime"
                        ? "bg-green-500 text-night animate-pulse"
                        : "bg-gold text-night"
                      : "border border-gold/30 text-gold hover:bg-gold/10"
                  }`}
                >
                  {range === "realtime"
                    ? "Temps réel"
                    : range === "last24h"
                      ? "24h"
                      : range === "daily"
                        ? "Quotidien"
                        : range === "weekly"
                          ? "Hebdomadaire"
                          : range === "monthly"
                            ? "Mensuel"
                            : "Annuel"}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <DateRangePicker
                startDate={customStartDate}
                endDate={customEndDate}
                onDateChange={(start, end) => {
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                  setUseCustomDates(true);
                }}
              />

              <ExportButton
                startDate={useCustomDates ? customStartDate : undefined}
                endDate={useCustomDates ? customEndDate : undefined}
              />

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs sm:text-sm font-medium text-gold hover:bg-gold/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Rafraîchir les données du tableau de bord"
              >
                <RotateCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Rafraîchir</span>
                <span className="sm:hidden">Actualiser</span>
              </button>

              <button
                onClick={() => setShowPurgeModal(true)}
                className="flex items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs sm:text-sm font-medium text-red-300 hover:bg-red-500/20 transition"
                title="Supprimer les données antérieures à une date"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Purger données</span>
                <span className="sm:hidden">Purger</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Executive Summary */}
      <ExecutiveSummary
        comparison={comparison}
        timeRange={timeRange}
        topSection={sortedSectionsByVisits[0]?.section}
        topTrafficSource={trafficSources[0]?.source}
        onDetailedReportClick={handleDetailedReportClick}
      />

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StatCard
            label="Visites totales"
            value={comparison?.current.totalVisits || summary.totalVisits}
            iconComponent={Eye}
            accentColor="gold"
            description="Nombre total de pages vues"
            sparklineData={visitChartData.slice(-7).map(d => ({ value: d.value }))}
            change={
              comparison
                ? {
                    value: comparison.comparison.totalVisitsChange,
                    isPositive: comparison.comparison.totalVisitsChange >= 0,
                  }
                : undefined
            }
            changeLabel={
              timeRange === "realtime"
                ? "temps réel"
                : timeRange === "last24h"
                  ? "vs 24h précédentes"
                  : timeRange === "daily"
                    ? "vs hier"
                    : timeRange === "weekly"
                      ? "vs semaine passée"
                      : timeRange === "monthly"
                        ? "vs mois dernier"
                        : "vs année dernière"
            }
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StatCard
            label="Sessions uniques"
            value={comparison?.current.uniqueSessions || summary.uniqueSessions}
            iconComponent={Users}
            accentColor="blue"
            description="Visiteurs uniques par session"
            change={
              comparison
                ? {
                    value: comparison.comparison.uniqueSessionsChange,
                    isPositive: comparison.comparison.uniqueSessionsChange >= 0,
                  }
                : undefined
            }
            changeLabel={
              timeRange === "realtime"
                ? "temps réel"
                : timeRange === "last24h"
                  ? "vs 24h précédentes"
                  : timeRange === "daily"
                    ? "vs hier"
                    : timeRange === "weekly"
                      ? "vs semaine passée"
                      : timeRange === "monthly"
                        ? "vs mois dernier"
                        : "vs année dernière"
            }
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StatCard
            label="Temps moyen (min)"
            value={
              comparison
                ? Math.round(comparison.current.averageTimeOnSite / 60000)
                : avgTimeMinutes
            }
            iconComponent={Clock}
            accentColor="purple"
            description="Durée moyenne par session"
            change={
              comparison
                ? {
                    value: comparison.comparison.averageTimeOnSiteChange,
                    isPositive: comparison.comparison.averageTimeOnSiteChange >= 0,
                  }
                : undefined
            }
            changeLabel={
              timeRange === "realtime"
                ? "temps réel"
                : timeRange === "last24h"
                  ? "vs 24h précédentes"
                  : timeRange === "daily"
                    ? "vs hier"
                    : timeRange === "weekly"
                      ? "vs semaine passée"
                      : timeRange === "monthly"
                        ? "vs mois dernier"
                        : "vs année dernière"
            }
          />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StatCard
            label="Taux de conversion"
            value={`${(comparison?.current.conversionRate ?? summary.conversionRate ?? 0).toFixed(1)}%`}
            iconComponent={Target}
            accentColor="green"
            description="Pourcentage de visiteurs convertis"
            change={
              comparison
                ? {
                    value: comparison.comparison.conversionRateChange,
                    isPositive: comparison.comparison.conversionRateChange >= 0,
                  }
                : undefined
            }
            changeLabel={
              timeRange === "realtime"
                ? "temps réel"
                : timeRange === "last24h"
                  ? "vs 24h précédentes"
                  : timeRange === "daily"
                    ? "vs hier"
                    : timeRange === "weekly"
                      ? "vs semaine passée"
                      : timeRange === "monthly"
                        ? "vs mois dernier"
                        : "vs année dernière"
            }
          />
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <LineChart title="Visites au fil du temps" data={visitChartData} />
        <BarChart title="Temps moyen par section (secondes)" data={sectionTimeChartData} />
      </motion.div>

      {/* 7-Day Trend Chart */}
      {sevenDayTrendsData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <LineChart
            title="Tendances 7 jours (visiteurs par jour)"
            data={sevenDayTrendsData}
          />
        </motion.div>
      )}

      {/* Conversion Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <ConversionFunnel data={summary.conversionByType} />
      </motion.div>

      {/* Blog Statistics Widget */}
      <BlogStatsWidget />

      {/* Social Posts Widget */}
      <SocialPostsWidget />

      {/* Geolocation Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <GeolocationMap />
      </motion.div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <AIInsights
          timeRange={
            timeRange === "daily" ? "day" :
            timeRange === "weekly" ? "week" :
            timeRange === "monthly" ? "month" : "year"
          }
        />
      </motion.div>

      {/* Top Sections Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <SortableTable
          title="Sections les plus engageantes"
          subtitle="Cliquez sur les en-têtes pour trier"
          data={sortedSectionsByPercentage}
          showRanking={true}
          defaultSortKey="percentage"
          columns={[
            {
              key: "section",
              label: "Section",
              align: "left",
              format: (value) => (
                <span className="font-medium text-ivory">{String(value)}</span>
              ),
            },
            {
              key: "visits",
              label: "Visites",
              align: "right",
              highlightExtremes: true,
            },
            {
              key: "avgTime",
              label: "Temps moy.",
              align: "right",
              highlightExtremes: true,
              format: (value) => `${Math.round(Number(value) / 1000)}s`,
              getValue: (row) => Number(row.avgTime),
            },
            {
              key: "percentage",
              label: "% du total",
              align: "right",
              highlightExtremes: true,
              format: (value) => (
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-16 h-1.5 bg-night/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-gold/60"
                      style={{ width: `${Number(value)}%` }}
                    />
                  </div>
                  <span>{Number(value).toFixed(1)}%</span>
                </div>
              ),
              getValue: (row) => Number(row.percentage),
            },
          ] as Column<typeof sortedSectionsByPercentage[0]>[]}
        />
      </motion.div>

      {/* Traffic Sources */}
      {trafficSources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <SortableTable
            title="Sources de trafic"
            subtitle="Top 10 sources d'acquisition"
            data={trafficSources}
            maxRows={10}
            showRanking={true}
            defaultSortKey="visits"
            columns={[
              {
                key: "source",
                label: "Source",
                align: "left",
                format: (value) => (
                  <span className="font-medium text-ivory truncate max-w-[100px] block">
                    {String(value)}
                  </span>
                ),
              },
              {
                key: "medium",
                label: "Médium",
                align: "left",
                format: (value) => (
                  <span className="text-ivory/60 text-xs px-2 py-0.5 bg-ivory/10 rounded">
                    {String(value)}
                  </span>
                ),
              },
              {
                key: "visits",
                label: "Visites",
                align: "right",
                highlightExtremes: true,
              },
              {
                key: "conversionRate",
                label: "Conv. %",
                align: "right",
                highlightExtremes: true,
                format: (value) => {
                  const rate = Number(value);
                  return (
                    <span className={rate >= 5 ? "text-green-400 font-semibold" : rate >= 2 ? "text-gold" : ""}>
                      {rate.toFixed(1)}%
                    </span>
                  );
                },
              },
            ] as Column<TrafficSource>[]}
          />

          {/* Device Breakdown */}
          <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
            <h3 className="mb-6 text-lg font-semibold text-gold">Appareils</h3>
            <div className="space-y-4">
              {deviceData.map((device, index) => {
                const totalVisits = deviceData.reduce((sum, d) => sum + d.visits, 0);
                const percentage = totalVisits > 0 ? (device.visits / totalVisits) * 100 : 0;

                return (
                  <motion.div
                    key={device.deviceType}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg bg-night/50 p-4 border border-gold/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-ivory capitalize">
                        {device.deviceType}
                      </span>
                      <div className="flex gap-4 text-xs text-ivory/70">
                        <span>{device.visits} visites</span>
                        <span className="text-gold font-semibold">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-night/40 border border-gold/20">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
                        className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-gold to-gold/60"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-ivory/50">
                      Temps moyen: {Math.round(device.avgTimeOnSite / 1000)}s
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Section Heatmap */}
      {heatmapData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <SectionHeatmap data={heatmapData} />
        </motion.div>
      )}

      {/* Phase 2: Advanced Analytics Section */}
      <motion.div
        ref={advancedAnalyticsRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-8"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
          className="w-full flex items-center justify-between rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 to-gold/5 px-6 py-4 text-left transition hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5 group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gold/20 text-gold group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gold">Analytics Avancés</h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gold/20 text-gold">
                  Phase 2
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                  5 outils
                </span>
              </div>
              <p className="text-sm text-ivory/60 mt-1">
                Goals, Funnels, Cohortes, Attribution Marketing et Session Replay
              </p>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-gold/10 transition-transform ${showAdvancedAnalytics ? "rotate-180" : ""}`}>
            <ChevronDown className="text-gold" size={20} />
          </div>
        </button>

        {/* Advanced Analytics Content */}
        {showAdvancedAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-8"
          >
            {/* Goals Dashboard */}
            <GoalsDashboard
              startDate={useCustomDates ? customStartDate : undefined}
              endDate={useCustomDates ? customEndDate : undefined}
            />

            {/* Advanced Funnel Analysis */}
            <AdvancedFunnel
              startDate={useCustomDates ? customStartDate : undefined}
              endDate={useCustomDates ? customEndDate : undefined}
            />

            {/* Attribution Comparison */}
            <AttributionComparison
              startDate={useCustomDates ? customStartDate : undefined}
              endDate={useCustomDates ? customEndDate : undefined}
            />

            {/* Cohort Analysis */}
            <CohortAnalysis
              startDate={useCustomDates ? customStartDate : undefined}
              endDate={useCustomDates ? customEndDate : undefined}
            />

            {/* Clarity Integration */}
            <ClarityIntegration
              clarityProjectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Phase 3: Automatisation & Alertes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setShowPhase3Analytics(!showPhase3Analytics)}
          className="w-full flex items-center justify-between rounded-xl border border-gold/30 bg-gradient-to-r from-gold/15 to-gold/5 px-6 py-4 text-left transition hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5 group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gold/20 text-gold group-hover:scale-110 transition-transform">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gold">Automatisation & Alertes</h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gold/20 text-gold">
                  Phase 3
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
                  3 outils
                </span>
              </div>
              <p className="text-sm text-ivory/60 mt-1">
                Alertes, Détection d'anomalies et Rapports programmés
              </p>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-gold/10 transition-transform ${showPhase3Analytics ? "rotate-180" : ""}`}>
            <ChevronDown className="text-gold" size={20} />
          </div>
        </button>

        {/* Phase 3 Analytics Content */}
        {showPhase3Analytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gold/20 pb-4">
              <button
                onClick={() => setActivePhase3Tab("alerts")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activePhase3Tab === "alerts"
                    ? "bg-gold text-night"
                    : "bg-ivory/10 text-ivory/70 hover:bg-ivory/20"
                }`}
              >
                <Bell size={16} />
                Alertes
              </button>
              <button
                onClick={() => setActivePhase3Tab("anomalies")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activePhase3Tab === "anomalies"
                    ? "bg-gold text-night"
                    : "bg-ivory/10 text-ivory/70 hover:bg-ivory/20"
                }`}
              >
                <Activity size={16} />
                Anomalies
              </button>
              <button
                onClick={() => setActivePhase3Tab("reports")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activePhase3Tab === "reports"
                    ? "bg-gold text-night"
                    : "bg-ivory/10 text-ivory/70 hover:bg-ivory/20"
                }`}
              >
                <Calendar size={16} />
                Rapports
              </button>
            </div>

            {/* Tab Content */}
            <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
              {activePhase3Tab === "alerts" && <AlertsManager />}
              {activePhase3Tab === "anomalies" && <AnomaliesWidget />}
              {activePhase3Tab === "reports" && <ScheduledReportsManager />}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Bot Tracking Section - SEO Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="mt-8"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setShowBotTracking(!showBotTracking)}
          className="w-full flex items-center justify-between rounded-xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-green-500/5 px-6 py-4 text-left transition hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/5 group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-500/20 text-green-400 group-hover:scale-110 transition-transform">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-green-400">Tracking des Bots SEO</h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                  SEO
                </span>
              </div>
              <p className="text-sm text-ivory/60 mt-1">
                Analyse des crawlers, robots de recherche et outils SEO visitant le site
              </p>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-green-500/10 transition-transform ${showBotTracking ? "rotate-180" : ""}`}>
            <ChevronDown className="text-green-400" size={20} />
          </div>
        </button>

        {/* Bot Tracking Content */}
        {showBotTracking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <BotTrackingWidget
              timeRange={
                timeRange === "realtime" ? "24h" :
                timeRange === "last24h" ? "24h" :
                timeRange === "daily" ? "7d" :
                timeRange === "weekly" ? "30d" :
                timeRange === "monthly" ? "90d" : "90d"
              }
              startDate={useCustomDates ? customStartDate : undefined}
              endDate={useCustomDates ? customEndDate : undefined}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Purge Modal */}
      {showPurgeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => !isPurging && !purgeResult && setShowPurgeModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 max-w-md rounded-lg border border-gold/30 bg-gradient-to-br from-night/90 to-night/70 p-6 shadow-2xl backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {!purgeResult ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-red-400" size={24} />
                  <h2 className="text-xl font-semibold text-ivory">Supprimer les données</h2>
                </div>

                <p className="mb-4 text-ivory/70">
                  Entrez une date pour supprimer toutes les données antérieures à celle-ci (incluse).
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gold mb-2">
                    Date limite (incluse)
                  </label>
                  <input
                    type="date"
                    value={purgeDate}
                    onChange={(e) => setPurgeDate(e.target.value)}
                    disabled={isPurging}
                    className="w-full rounded-lg border border-gold/30 bg-night/50 px-3 py-2 text-ivory placeholder-ivory/50 focus:border-gold focus:outline-none disabled:opacity-50"
                  />
                  <p className="mt-2 text-xs text-ivory/50">
                    Les données avec un timestamp ≤ à cette date seront supprimées.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPurgeModal(false)}
                    disabled={isPurging}
                    className="flex-1 rounded-lg border border-gold/30 px-4 py-2 font-medium text-gold hover:bg-gold/10 transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePurge}
                    disabled={!purgeDate || isPurging}
                    className="flex-1 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-2 font-medium text-red-300 hover:bg-red-500/30 transition disabled:opacity-50"
                  >
                    {isPurging ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  {purgeResult.error ? (
                    <AlertCircle className="text-red-400" size={24} />
                  ) : (
                    <CheckCircle className="text-green-400" size={24} />
                  )}
                  <h2 className="text-xl font-semibold text-ivory">
                    {purgeResult.error ? "Erreur" : "Succès"}
                  </h2>
                </div>

                {purgeResult.error ? (
                  <p className="mb-4 text-red-300">{purgeResult.error}</p>
                ) : (
                  <>
                    <div className="mb-4 space-y-2 text-sm">
                      <p className="text-green-300 font-medium">{purgeResult.message}</p>

                      {purgeResult.backupCreated && (
                        <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="text-xs text-blue-300">
                            <strong>Backup créé:</strong>
                          </p>
                          <p className="text-xs text-blue-200 mt-1 break-all font-mono">
                            {purgeResult.backupCreated}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gold/20 space-y-2 text-ivory/70">
                        <p>
                          <strong className="text-ivory">Enregistrements supprimés:</strong>
                        </p>
                        <ul className="ml-4 space-y-1 text-xs">
                          <li>Visites: {purgeResult.deletedRecords?.pageVisits || 0}</li>
                          <li>Sections: {purgeResult.deletedRecords?.sectionTimes || 0}</li>
                          <li>Conversions: {purgeResult.deletedRecords?.conversionEvents || 0}</li>
                          <li>Événements: {purgeResult.deletedRecords?.customEvents || 0}</li>
                          <li>Blog - Vues: {purgeResult.deletedRecords?.blogAnalytics || 0}</li>
                          <li>Blog - CTA: {purgeResult.deletedRecords?.blogCtaClicks || 0}</li>
                          <li>Blog - FAQ: {purgeResult.deletedRecords?.blogFaqClicks || 0}</li>
                          <li className="font-medium text-gold">
                            Total: {purgeResult.deletedRecords?.total || 0}
                          </li>
                        </ul>
                        <p className="mt-3">
                          <strong className="text-ivory">Enregistrements restants:</strong>
                        </p>
                        <ul className="ml-4 space-y-1 text-xs">
                          <li>Visites: {purgeResult.remainingRecords?.pageVisits || 0}</li>
                          <li>Sections: {purgeResult.remainingRecords?.sectionTimes || 0}</li>
                          <li>Conversions: {purgeResult.remainingRecords?.conversionEvents || 0}</li>
                          <li>Événements: {purgeResult.remainingRecords?.customEvents || 0}</li>
                          <li>Blog - Vues: {purgeResult.remainingRecords?.blogAnalytics || 0}</li>
                          <li>Blog - CTA: {purgeResult.remainingRecords?.blogCtaClicks || 0}</li>
                          <li>Blog - FAQ: {purgeResult.remainingRecords?.blogFaqClicks || 0}</li>
                          <li className="font-medium text-gold">
                            Total: {purgeResult.remainingRecords?.total || 0}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={() => {
                    setShowPurgeModal(false);
                    setPurgeResult(null);
                    setTimeRange("daily");
                  }}
                  className="w-full rounded-lg bg-gold/20 border border-gold/50 px-4 py-2 font-medium text-gold hover:bg-gold/30 transition"
                >
                  Fermer
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
