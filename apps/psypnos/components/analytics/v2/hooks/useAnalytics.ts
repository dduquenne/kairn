"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PeriodType } from "../PeriodSelector";
import { useSimulation, type SimulatedAnalyticsData } from "../context/SimulationContext";

// Types
interface KPIData {
  visitors: number;
  visitorsChange: number;
  conversionRate: number;
  conversionChange: number;
  avgDuration: number;
  durationChange: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
  percentage: number;
  change?: number;
}

interface SectionEngagement {
  section: string;
  avgTime: number;
  scrollDepth: number;
  interactions: number;
  bounceRate: number;
}

interface DeviceBreakdown {
  device: string;
  sessions: number;
  avgDuration: number;
  percentage: number;
}

interface ConversionType {
  id: string;
  name: string;
  clicks: number;
  completed: number;
  rate: number;
  change?: number;
}

interface FunnelStep {
  name: string;
  visitors: number;
  percentage: number;
  dropoff: number;
}

interface Goal {
  id: string;
  name: string;
  type: "destination" | "event" | "duration" | "pages";
  current: number;
  target: number;
  progress: number;
  deadline?: string;
}

interface TrafficSource {
  source: string;
  medium: string;
  visits: number;
  uniqueSessions: number;
  conversionRate: number;
  change?: number;
}

interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
  visitors: number;
  percentage: number;
}

interface BotVisit {
  date: string;
  visits: number;
}

interface BotType {
  name: string;
  type: "search_engine" | "social" | "seo_tool" | "monitoring" | "other";
  visits: number;
  lastSeen: string;
  pages: number;
}

interface CrawledPage {
  path: string;
  crawlCount: number;
  lastCrawled: string;
  botTypes: string[];
}

interface Insight {
  id: string;
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  description: string;
  metric?: string;
  value?: string;
}

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface AnalyticsData {
  // KPIs
  healthScore: number;
  kpis: KPIData;

  // Traffic Panel
  trafficChart: ChartDataPoint[];
  topPages: TopPage[];
  totalViews: number;
  totalVisitors: number;
  newVisitors: number;

  // Engagement Panel
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  scrollDepth: number;
  sectionEngagement: SectionEngagement[];
  deviceBreakdown: DeviceBreakdown[];

  // Conversions Panel
  totalConversions: number;
  conversionRate: number;
  conversionChange: number;
  conversionTypes: ConversionType[];
  funnelSteps: FunnelStep[];
  goals: Goal[];

  // Sources Panel
  trafficSources: TrafficSource[];
  geoData: GeoLocation[];
  directTraffic: number;
  organicTraffic: number;
  referralTraffic: number;
  socialTraffic: number;

  // SEO Panel
  totalBotVisits: number;
  uniqueBots: number;
  crawledPages: number;
  avgCrawlRate: number;
  botVisitsTimeline: BotVisit[];
  botTypes: BotType[];
  topCrawledPages: CrawledPage[];

  // Insights
  insights: Insight[];
  alerts: Alert[];
}

interface UseAnalyticsOptions {
  period: PeriodType;
  customStartDate?: string;
  customEndDate?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  lastUpdated: Date | null;
}

// Map PeriodType to API timeRange
const mapPeriodToTimeRange = (period: PeriodType): string => {
  switch (period) {
    case "realtime":
    case "today":
      return "hour";
    case "yesterday":
    case "last7days":
      return "day";
    case "last30days":
    case "thisMonth":
    case "lastMonth":
      return "day";
    case "last3months":
      return "week";
    case "thisYear":
      return "month";
    case "custom":
      return "day";
    default:
      return "day";
  }
};

