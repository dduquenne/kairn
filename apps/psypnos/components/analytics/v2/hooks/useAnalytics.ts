'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { useSimulation } from '../context/SimulationContext';
import type { PeriodType } from '../PeriodSelector';
import {
  formatChartDataForPeriod,
  getBucketKey,
  getPeriodDateRange,
  type Visit,
} from '../utils/chartDateUtils';

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
  type: 'destination' | 'event' | 'duration' | 'pages';
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
  countryCode?: string;
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
  type: 'search_engine' | 'social' | 'seo_tool' | 'monitoring' | 'other';
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
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  metric?: string;
  value?: string;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// Blog Panel Types
interface BlogArticleStats {
  slug: string;
  title?: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number | null;
  avgScrollDepth: number | null;
  score: number;
  lastViewed: string | null;
}

interface BlogCTAStats {
  appointment: number;
  seminar: number;
  total: number;
}

interface BlogFAQStats {
  totalOpens: number;
  topQuestions: Array<{
    question: string;
    articleSlug: string;
    opens: number;
  }>;
}

interface BlogPanelData {
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

// Posts Panel Types (Social Media)
interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok';
  type: 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'text';
  content: string;
  publishedAt: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  engagementRate: number;
}

interface PlatformStats {
  platform: string;
  icon: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok';
  followers: number;
  followersChange: number;
  posts: number;
  reach: number;
  engagement: number;
  engagementRate: number;
  color: string;
}

interface PostTypeStats {
  type: string;
  count: number;
  avgEngagement: number;
  percentage: number;
}

interface EngagementTrend {
  label: string;
  reach: number;
  engagement: number;
  posts: number;
}

interface BestPostingTime {
  day: string;
  hour: number;
  engagement: number;
}

interface PostsPanelData {
  totalPosts: number;
  postsChange: number;
  totalReach: number;
  reachChange: number;
  totalEngagement: number;
  engagementChange: number;
  avgEngagementRate: number;
  engagementRateChange: number;
  totalFollowers: number;
  followersChange: number;
  platforms: PlatformStats[];
  topPosts: SocialPost[];
  postTypes: PostTypeStats[];
  engagementTrends: EngagementTrend[];
  bestPostingTimes: BestPostingTime[];
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
  geoCountries: GeoLocation[];
  geoCities: GeoLocation[];
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

  // Blog Panel
  blogData: BlogPanelData | null;

  // Posts Panel (Social Media)
  postsData: PostsPanelData | null;
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
  fetchInsights: () => Promise<void>;
  isLoadingInsights: boolean;
}

// Map PeriodType to API timeRange
const mapPeriodToTimeRange = (period: PeriodType): string => {
  switch (period) {
    case 'realtime':
    case 'today':
      return 'hour';
    case 'yesterday':
    case 'last7days':
      return 'day';
    case 'last30days':
    case 'thisMonth':
    case 'lastMonth':
      return 'day';
    case 'last3months':
      return 'week';
    case 'thisYear':
      return 'month';
    case 'custom':
      return 'day';
    default:
      return 'day';
  }
};

// Get date range for period - uses the centralized utility for consistency
const getDateRange = (
  period: PeriodType,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } => {
  const { startDate, endDate } = getPeriodDateRange(period, customStart, customEnd);
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
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

// Format chart data from API response using the shared utility
const formatChartData = (
  visits: any[],
  period: PeriodType,
  customStartDate?: string,
  customEndDate?: string
): ChartDataPoint[] => {
  // Use the shared utility for ALL periods (including custom)
  // The utility now properly handles custom periods with adaptive formatting
  const buckets = formatChartDataForPeriod(
    visits as Visit[],
    period,
    15, // maxDisplayPoints
    customStartDate,
    customEndDate
  );

  // Convert ChartBucket to ChartDataPoint
  return buckets.map(bucket => ({
    label: bucket.label,
    value: bucket.value,
    ...(bucket.previousValue !== undefined ? { previousValue: bucket.previousValue } : {}),
  }));
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
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mode simulation - use refs to avoid recreating fetchData on every toggle
  let simulationContext: ReturnType<typeof useSimulation> | null = null;
  try {
    simulationContext = useSimulation();
  } catch {
    // Context not available, simulation mode disabled
  }

  const isSimulationMode = simulationContext?.isSimulationMode ?? false;
  const generateSimulatedData = simulationContext?.generateSimulatedData;

  // Store simulation values in refs so fetchData doesn't depend on them directly
  const isSimulationModeRef = useRef(isSimulationMode);
  const generateSimulatedDataRef = useRef(generateSimulatedData);
  isSimulationModeRef.current = isSimulationMode;
  generateSimulatedDataRef.current = generateSimulatedData;

  const fetchData = useCallback(async () => {
    // Mode simulation: utiliser les données générées côté client
    if (isSimulationModeRef.current && generateSimulatedDataRef.current) {
      const simulatedData = generateSimulatedDataRef.current(period, customStartDate, customEndDate);
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

      // Single consolidated API call — replaces 9 separate HTTP requests.
      // Geo, goals, alerts, blog analytics, CTA clicks, FAQ clicks are all
      // included in the dashboard response. Only bots (requires admin auth)
      // is fetched separately.
      const [dashboardRes, botsRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?${params}`, { cache: 'no-store' }),
        fetch(`/api/analytics/bots?${params}`).catch(() => null),
      ]);

      if (!dashboardRes.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const dashboardData = await dashboardRes.json();

      // Extract consolidated data from the single response
      const geoData = dashboardData.geoData || { byCountry: [], byCity: [] };
      const goalsData = dashboardData.goalsData || { goals: [] };
      const alertsData = dashboardData.alertsData || { alerts: [] };
      const blogAnalyticsData = dashboardData.blogData || {
        articles: [],
        totalViews: 0,
        totalUniqueVisitors: 0,
      };
      const blogCtaData = dashboardData.blogCtaData || { summary: { appointment: 0, seminar: 0 } };
      const blogFaqData = dashboardData.blogFaqData || { summary: {}, clicks: [] };

      const botsData =
        botsRes && botsRes.ok ? await botsRes.json() : { bots: [], timeline: [], pages: [] };

      // Insights are NOT loaded here — they are lazy-loaded on demand
      // via fetchInsights() to avoid the 3-15s Claude API call latency
      const insightsData = { insights: [] };

      // Calculate derived values
      const healthScore = calculateHealthScore(dashboardData);
      const chartData = formatChartData(
        dashboardData.visits || [],
        period,
        customStartDate,
        customEndDate
      );

      // Calculate traffic source totals
      const trafficSources = dashboardData.trafficSources || [];
      let directTraffic = 0;
      let organicTraffic = 0;
      let referralTraffic = 0;
      let socialTraffic = 0;

      trafficSources.forEach((source: any) => {
        const medium = source.medium?.toLowerCase() || '';
        if (medium === 'direct' || medium === '(none)') {
          directTraffic += source.visits || 0;
        } else if (medium === 'organic') {
          organicTraffic += source.visits || 0;
        } else if (medium === 'referral') {
          referralTraffic += source.visits || 0;
        } else if (medium === 'social') {
          socialTraffic += source.visits || 0;
        }
      });

      // Build top pages from section data
      const topSections = dashboardData.summary?.topSections || [];
      const totalSectionVisits = topSections.reduce(
        (sum: number, s: any) => sum + (s.visits || 0),
        0
      );
      const topPages: TopPage[] = topSections.map((section: any) => ({
        path: section.section || 'Unknown',
        views: section.visits || 0,
        uniqueVisitors: section.uniqueSessions ?? section.visitors ?? section.visits ?? 0,
        percentage: totalSectionVisits > 0 ? ((section.visits || 0) / totalSectionVisits) * 100 : 0,
      }));

      // Build section engagement data
      const heatmapData = dashboardData.heatmap || [];
      const sectionEngagement: SectionEngagement[] = heatmapData.map(
        (section: any, index: number) => ({
          section: section.section || 'Unknown',
          avgTime: section.avgTimeSeconds || 0,
          scrollDepth: section.scrollRate || 0,
          interactions: section.visitors || 0,
          bounceRate: section.bounceRate ?? 0,
        })
      );

      // Build device breakdown
      const deviceData = dashboardData.deviceBreakdown || [];
      const totalDeviceVisits = deviceData.reduce(
        (sum: number, d: any) => sum + (d.visits || 0),
        0
      );
      const deviceBreakdown: DeviceBreakdown[] = deviceData.map((device: any) => ({
        device: device.deviceType || 'Unknown',
        sessions: device.visits || 0,
        avgDuration: (device.avgTimeOnSite || 0) / 1000,
        percentage: totalDeviceVisits > 0 ? ((device.visits || 0) / totalDeviceVisits) * 100 : 0,
      }));

      // Build conversion data
      const conversionByType = dashboardData.summary?.conversionByType || {};
      const conversionTypes: ConversionType[] = Object.entries(conversionByType).map(
        ([key, value]: [string, any]) => ({
          id: key,
          name:
            key === 'appointment_request'
              ? 'Prise de RDV'
              : key === 'seminar_registration'
                ? 'Inscription séminaire'
                : key === 'contact_form'
                  ? 'Formulaire contact'
                  : key,
          clicks: value.clicks || 0,
          completed: value.completed || 0,
          rate: value.rate || 0,
        })
      );

      // Build funnel steps from real funnel data if available
      const rawFunnelSteps = dashboardData.summary?.funnelSteps || [];
      const totalVisits = dashboardData.summary?.totalVisits || 0;
      let funnelSteps: FunnelStep[];

      if (rawFunnelSteps.length > 0) {
        funnelSteps = rawFunnelSteps.map((step: any, i: number) => {
          const percentage = totalVisits > 0 ? (step.visitors / totalVisits) * 100 : 0;
          const prevPercentage =
            i > 0 && totalVisits > 0 ? (rawFunnelSteps[i - 1].visitors / totalVisits) * 100 : 100;
          return {
            name: step.name || step.stepName || `Étape ${i + 1}`,
            visitors: step.visitors || step.count || 0,
            percentage: Math.round(percentage * 10) / 10,
            dropoff: Math.round((prevPercentage - percentage) * 10) / 10,
          };
        });
      } else {
        // Fallback: derive from totalVisits and conversionRate
        const convRate = dashboardData.summary?.conversionRate || 0;
        const converted = Math.round((totalVisits * convRate) / 100);
        funnelSteps = [
          { name: 'Visite', visitors: totalVisits, percentage: 100, dropoff: 0 },
          {
            name: 'Conversion',
            visitors: converted,
            percentage: convRate,
            dropoff: 100 - convRate,
          },
        ];
      }

      // Build goals from API
      const goals: Goal[] = (goalsData.goals || []).map((goal: any) => ({
        id: goal.id || String(Math.random()),
        name: goal.name || 'Objectif',
        type: goal.type || 'event',
        current: goal.completions || 0,
        target: goal.target || 100,
        progress: goal.target > 0 ? (goal.completions / goal.target) * 100 : 0,
      }));

      // Build geo data - combine countries and cities
      const totalGeoVisitors = (geoData.byCountry || []).reduce(
        (sum: number, c: any) => sum + (c.visitors || 0),
        0
      );

      // Countries data
      const geoCountries: GeoLocation[] = (geoData.byCountry || []).map((c: any) => ({
        country: c.country || 'Unknown',
        countryCode: c.countryCode,
        visitors: c.visitors || 0,
        percentage: totalGeoVisitors > 0 ? ((c.visitors || 0) / totalGeoVisitors) * 100 : 0,
      }));

      // Cities data
      const geoCities: GeoLocation[] = (geoData.byCity || []).map((c: any) => ({
        country: c.country || 'Unknown',
        countryCode: c.countryCode,
        city: c.city,
        region: c.region,
        visitors: c.visitors || 0,
        percentage: totalGeoVisitors > 0 ? ((c.visitors || 0) / totalGeoVisitors) * 100 : 0,
      }));

      // Build bot data
      const botTypes: BotType[] = (botsData.bots || []).map((bot: any) => ({
        name: bot.name || 'Unknown',
        type: bot.type || 'other',
        visits: bot.visits || 0,
        lastSeen: bot.lastSeen || new Date().toISOString(),
        pages: bot.pages || 0,
      }));

      const botTimeline: BotVisit[] = (botsData.timeline || []).map((t: any) => {
        // Format the date for display based on the selected period
        let formattedDate = t.date || '';
        if (t.date) {
          const date = new Date(t.date);
          if (!isNaN(date.getTime())) {
            // Use getBucketKey to format date consistently with the selected period
            // Pass custom dates for proper formatting of custom periods
            formattedDate = getBucketKey(date, period, customStartDate, customEndDate);
          }
        }
        return {
          date: formattedDate,
          visits: t.visits || 0,
        };
      });

      const crawledPages: CrawledPage[] = (botsData.pages || []).map((p: any) => ({
        path: p.path || '',
        crawlCount: p.crawlCount || 0,
        lastCrawled: p.lastCrawled || new Date().toISOString(),
        botTypes: p.botTypes || [],
      }));

      // Build insights
      const insights: Insight[] = (insightsData.insights || []).map((insight: any, i: number) => ({
        id: insight.id || String(i),
        type: insight.type || 'neutral',
        title: insight.title || '',
        description: insight.description || insight.message || '',
        metric: insight.metric,
        value: insight.value,
      }));

      // Build alerts
      const alerts: Alert[] = (alertsData.alerts || []).map((alert: any, i: number) => ({
        id: alert.id || String(i),
        severity: alert.severity || 'info',
        title: alert.title || '',
        message: alert.message || '',
        timestamp: alert.timestamp || new Date().toISOString(),
        isRead: alert.isRead || false,
      }));

      // Build blog panel data
      const blogArticles: BlogArticleStats[] = (blogAnalyticsData.articles || []).map(
        (article: any) => ({
          slug: article.slug || '',
          title: article.title,
          views: article.views || 0,
          uniqueVisitors: article.uniqueVisitors || 0,
          avgTimeOnPage: article.engagement?.avgTimeOnPage ?? null,
          avgScrollDepth: article.engagement?.avgScrollDepth ?? null,
          score: article.score ?? 0,
          lastViewed: article.lastViewed || null,
        })
      );

      // Sort articles by score descending
      blogArticles.sort((a, b) => b.score - a.score);

      // Build FAQ top questions
      const faqSummary = blogFaqData.summary || {};
      const faqClicks = blogFaqData.clicks || [];
      const topQuestions: Array<{ question: string; articleSlug: string; opens: number }> = [];

      Object.entries(faqSummary).forEach(([faqId, data]: [string, any]) => {
        const faqClick = faqClicks.find((c: any) => c.faqId === faqId);
        topQuestions.push({
          question: faqClick?.question || 'Question non disponible',
          articleSlug: faqClick?.articleSlug || faqId.split('-').slice(0, -1).join('-'),
          opens: data.opens || 0,
        });
      });
      topQuestions.sort((a, b) => b.opens - a.opens);

      const blogData: BlogPanelData = {
        articles: blogArticles,
        totalViews: blogAnalyticsData.totalViews || 0,
        totalUniqueVisitors: blogAnalyticsData.totalUniqueVisitors || 0,
        avgViewsPerVisitor:
          blogAnalyticsData.totalUniqueVisitors > 0
            ? blogAnalyticsData.totalViews / blogAnalyticsData.totalUniqueVisitors
            : 0,
        ctaStats: {
          appointment: blogCtaData.summary?.appointment || 0,
          seminar: blogCtaData.summary?.seminar || 0,
          total: (blogCtaData.summary?.appointment || 0) + (blogCtaData.summary?.seminar || 0),
        },
        faqStats: {
          totalOpens: topQuestions.reduce((sum, q) => sum + q.opens, 0),
          topQuestions: topQuestions.slice(0, 10),
        },
        topPerformingArticle: blogArticles.length > 0 ? (blogArticles[0] ?? null) : null,
      };

      // Compose final data object
      const analyticsData: AnalyticsData = {
        healthScore,
        kpis: {
          visitors:
            dashboardData.comparison?.current?.totalVisits ||
            dashboardData.summary?.totalVisits ||
            0,
          visitorsChange: dashboardData.comparison?.comparison?.totalVisitsChange || 0,
          conversionRate:
            dashboardData.comparison?.current?.conversionRate ||
            dashboardData.summary?.conversionRate ||
            0,
          conversionChange: dashboardData.comparison?.comparison?.conversionRateChange || 0,
          avgDuration:
            (dashboardData.comparison?.current?.averageTimeOnSite ||
              dashboardData.summary?.averageTimeOnSite ||
              0) / 1000,
          durationChange:
            ((dashboardData.comparison?.comparison?.averageTimeOnSiteChange || 0) / 100) * 60, // convert % to seconds estimate
        },
        trafficChart: chartData,
        topPages,
        totalViews: dashboardData.summary?.totalVisits || 0,
        totalVisitors: dashboardData.summary?.uniqueSessions || 0,
        newVisitors:
          dashboardData.summary?.newVisitors ?? dashboardData.summary?.uniqueSessions ?? 0,
        avgSessionDuration: (dashboardData.summary?.averageTimeOnSite || 0) / 1000,
        avgPagesPerSession:
          topPages.length > 0
            ? (dashboardData.summary?.totalVisits || 0) /
              (dashboardData.summary?.uniqueSessions || 1)
            : 1,
        bounceRate: dashboardData.summary?.bounceRate ?? 0,
        scrollDepth:
          heatmapData.length > 0
            ? heatmapData.reduce((sum: number, h: any) => sum + (h.scrollRate || 0), 0) /
              heatmapData.length
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
        geoCountries,
        geoCities,
        directTraffic,
        organicTraffic,
        referralTraffic,
        socialTraffic,
        totalBotVisits: botTypes.reduce((sum, b) => sum + b.visits, 0),
        uniqueBots: botTypes.length,
        crawledPages: crawledPages.length,
        avgCrawlRate:
          botTimeline.length > 0
            ? botTimeline.reduce((sum, t) => sum + t.visits, 0) / botTimeline.length
            : 0,
        botVisitsTimeline: botTimeline,
        botTypes,
        topCrawledPages: crawledPages,
        insights,
        alerts,
        blogData,
        postsData: null, // Social media data requires external API integration
      };

      setData(analyticsData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStartDate, customEndDate]);

  // Keep a ref to fetchData so the auto-refresh interval doesn't need to
  // be recreated every time fetchData changes
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  // Trigger re-fetch when simulation mode changes
  useEffect(() => {
    // Skip the initial render (handled by the load effect below)
    if (data === null) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulationMode]);

  // Initial load and subsequent period changes
  useEffect(() => {
    // Only show the full loading skeleton on the very first load.
    // On subsequent fetches (period change, etc.), keep showing the
    // previous data and use isRefreshing for a subtle indicator.
    if (data === null) {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
    } else {
      setIsRefreshing(true);
      fetchData().finally(() => setIsRefreshing(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  // Auto refresh for realtime mode — uses a ref so the interval is stable
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (autoRefresh || period === 'realtime') {
      refreshIntervalRef.current = setInterval(() => {
        fetchDataRef.current();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, period, refreshInterval]);

  // Manual refresh function — uses ref so callback identity is stable
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDataRef.current();
    setIsRefreshing(false);
  }, []);

  // Lazy-load insights (Claude API call — 3-15s latency)
  // Called on demand when the user opens the InsightsDrawer
  const fetchInsights = useCallback(async () => {
    if (isLoadingInsights) return;
    setIsLoadingInsights(true);
    try {
      const timeRange = mapPeriodToTimeRange(period);
      const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate);
      const res = await fetch(
        `/api/analytics/insights?timeRange=${timeRange}&startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) {
        const insightsData = await res.json();
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            insights: (insightsData.insights || []).map((insight: any, i: number) => ({
              id: insight.id || String(i),
              type: insight.type || 'neutral',
              title: insight.title || '',
              description: insight.description || insight.message || '',
              metric: insight.metric,
              value: insight.value,
            })),
          };
        });
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [period, customStartDate, customEndDate, isLoadingInsights]);

  return {
    data,
    isLoading,
    error,
    refresh,
    isRefreshing,
    lastUpdated,
    fetchInsights,
    isLoadingInsights,
  };
}