// Get date range for period
const getDateRange = (
  period: PeriodType,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } => {
  const now = new Date();
  const endDate = now.toISOString();

  if (period === "custom" && customStart && customEnd) {
    return {
      startDate: new Date(customStart).toISOString(),
      endDate: new Date(customEnd).toISOString(),
    };
  }

  let startDate: Date;

  switch (period) {
    case "realtime":
      startDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour
      break;
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "yesterday":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case "last7days":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "last30days":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "thisMonth":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "lastMonth":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case "last3months":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "thisYear":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { startDate: startDate.toISOString(), endDate };
};

// Calculate health score
const calculateHealthScore = (data: any): number => {
  let score = 50;

  // Visits trend impact
  const visitsChange = data?.comparison?.comparison?.totalVisitsChange || 0;
  if (visitsChange > 10) score += 15;
  else if (visitsChange > 0) score += 5;
  else if (visitsChange < -10) score -= 15;
  else if (visitsChange < 0) score -= 5;

  // Conversion rate impact
  const conversionRate = data?.comparison?.current?.conversionRate || 0;
  if (conversionRate > 5) score += 20;
  else if (conversionRate > 2) score += 10;
  else if (conversionRate < 1) score -= 10;

  // Session duration impact
  const avgTimeMinutes = (data?.comparison?.current?.averageTimeOnSite || 0) / 60000;
  if (avgTimeMinutes > 3) score += 15;
  else if (avgTimeMinutes < 1) score -= 10;

  return Math.max(0, Math.min(100, score));
};

// Format chart data from API response
const formatChartData = (visits: any[], period: PeriodType): ChartDataPoint[] => {
  if (!visits || visits.length === 0) return [];

  const now = new Date();
  const chartData: ChartDataPoint[] = [];

  if (period === "realtime") {
    // Last 12 intervals of 5 minutes
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMinutes(date.getMinutes() - i * 5);
      date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
      date.setSeconds(0);

      chartData.push({
        label: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        value: 0, // Will be aggregated
      });
    }
  } else if (period === "today" || period === "yesterday") {
    // 24 hours
    for (let i = 23; i >= 0; i--) {
      const date = new Date(now);
      if (period === "yesterday") date.setDate(date.getDate() - 1);
      date.setHours(date.getHours() - i);

      chartData.push({
        label: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        value: 0,
      });
    }
  } else if (period === "last7days") {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      chartData.push({
        label: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        value: 0,
      });
    }
  } else {
    // Default: use raw data
    visits.slice(-14).forEach((v: any) => {
      chartData.push({
        label: v.period || v.timestamp?.split("T")[0] || "",
        value: v.visits || 0,
      });
    });
  }

  return chartData;
};

export function useAnalytics(options: UseAnalyticsOptions): UseAnalyticsReturn {
  const {
    period,
    customStartDate,
    customEndDate,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mode simulation
  let simulationContext: ReturnType<typeof useSimulation> | null = null;
  try {
    simulationContext = useSimulation();
  } catch {
    // Context not available, simulation mode disabled
  }

  const isSimulationMode = simulationContext?.isSimulationMode ?? false;
  const generateSimulatedData = simulationContext?.generateSimulatedData;

  const fetchData = useCallback(async () => {
    // Mode simulation: utiliser les données générées côté client
    if (isSimulationMode && generateSimulatedData) {
      const simulatedData = generateSimulatedData(period);
      setData(simulatedData as AnalyticsData);
      setLastUpdated(new Date());
      setError(null);
      return;
    }
    try {
      const timeRange = mapPeriodToTimeRange(period);
      const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);

      const params = new URLSearchParams({
        timeRange,
        startDate,
        endDate,
      });

      // Fetch main dashboard data
      const dashboardRes = await fetch(`/api/analytics/dashboard?${params}`, {
        cache: "no-store",
      });

      if (!dashboardRes.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const dashboardData = await dashboardRes.json();

      // Fetch additional data in parallel
      const [geoRes, goalsRes, botsRes, alertsRes, insightsRes] = await Promise.allSettled([
        fetch("/api/analytics/geolocation"),
        fetch("/api/analytics/goals"),
        fetch(`/api/analytics/bots?timeRange=${period === "realtime" ? "24h" : "7d"}`),
        fetch("/api/analytics/alerts"),
        fetch(`/api/analytics/insights?timeRange=${timeRange}`),
      ]);

      const geoData = geoRes.status === "fulfilled" && geoRes.value.ok
        ? await geoRes.value.json()
        : { countries: [], cities: [] };

      const goalsData = goalsRes.status === "fulfilled" && goalsRes.value.ok
        ? await goalsRes.value.json()
        : { goals: [] };

      const botsData = botsRes.status === "fulfilled" && botsRes.value.ok
        ? await botsRes.value.json()
        : { bots: [], timeline: [], pages: [] };

      const alertsData = alertsRes.status === "fulfilled" && alertsRes.value.ok
        ? await alertsRes.value.json()
        : { alerts: [] };

      const insightsData = insightsRes.status === "fulfilled" && insightsRes.value.ok
        ? await insightsRes.value.json()
        : { insights: [] };

      // Calculate derived values
      const healthScore = calculateHealthScore(dashboardData);
      const chartData = formatChartData(dashboardData.visits || [], period);

      // Calculate traffic source totals
      const trafficSources = dashboardData.trafficSources || [];
      let directTraffic = 0;
      let organicTraffic = 0;
      let referralTraffic = 0;
      let socialTraffic = 0;

      trafficSources.forEach((source: any) => {
        const medium = source.medium?.toLowerCase() || "";
        if (medium === "direct" || medium === "(none)") {
          directTraffic += source.visits || 0;
        } else if (medium === "organic") {
          organicTraffic += source.visits || 0;
        } else if (medium === "referral") {
          referralTraffic += source.visits || 0;
        } else if (medium === "social") {
          socialTraffic += source.visits || 0;
        }
      });

      // Build top pages from section data
      const topSections = dashboardData.summary?.topSections || [];
      const totalSectionVisits = topSections.reduce((sum: number, s: any) => sum + (s.visits || 0), 0);
      const topPages: TopPage[] = topSections.map((section: any) => ({
        path: section.section || "Unknown",
        views: section.visits || 0,
        uniqueVisitors: Math.round((section.visits || 0) * 0.7), // Estimate
        percentage: totalSectionVisits > 0 ? ((section.visits || 0) / totalSectionVisits) * 100 : 0,
      }));

      // Build section engagement data
      const heatmapData = dashboardData.heatmap || [];
      const sectionEngagement: SectionEngagement[] = heatmapData.map((section: any) => ({
        section: section.section || "Unknown",
        avgTime: section.avgTimeSeconds || 0,
        scrollDepth: section.scrollRate || 0,
        interactions: section.visitors || 0,
        bounceRate: Math.random() * 60 + 20, // Placeholder
      }));

      // Build device breakdown
      const deviceData = dashboardData.deviceBreakdown || [];
      const totalDeviceVisits = deviceData.reduce((sum: number, d: any) => sum + (d.visits || 0), 0);
      const deviceBreakdown: DeviceBreakdown[] = deviceData.map((device: any) => ({
        device: device.deviceType || "Unknown",
        sessions: device.visits || 0,
        avgDuration: (device.avgTimeOnSite || 0) / 1000,
        percentage: totalDeviceVisits > 0 ? ((device.visits || 0) / totalDeviceVisits) * 100 : 0,
      }));

      // Build conversion data
      const conversionByType = dashboardData.summary?.conversionByType || {};
      const conversionTypes: ConversionType[] = Object.entries(conversionByType).map(
        ([key, value]: [string, any]) => ({
          id: key,
          name: key === "appointment_request" ? "Prise de RDV"
            : key === "seminar_registration" ? "Inscription séminaire"
            : key === "contact_form" ? "Formulaire contact"
            : key,
          clicks: value.clicks || 0,
          completed: value.completed || 0,
          rate: value.rate || 0,
        })
      );

      // Build funnel steps (placeholder - needs real funnel data)
      const funnelSteps: FunnelStep[] = [
        { name: "Visite", visitors: dashboardData.summary?.totalVisits || 0, percentage: 100, dropoff: 0 },
        { name: "Engagement", visitors: Math.round((dashboardData.summary?.totalVisits || 0) * 0.6), percentage: 60, dropoff: 40 },
        { name: "Intérêt", visitors: Math.round((dashboardData.summary?.totalVisits || 0) * 0.3), percentage: 30, dropoff: 30 },
        { name: "Conversion", visitors: Math.round((dashboardData.summary?.totalVisits || 0) * (dashboardData.summary?.conversionRate || 0) / 100), percentage: dashboardData.summary?.conversionRate || 0, dropoff: 30 - (dashboardData.summary?.conversionRate || 0) },
      ];

      // Build goals from API
      const goals: Goal[] = (goalsData.goals || []).map((goal: any) => ({
        id: goal.id || String(Math.random()),
        name: goal.name || "Objectif",
        type: goal.type || "event",
        current: goal.completions || 0,
        target: goal.target || 100,
        progress: goal.target > 0 ? (goal.completions / goal.target) * 100 : 0,
      }));

      // Build geo data
      const geoLocations: GeoLocation[] = (geoData.countries || []).map((c: any) => ({
        country: c.country || "Unknown",
        visitors: c.visitors || 0,
        percentage: c.percentage || 0,
      }));

      // Build bot data
      const botTypes: BotType[] = (botsData.bots || []).map((bot: any) => ({
        name: bot.name || "Unknown",
        type: bot.type || "other",
        visits: bot.visits || 0,
        lastSeen: bot.lastSeen || new Date().toISOString(),
        pages: bot.pages || 0,
      }));

      const botTimeline: BotVisit[] = (botsData.timeline || []).map((t: any) => ({
        date: t.date || "",
        visits: t.visits || 0,
      }));

      const crawledPages: CrawledPage[] = (botsData.pages || []).map((p: any) => ({
        path: p.path || "",
        crawlCount: p.crawlCount || 0,
        lastCrawled: p.lastCrawled || new Date().toISOString(),
        botTypes: p.botTypes || [],
      }));

      // Build insights
      const insights: Insight[] = (insightsData.insights || []).map((insight: any, i: number) => ({
        id: insight.id || String(i),
        type: insight.type || "neutral",
        title: insight.title || "",
        description: insight.description || insight.message || "",
        metric: insight.metric,
        value: insight.value,
      }));

      // Build alerts
      const alerts: Alert[] = (alertsData.alerts || []).map((alert: any, i: number) => ({
        id: alert.id || String(i),
        severity: alert.severity || "info",
        title: alert.title || "",
        message: alert.message || "",
        timestamp: alert.timestamp || new Date().toISOString(),
        isRead: alert.isRead || false,
      }));

      // Compose final data object
      const analyticsData: AnalyticsData = {
        healthScore,
        kpis: {
          visitors: dashboardData.comparison?.current?.totalVisits || dashboardData.summary?.totalVisits || 0,
          visitorsChange: dashboardData.comparison?.comparison?.totalVisitsChange || 0,
          conversionRate: dashboardData.comparison?.current?.conversionRate || dashboardData.summary?.conversionRate || 0,
          conversionChange: dashboardData.comparison?.comparison?.conversionRateChange || 0,
          avgDuration: (dashboardData.comparison?.current?.averageTimeOnSite || dashboardData.summary?.averageTimeOnSite || 0) / 1000,
          durationChange: ((dashboardData.comparison?.comparison?.averageTimeOnSiteChange || 0) / 100) * 60, // convert % to seconds estimate
        },
        trafficChart: chartData,
        topPages,
        totalViews: dashboardData.summary?.totalVisits || 0,
        totalVisitors: dashboardData.summary?.uniqueSessions || 0,
        newVisitors: Math.round((dashboardData.summary?.uniqueSessions || 0) * 0.4), // Estimate
        avgSessionDuration: (dashboardData.summary?.averageTimeOnSite || 0) / 1000,
        avgPagesPerSession: topPages.length > 0 ? (dashboardData.summary?.totalVisits || 0) / (dashboardData.summary?.uniqueSessions || 1) : 1,
        bounceRate: 45, // Placeholder
        scrollDepth: heatmapData.length > 0
          ? heatmapData.reduce((sum: number, h: any) => sum + (h.scrollRate || 0), 0) / heatmapData.length
          : 0,
        sectionEngagement,
        deviceBreakdown,
        totalConversions: conversionTypes.reduce((sum, c) => sum + c.completed, 0),
        conversionRate: dashboardData.summary?.conversionRate || 0,
        conversionChange: dashboardData.comparison?.comparison?.conversionRateChange || 0,
        conversionTypes,
        funnelSteps,
        goals,
        trafficSources,
        geoData: geoLocations,
        directTraffic,
        organicTraffic,
        referralTraffic,
        socialTraffic,
        totalBotVisits: botTypes.reduce((sum, b) => sum + b.visits, 0),
        uniqueBots: botTypes.length,
        crawledPages: crawledPages.length,
        avgCrawlRate: botTimeline.length > 0
          ? botTimeline.reduce((sum, t) => sum + t.visits, 0) / botTimeline.length
          : 0,
        botVisitsTimeline: botTimeline,
        botTypes,
        topCrawledPages: crawledPages,
        insights,
        alerts,
      };

      setData(analyticsData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }, [period, customStartDate, customEndDate, isSimulationMode, generateSimulatedData]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [fetchData]);

  // Auto refresh for realtime mode
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (autoRefresh || period === "realtime") {
      refreshIntervalRef.current = setInterval(() => {
        fetchData();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, period, refreshInterval, fetchData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    isRefreshing,
    lastUpdated,
  };
}
