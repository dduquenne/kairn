'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import type { PeriodType } from '../PeriodSelector';

// Types pour les données simulées
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

// Posts Panel Types
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

export interface SimulatedAnalyticsData {
  healthScore: number;
  kpis: KPIData;
  trafficChart: ChartDataPoint[];
  topPages: TopPage[];
  totalViews: number;
  totalVisitors: number;
  newVisitors: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  scrollDepth: number;
  sectionEngagement: SectionEngagement[];
  deviceBreakdown: DeviceBreakdown[];
  totalConversions: number;
  conversionRate: number;
  conversionChange: number;
  conversionTypes: ConversionType[];
  funnelSteps: FunnelStep[];
  goals: Goal[];
  trafficSources: TrafficSource[];
  geoCountries: GeoLocation[];
  geoCities: GeoLocation[];
  directTraffic: number;
  organicTraffic: number;
  referralTraffic: number;
  socialTraffic: number;
  totalBotVisits: number;
  uniqueBots: number;
  crawledPages: number;
  avgCrawlRate: number;
  botVisitsTimeline: BotVisit[];
  botTypes: BotType[];
  topCrawledPages: CrawledPage[];
  insights: Insight[];
  alerts: Alert[];
  blogData: BlogPanelData | null;
  postsData: PostsPanelData | null;
}

interface SimulationContextType {
  isSimulationMode: boolean;
  toggleSimulationMode: () => void;
  setSimulationMode: (value: boolean) => void;
  generateSimulatedData: (period: PeriodType) => SimulatedAnalyticsData;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Utilitaire pour générer un nombre aléatoire dans une plage
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to format time in HH:mm format (consistent with useAnalytics)
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper to format short weekday and day (consistent with useAnalytics)
const formatShortDate = (date: Date): string => {
  const weekdays = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${weekday} ${day}`;
};

// Helper to format day and month (consistent with useAnalytics)
const formatDayMonth = (date: Date): string => {
  const months = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} ${month}`;
};

// Helper to format week number (consistent with useAnalytics)
const formatWeek = (date: Date): string => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `Sem. ${weekNumber}`;
};

// Helper to format month name (consistent with useAnalytics)
const formatMonth = (date: Date): string => {
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return months[date.getMonth()];
};

// Utilitaire pour générer un nombre avec variation
function randomWithVariation(base: number, variationPercent: number = 20): number {
  const variation = (Math.random() - 0.5) * 2 * ((base * variationPercent) / 100);
  return Math.max(0, Math.round(base + variation));
}

// Générateur de données simulées
function generateSimulatedData(period: PeriodType): SimulatedAnalyticsData {
  const now = new Date();

  // Générer les données de graphique selon la période
  const chartData: ChartDataPoint[] = [];
  let dataPoints = 7;

  switch (period) {
    case 'realtime':
      dataPoints = 12; // 12 intervalles de 5 minutes
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(now.getTime() - (dataPoints - 1 - i) * 5 * 60 * 1000);
        chartData.push({
          label: formatTime(date),
          value: randomInRange(5, 25),
          previousValue: randomInRange(3, 20),
        });
      }
      break;
    case 'today':
    case 'yesterday':
      dataPoints = 24;
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(now);
        if (period === 'yesterday') date.setDate(date.getDate() - 1);
        date.setHours(i, 0, 0, 0);
        chartData.push({
          label: formatTime(date),
          value: randomInRange(10, 80),
          previousValue: randomInRange(8, 70),
        });
      }
      break;
    case 'last7days':
      dataPoints = 7;
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(now.getTime() - (dataPoints - 1 - i) * 24 * 60 * 60 * 1000);
        chartData.push({
          label: formatShortDate(date),
          value: randomInRange(80, 200),
          previousValue: randomInRange(70, 180),
        });
      }
      break;
    case 'last30days':
    case 'thisMonth':
    case 'lastMonth':
      dataPoints = 15; // Show 15 points for readability
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(now.getTime() - (dataPoints - 1 - i) * 2 * 24 * 60 * 60 * 1000);
        chartData.push({
          label: formatDayMonth(date),
          value: randomInRange(80, 250),
          previousValue: randomInRange(70, 220),
        });
      }
      break;
    case 'last3months':
      dataPoints = 13; // ~13 weeks in 3 months
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(now.getTime() - (dataPoints - 1 - i) * 7 * 24 * 60 * 60 * 1000);
        chartData.push({
          label: formatWeek(date),
          value: randomInRange(400, 800),
          previousValue: randomInRange(350, 750),
        });
      }
      break;
    case 'thisYear':
      dataPoints = now.getMonth() + 1; // Months from January to current
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        chartData.push({
          label: formatMonth(date),
          value: randomInRange(1500, 4000),
          previousValue: randomInRange(1300, 3500),
        });
      }
      break;
    default:
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        chartData.push({
          label: formatShortDate(date),
          value: randomInRange(80, 200),
          previousValue: randomInRange(70, 180),
        });
      }
  }

  // Top pages simulées
  const topPages: TopPage[] = [
    {
      path: 'Accueil',
      views: randomInRange(300, 500),
      uniqueVisitors: randomInRange(200, 400),
      percentage: 0,
      change: randomInRange(-10, 25),
    },
    {
      path: 'Services - Psychothérapie',
      views: randomInRange(150, 300),
      uniqueVisitors: randomInRange(100, 250),
      percentage: 0,
      change: randomInRange(-5, 20),
    },
    {
      path: 'À propos',
      views: randomInRange(100, 200),
      uniqueVisitors: randomInRange(80, 180),
      percentage: 0,
      change: randomInRange(-15, 15),
    },
    {
      path: 'Contact',
      views: randomInRange(80, 180),
      uniqueVisitors: randomInRange(60, 150),
      percentage: 0,
      change: randomInRange(-8, 30),
    },
    {
      path: 'Blog',
      views: randomInRange(60, 150),
      uniqueVisitors: randomInRange(50, 130),
      percentage: 0,
      change: randomInRange(-10, 20),
    },
    {
      path: 'Séminaires',
      views: randomInRange(40, 120),
      uniqueVisitors: randomInRange(35, 100),
      percentage: 0,
      change: randomInRange(-5, 35),
    },
    {
      path: 'Services - Hypnose',
      views: randomInRange(30, 100),
      uniqueVisitors: randomInRange(25, 90),
      percentage: 0,
      change: randomInRange(-12, 18),
    },
    {
      path: 'FAQ',
      views: randomInRange(20, 80),
      uniqueVisitors: randomInRange(18, 70),
      percentage: 0,
      change: randomInRange(-10, 15),
    },
  ];

  const totalPageViews = topPages.reduce((sum, p) => sum + p.views, 0);
  topPages.forEach(page => {
    page.percentage = (page.views / totalPageViews) * 100;
  });

  // Section engagement
  const sectionEngagement: SectionEngagement[] = [
    {
      section: 'Accueil',
      avgTime: randomInRange(45, 120),
      scrollDepth: randomInRange(60, 95),
      interactions: randomInRange(50, 150),
      bounceRate: randomInRange(25, 45),
    },
    {
      section: 'Services',
      avgTime: randomInRange(90, 180),
      scrollDepth: randomInRange(70, 98),
      interactions: randomInRange(80, 200),
      bounceRate: randomInRange(20, 35),
    },
    {
      section: 'À propos',
      avgTime: randomInRange(60, 150),
      scrollDepth: randomInRange(65, 90),
      interactions: randomInRange(30, 100),
      bounceRate: randomInRange(30, 50),
    },
    {
      section: 'Contact',
      avgTime: randomInRange(30, 90),
      scrollDepth: randomInRange(50, 85),
      interactions: randomInRange(100, 250),
      bounceRate: randomInRange(15, 30),
    },
    {
      section: 'Blog',
      avgTime: randomInRange(120, 300),
      scrollDepth: randomInRange(75, 95),
      interactions: randomInRange(40, 120),
      bounceRate: randomInRange(35, 55),
    },
  ];

  // Device breakdown
  const deviceBreakdown: DeviceBreakdown[] = [
    {
      device: 'Desktop',
      sessions: randomInRange(400, 600),
      avgDuration: randomInRange(180, 300),
      percentage: 0,
    },
    {
      device: 'Mobile',
      sessions: randomInRange(300, 500),
      avgDuration: randomInRange(90, 180),
      percentage: 0,
    },
    {
      device: 'Tablet',
      sessions: randomInRange(50, 150),
      avgDuration: randomInRange(120, 240),
      percentage: 0,
    },
  ];

  const totalDeviceSessions = deviceBreakdown.reduce((sum, d) => sum + d.sessions, 0);
  deviceBreakdown.forEach(device => {
    device.percentage = (device.sessions / totalDeviceSessions) * 100;
  });

  // Conversion types
  const conversionTypes: ConversionType[] = [
    {
      id: 'appointment_request',
      name: 'Prise de RDV',
      clicks: randomInRange(80, 150),
      completed: randomInRange(15, 40),
      rate: 0,
      change: randomInRange(-10, 25),
    },
    {
      id: 'seminar_registration',
      name: 'Inscription séminaire',
      clicks: randomInRange(40, 100),
      completed: randomInRange(8, 25),
      rate: 0,
      change: randomInRange(-5, 30),
    },
    {
      id: 'contact_form',
      name: 'Formulaire contact',
      clicks: randomInRange(60, 120),
      completed: randomInRange(20, 50),
      rate: 0,
      change: randomInRange(-15, 20),
    },
  ];

  conversionTypes.forEach(ct => {
    ct.rate = ct.clicks > 0 ? (ct.completed / ct.clicks) * 100 : 0;
  });

  const totalConversions = conversionTypes.reduce((sum, ct) => sum + ct.completed, 0);
  const totalVisitors = randomInRange(800, 1500);
  const conversionRate = (totalConversions / totalVisitors) * 100;

  // Funnel steps
  const funnelSteps: FunnelStep[] = [
    { name: 'Visite', visitors: totalVisitors, percentage: 100, dropoff: 0 },
    { name: 'Engagement', visitors: Math.round(totalVisitors * 0.65), percentage: 65, dropoff: 35 },
    { name: 'Intérêt', visitors: Math.round(totalVisitors * 0.35), percentage: 35, dropoff: 30 },
    {
      name: 'Conversion',
      visitors: totalConversions,
      percentage: conversionRate,
      dropoff: 35 - conversionRate,
    },
  ];

  // Goals
  const goals: Goal[] = [
    {
      id: '1',
      name: '100 RDV/mois',
      type: 'event',
      current: conversionTypes[0]?.completed ?? 0,
      target: 100,
      progress: ((conversionTypes[0]?.completed ?? 0) / 100) * 100,
    },
    {
      id: '2',
      name: '50 inscriptions séminaire',
      type: 'event',
      current: conversionTypes[1]?.completed ?? 0,
      target: 50,
      progress: ((conversionTypes[1]?.completed ?? 0) / 50) * 100,
    },
    {
      id: '3',
      name: '2000 visiteurs',
      type: 'pages',
      current: totalVisitors,
      target: 2000,
      progress: (totalVisitors / 2000) * 100,
    },
    {
      id: '4',
      name: 'Durée moyenne 3min',
      type: 'duration',
      current: randomInRange(150, 210),
      target: 180,
      progress: randomInRange(80, 120),
    },
  ];

  // Traffic sources
  const trafficSources: TrafficSource[] = [
    {
      source: 'google',
      medium: 'organic',
      visits: randomInRange(300, 500),
      uniqueSessions: randomInRange(250, 450),
      conversionRate: randomInRange(2, 5),
      change: randomInRange(-5, 15),
    },
    {
      source: 'direct',
      medium: '(none)',
      visits: randomInRange(200, 400),
      uniqueSessions: randomInRange(180, 380),
      conversionRate: randomInRange(3, 6),
      change: randomInRange(-10, 20),
    },
    {
      source: 'facebook',
      medium: 'social',
      visits: randomInRange(80, 180),
      uniqueSessions: randomInRange(70, 160),
      conversionRate: randomInRange(1, 4),
      change: randomInRange(-15, 25),
    },
    {
      source: 'instagram',
      medium: 'social',
      visits: randomInRange(50, 120),
      uniqueSessions: randomInRange(45, 110),
      conversionRate: randomInRange(1, 3),
      change: randomInRange(-10, 30),
    },
    {
      source: 'linkedin',
      medium: 'social',
      visits: randomInRange(30, 80),
      uniqueSessions: randomInRange(25, 75),
      conversionRate: randomInRange(2, 5),
      change: randomInRange(-5, 20),
    },
    {
      source: 'psychologies.com',
      medium: 'referral',
      visits: randomInRange(20, 60),
      uniqueSessions: randomInRange(18, 55),
      conversionRate: randomInRange(3, 7),
      change: randomInRange(-8, 15),
    },
  ];

  // Calculate traffic by type
  let directTraffic = 0,
    organicTraffic = 0,
    referralTraffic = 0,
    socialTraffic = 0;
  trafficSources.forEach(source => {
    if (source.medium === '(none)' || source.medium === 'direct') directTraffic += source.visits;
    else if (source.medium === 'organic') organicTraffic += source.visits;
    else if (source.medium === 'referral') referralTraffic += source.visits;
    else if (source.medium === 'social') socialTraffic += source.visits;
  });

  // Geo data - Countries
  const geoCountries: GeoLocation[] = [
    { country: 'France', countryCode: 'FR', visitors: randomInRange(600, 1000), percentage: 0 },
    { country: 'Belgique', countryCode: 'BE', visitors: randomInRange(50, 150), percentage: 0 },
    { country: 'Suisse', countryCode: 'CH', visitors: randomInRange(40, 120), percentage: 0 },
    { country: 'Canada', countryCode: 'CA', visitors: randomInRange(30, 100), percentage: 0 },
    { country: 'Luxembourg', countryCode: 'LU', visitors: randomInRange(10, 40), percentage: 0 },
  ];

  const totalGeoVisitors = geoCountries.reduce((sum, g) => sum + g.visitors, 0);
  geoCountries.forEach(geo => {
    geo.percentage = (geo.visitors / totalGeoVisitors) * 100;
  });

  // Geo data - Cities
  const geoCities: GeoLocation[] = [
    {
      country: 'France',
      countryCode: 'FR',
      city: 'Paris',
      visitors: randomInRange(200, 400),
      percentage: 0,
    },
    {
      country: 'France',
      countryCode: 'FR',
      city: 'Lyon',
      visitors: randomInRange(100, 200),
      percentage: 0,
    },
    {
      country: 'France',
      countryCode: 'FR',
      city: 'Marseille',
      visitors: randomInRange(80, 150),
      percentage: 0,
    },
    {
      country: 'Belgique',
      countryCode: 'BE',
      city: 'Bruxelles',
      visitors: randomInRange(30, 80),
      percentage: 0,
    },
    {
      country: 'Suisse',
      countryCode: 'CH',
      city: 'Genève',
      visitors: randomInRange(20, 60),
      percentage: 0,
    },
    {
      country: 'Canada',
      countryCode: 'CA',
      city: 'Montréal',
      visitors: randomInRange(15, 50),
      percentage: 0,
    },
  ];

  geoCities.forEach(geo => {
    geo.percentage = (geo.visitors / totalGeoVisitors) * 100;
  });

  // Bot data
  const botTypes: BotType[] = [
    {
      name: 'Googlebot',
      type: 'search_engine',
      visits: randomInRange(100, 300),
      lastSeen: now.toISOString(),
      pages: randomInRange(50, 150),
    },
    {
      name: 'Bingbot',
      type: 'search_engine',
      visits: randomInRange(30, 100),
      lastSeen: now.toISOString(),
      pages: randomInRange(20, 80),
    },
    {
      name: 'Facebookbot',
      type: 'social',
      visits: randomInRange(20, 60),
      lastSeen: now.toISOString(),
      pages: randomInRange(10, 40),
    },
    {
      name: 'Semrush',
      type: 'seo_tool',
      visits: randomInRange(10, 40),
      lastSeen: now.toISOString(),
      pages: randomInRange(30, 100),
    },
    {
      name: 'Ahrefs',
      type: 'seo_tool',
      visits: randomInRange(10, 30),
      lastSeen: now.toISOString(),
      pages: randomInRange(20, 60),
    },
  ];

  const botVisitsTimeline: BotVisit[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    botVisitsTimeline.push({
      date: formatDayMonth(date),
      visits: randomInRange(20, 80),
    });
  }

  const topCrawledPages: CrawledPage[] = [
    {
      path: '/',
      crawlCount: randomInRange(50, 150),
      lastCrawled: now.toISOString(),
      botTypes: ['Googlebot', 'Bingbot'],
    },
    {
      path: '/services',
      crawlCount: randomInRange(30, 100),
      lastCrawled: now.toISOString(),
      botTypes: ['Googlebot'],
    },
    {
      path: '/blog',
      crawlCount: randomInRange(40, 120),
      lastCrawled: now.toISOString(),
      botTypes: ['Googlebot', 'Bingbot', 'Semrush'],
    },
    {
      path: '/contact',
      crawlCount: randomInRange(20, 60),
      lastCrawled: now.toISOString(),
      botTypes: ['Googlebot'],
    },
  ];

  // Insights
  const insights: Insight[] = [
    {
      id: '1',
      type: 'positive',
      title: 'Trafic en hausse',
      description: 'Le trafic organique a augmenté de 15% cette semaine',
      metric: 'organic',
      value: '+15%',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Taux de rebond élevé',
      description: 'La page Contact a un taux de rebond de 65%',
      metric: 'bounce',
      value: '65%',
    },
    {
      id: '3',
      type: 'positive',
      title: 'Conversions en hausse',
      description: 'Les demandes de RDV ont augmenté de 20%',
      metric: 'conversions',
      value: '+20%',
    },
    {
      id: '4',
      type: 'neutral',
      title: 'Nouveau pic de trafic',
      description: 'Mercredi à 14h est le moment le plus actif',
      metric: 'traffic',
      value: 'Mer 14h',
    },
  ];

  // Alerts
  const alerts: Alert[] = [
    {
      id: '1',
      severity: 'warning',
      title: 'Baisse du trafic mobile',
      message: 'Le trafic mobile a diminué de 12% cette semaine',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: '2',
      severity: 'info',
      title: 'Nouveau record',
      message: 'Record de visites atteint hier avec 250 visiteurs',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: '3',
      severity: 'critical',
      title: 'Erreur 500 détectée',
      message: '5 erreurs 500 détectées sur /api/contact',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      isRead: false,
    },
  ];

  // Blog Data
  const blogArticles: BlogArticleStats[] = [
    {
      slug: 'comprendre-anxiete-sociale',
      title: "Comprendre l'anxiété sociale",
      views: randomInRange(150, 350),
      uniqueVisitors: randomInRange(100, 280),
      avgTimeOnPage: randomInRange(120000, 300000),
      avgScrollDepth: randomInRange(65, 95),
      score: 0,
      lastViewed: new Date(now.getTime() - randomInRange(1, 24) * 60 * 60 * 1000).toISOString(),
    },
    {
      slug: 'bienfaits-meditation',
      title: 'Les bienfaits de la méditation',
      views: randomInRange(120, 280),
      uniqueVisitors: randomInRange(90, 220),
      avgTimeOnPage: randomInRange(100000, 250000),
      avgScrollDepth: randomInRange(60, 90),
      score: 0,
      lastViewed: new Date(now.getTime() - randomInRange(1, 48) * 60 * 60 * 1000).toISOString(),
    },
    {
      slug: 'gerer-stress-quotidien',
      title: 'Gérer le stress au quotidien',
      views: randomInRange(100, 250),
      uniqueVisitors: randomInRange(80, 200),
      avgTimeOnPage: randomInRange(90000, 220000),
      avgScrollDepth: randomInRange(55, 88),
      score: 0,
      lastViewed: new Date(now.getTime() - randomInRange(2, 72) * 60 * 60 * 1000).toISOString(),
    },
    {
      slug: 'hypnose-therapeutique',
      title: "L'hypnose thérapeutique expliquée",
      views: randomInRange(80, 200),
      uniqueVisitors: randomInRange(60, 160),
      avgTimeOnPage: randomInRange(150000, 350000),
      avgScrollDepth: randomInRange(70, 98),
      score: 0,
      lastViewed: new Date(now.getTime() - randomInRange(1, 36) * 60 * 60 * 1000).toISOString(),
    },
    {
      slug: 'sommeil-reparateur',
      title: 'Retrouver un sommeil réparateur',
      views: randomInRange(70, 180),
      uniqueVisitors: randomInRange(55, 145),
      avgTimeOnPage: randomInRange(80000, 200000),
      avgScrollDepth: randomInRange(50, 85),
      score: 0,
      lastViewed: new Date(now.getTime() - randomInRange(3, 96) * 60 * 60 * 1000).toISOString(),
    },
    {
      slug: 'confiance-en-soi',
      title: 'Développer sa confiance en soi',
      views: randomInRange(60, 150),
      uniqueVisitors: randomInRange(50, 120),
      avgTimeOnPage: randomInRange(70000, 180000),
      avgScrollDepth: randomInRange(45, 80),
      score: 0,
      lastViewed: new Date(now.getTime() - randomInRange(5, 120) * 60 * 60 * 1000).toISOString(),
    },
    {
      slug: 'depression-signes-aide',
      title: 'Dépression : signes et aide',
      views: randomInRange(50, 130),
      uniqueVisitors: randomInRange(40, 100),
      avgTimeOnPage: randomInRange(180000, 400000),
      avgScrollDepth: randomInRange(75, 98),
      score: 0,
      lastViewed: new Date(now.getTime() - randomInRange(2, 48) * 60 * 60 * 1000).toISOString(),
    },
    {
      slug: 'relations-toxiques',
      title: 'Identifier les relations toxiques',
      views: randomInRange(40, 110),
      uniqueVisitors: randomInRange(35, 90),
      avgTimeOnPage: randomInRange(100000, 250000),
      avgScrollDepth: randomInRange(60, 92),
      score: 0,
      lastViewed: new Date(now.getTime() - randomInRange(4, 168) * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Calculate scores for blog articles
  blogArticles.forEach(article => {
    const viewsScore = Math.min(article.views / 350, 1) * 25;
    const visitorsScore = Math.min(article.uniqueVisitors / 280, 1) * 20;
    const durationScore = article.avgTimeOnPage
      ? Math.min(article.avgTimeOnPage / 300000, 1) * 25
      : 0;
    const scrollScore = article.avgScrollDepth ? Math.min(article.avgScrollDepth / 100, 1) * 30 : 0;
    article.score = Math.round(viewsScore + visitorsScore + durationScore + scrollScore);
  });

  // Sort by score
  blogArticles.sort((a, b) => b.score - a.score);

  const blogTotalViews = blogArticles.reduce((sum, a) => sum + a.views, 0);
  const blogTotalVisitors = blogArticles.reduce((sum, a) => sum + a.uniqueVisitors, 0);

  const blogCtaStats: BlogCTAStats = {
    appointment: randomInRange(15, 45),
    seminar: randomInRange(8, 25),
    total: 0,
  };
  blogCtaStats.total = blogCtaStats.appointment + blogCtaStats.seminar;

  const blogFaqStats: BlogFAQStats = {
    totalOpens: randomInRange(50, 150),
    topQuestions: [
      {
        question: 'Combien de séances sont nécessaires ?',
        articleSlug: 'hypnose-therapeutique',
        opens: randomInRange(20, 50),
      },
      {
        question: "L'hypnose fonctionne-t-elle sur tout le monde ?",
        articleSlug: 'hypnose-therapeutique',
        opens: randomInRange(15, 40),
      },
      {
        question: "Comment savoir si je souffre d'anxiété sociale ?",
        articleSlug: 'comprendre-anxiete-sociale',
        opens: randomInRange(12, 35),
      },
      {
        question: 'La méditation peut-elle remplacer un traitement ?',
        articleSlug: 'bienfaits-meditation',
        opens: randomInRange(10, 30),
      },
      {
        question: 'Quels sont les premiers signes de la dépression ?',
        articleSlug: 'depression-signes-aide',
        opens: randomInRange(8, 25),
      },
    ],
  };

  const blogData: BlogPanelData = {
    articles: blogArticles,
    totalViews: blogTotalViews,
    totalUniqueVisitors: blogTotalVisitors,
    avgViewsPerVisitor: blogTotalVisitors > 0 ? blogTotalViews / blogTotalVisitors : 0,
    ctaStats: blogCtaStats,
    faqStats: blogFaqStats,
    topPerformingArticle: blogArticles[0] || null,
    viewsChange: randomInRange(-10, 25),
    visitorsChange: randomInRange(-8, 20),
  };

  // Posts Data (Social Media)
  const platforms: PlatformStats[] = [
    {
      platform: 'Instagram',
      icon: 'instagram',
      followers: randomInRange(2500, 5000),
      followersChange: randomInRange(-2, 8),
      posts: randomInRange(15, 35),
      reach: randomInRange(15000, 45000),
      engagement: randomInRange(800, 2500),
      engagementRate: (randomWithVariation(4.5, 30) / 100) * 10,
      color: '#E4405F',
    },
    {
      platform: 'Facebook',
      icon: 'facebook',
      followers: randomInRange(1800, 4000),
      followersChange: randomInRange(-3, 5),
      posts: randomInRange(12, 28),
      reach: randomInRange(8000, 25000),
      engagement: randomInRange(400, 1200),
      engagementRate: (randomWithVariation(2.8, 30) / 100) * 10,
      color: '#1877F2',
    },
    {
      platform: 'LinkedIn',
      icon: 'linkedin',
      followers: randomInRange(800, 2000),
      followersChange: randomInRange(0, 12),
      posts: randomInRange(8, 20),
      reach: randomInRange(5000, 15000),
      engagement: randomInRange(200, 800),
      engagementRate: (randomWithVariation(3.2, 30) / 100) * 10,
      color: '#0A66C2',
    },
    {
      platform: 'Twitter',
      icon: 'twitter',
      followers: randomInRange(500, 1500),
      followersChange: randomInRange(-5, 10),
      posts: randomInRange(20, 50),
      reach: randomInRange(3000, 12000),
      engagement: randomInRange(150, 600),
      engagementRate: (randomWithVariation(2.1, 30) / 100) * 10,
      color: '#1DA1F2',
    },
  ];

  const postContents = [
    'Nouvelle technique de relaxation : découvrez comment la respiration consciente peut transformer votre quotidien',
    '5 signes que vous avez besoin de faire une pause dans votre vie professionnelle',
    "L'importance du sommeil pour votre santé mentale - nos conseils",
    "Témoignage : comment l'hypnose m'a aidé à surmonter mon anxiété",
    'Méditation guidée : 10 minutes pour retrouver votre calme intérieur',
    'Les bienfaits de la marche en pleine conscience',
    'Comment gérer les relations toxiques au travail ?',
    'Nouveau séminaire : Développez votre confiance en soi - inscriptions ouvertes',
    "Question fréquente : combien de séances d'hypnose sont nécessaires ?",
    'Astuce bien-être : créez votre routine matinale positive',
    'La différence entre stress et anxiété expliquée simplement',
    'Prendre soin de sa santé mentale en période de fêtes',
  ];

  const postTypes: ('image' | 'video' | 'carousel' | 'story' | 'reel' | 'text')[] = [
    'image',
    'video',
    'carousel',
    'story',
    'reel',
    'text',
  ];
  const platformNames: ('instagram' | 'facebook' | 'linkedin' | 'twitter')[] = [
    'instagram',
    'facebook',
    'linkedin',
    'twitter',
  ];

  const topPosts: SocialPost[] = [];
  for (let i = 0; i < 12; i++) {
    const reach = randomInRange(500, 8000);
    const likes = randomInRange(20, Math.floor(reach * 0.15));
    const comments = randomInRange(5, Math.floor(likes * 0.3));
    const shares = randomInRange(2, Math.floor(likes * 0.2));
    const saves = randomInRange(5, Math.floor(likes * 0.25));
    const engagement = likes + comments + shares + saves;
    const engagementRate = (engagement / reach) * 100;

    topPosts.push({
      id: `post-${i + 1}`,
      platform: platformNames[i % platformNames.length] ?? 'instagram',
      type: postTypes[i % postTypes.length] ?? 'image',
      content: postContents[i] ?? 'Post content',
      publishedAt: new Date(
        now.getTime() - randomInRange(1, 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      reach,
      impressions: Math.floor(reach * 1.3),
      likes,
      comments,
      shares,
      saves,
      engagementRate,
    });
  }

  // Sort by engagement rate
  topPosts.sort((a, b) => b.engagementRate - a.engagementRate);

  const postTypeStats: PostTypeStats[] = [
    {
      type: 'image',
      count: randomInRange(20, 40),
      avgEngagement: (randomWithVariation(3.5, 30) / 100) * 10,
      percentage: 0,
    },
    {
      type: 'video',
      count: randomInRange(10, 25),
      avgEngagement: (randomWithVariation(5.2, 30) / 100) * 10,
      percentage: 0,
    },
    {
      type: 'carousel',
      count: randomInRange(8, 18),
      avgEngagement: (randomWithVariation(4.8, 30) / 100) * 10,
      percentage: 0,
    },
    {
      type: 'reel',
      count: randomInRange(5, 15),
      avgEngagement: (randomWithVariation(6.5, 30) / 100) * 10,
      percentage: 0,
    },
    {
      type: 'story',
      count: randomInRange(15, 35),
      avgEngagement: (randomWithVariation(2.8, 30) / 100) * 10,
      percentage: 0,
    },
  ];

  const totalPostTypeCount = postTypeStats.reduce((sum, pt) => sum + pt.count, 0);
  postTypeStats.forEach(pt => {
    pt.percentage = (pt.count / totalPostTypeCount) * 100;
  });

  // Engagement trends based on period
  const engagementTrends: EngagementTrend[] = [];
  let trendPoints = 7;

  switch (period) {
    case 'realtime':
      trendPoints = 12;
      for (let i = 0; i < trendPoints; i++) {
        const date = new Date(now.getTime() - (trendPoints - 1 - i) * 5 * 60 * 1000);
        engagementTrends.push({
          label: formatTime(date),
          reach: randomInRange(100, 500),
          engagement: randomInRange(10, 80),
          posts: randomInRange(0, 2),
        });
      }
      break;
    case 'today':
    case 'yesterday':
      trendPoints = 24;
      for (let i = 0; i < trendPoints; i++) {
        const date = new Date(now);
        if (period === 'yesterday') date.setDate(date.getDate() - 1);
        date.setHours(i, 0, 0, 0);
        engagementTrends.push({
          label: formatTime(date),
          reach: randomInRange(200, 1500),
          engagement: randomInRange(20, 200),
          posts: randomInRange(0, 3),
        });
      }
      break;
    case 'last7days':
      trendPoints = 7;
      for (let i = 0; i < trendPoints; i++) {
        const date = new Date(now.getTime() - (trendPoints - 1 - i) * 24 * 60 * 60 * 1000);
        engagementTrends.push({
          label: formatShortDate(date),
          reach: randomInRange(2000, 8000),
          engagement: randomInRange(150, 800),
          posts: randomInRange(2, 8),
        });
      }
      break;
    case 'last30days':
    case 'thisMonth':
    case 'lastMonth':
      trendPoints = 15;
      for (let i = 0; i < trendPoints; i++) {
        const date = new Date(now.getTime() - (trendPoints - 1 - i) * 2 * 24 * 60 * 60 * 1000);
        engagementTrends.push({
          label: formatDayMonth(date),
          reach: randomInRange(1500, 6000),
          engagement: randomInRange(100, 600),
          posts: randomInRange(1, 5),
        });
      }
      break;
    case 'last3months':
      trendPoints = 13;
      for (let i = 0; i < trendPoints; i++) {
        const date = new Date(now.getTime() - (trendPoints - 1 - i) * 7 * 24 * 60 * 60 * 1000);
        engagementTrends.push({
          label: formatWeek(date),
          reach: randomInRange(8000, 25000),
          engagement: randomInRange(600, 2000),
          posts: randomInRange(8, 25),
        });
      }
      break;
    case 'thisYear':
      trendPoints = now.getMonth() + 1;
      for (let i = 0; i < trendPoints; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        engagementTrends.push({
          label: formatMonth(date),
          reach: randomInRange(30000, 80000),
          engagement: randomInRange(2000, 8000),
          posts: randomInRange(20, 60),
        });
      }
      break;
    default:
      trendPoints = 15;
      for (let i = 0; i < trendPoints; i++) {
        const date = new Date(now.getTime() - (trendPoints - 1 - i) * 2 * 24 * 60 * 60 * 1000);
        engagementTrends.push({
          label: formatDayMonth(date),
          reach: randomInRange(1500, 6000),
          engagement: randomInRange(100, 600),
          posts: randomInRange(1, 5),
        });
      }
  }

  // Best posting times heatmap
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = [9, 12, 15, 18, 21];
  const bestPostingTimes: BestPostingTime[] = [];

  days.forEach(day => {
    hours.forEach(hour => {
      // Higher engagement during lunch (12h) and evening (18h-21h)
      let baseEngagement = randomInRange(50, 150);
      if (hour === 12 || hour === 18) baseEngagement *= 1.5;
      if (hour === 21) baseEngagement *= 1.3;
      // Lower engagement on weekends
      if (day === 'Sam' || day === 'Dim') baseEngagement *= 0.7;

      bestPostingTimes.push({
        day,
        hour,
        engagement: Math.round(baseEngagement),
      });
    });
  });

  const totalPostsCount = platforms.reduce((sum, p) => sum + p.posts, 0);
  const totalReach = platforms.reduce((sum, p) => sum + p.reach, 0);
  const totalEngagement = platforms.reduce((sum, p) => sum + p.engagement, 0);
  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);

  const postsData: PostsPanelData = {
    totalPosts: totalPostsCount,
    postsChange: randomInRange(-5, 20),
    totalReach,
    reachChange: randomInRange(-8, 25),
    totalEngagement,
    engagementChange: randomInRange(-10, 30),
    avgEngagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
    engagementRateChange: randomInRange(-1, 2) / 10,
    totalFollowers,
    followersChange: randomInRange(50, 200),
    platforms,
    topPosts,
    postTypes: postTypeStats,
    engagementTrends,
    bestPostingTimes,
  };

  // KPIs
  const kpis: KPIData = {
    visitors: totalVisitors,
    visitorsChange: randomInRange(-15, 25),
    conversionRate: conversionRate,
    conversionChange: randomInRange(-2, 5),
    avgDuration: randomInRange(120, 240),
    durationChange: randomInRange(-30, 45),
  };

  // Health score calculation
  let healthScore = 50;
  if (kpis.visitorsChange > 10) healthScore += 15;
  else if (kpis.visitorsChange > 0) healthScore += 5;
  else if (kpis.visitorsChange < -10) healthScore -= 15;
  else if (kpis.visitorsChange < 0) healthScore -= 5;

  if (conversionRate > 5) healthScore += 20;
  else if (conversionRate > 2) healthScore += 10;
  else if (conversionRate < 1) healthScore -= 10;

  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    healthScore,
    kpis,
    trafficChart: chartData,
    topPages,
    totalViews: totalPageViews,
    totalVisitors,
    newVisitors: Math.round(totalVisitors * 0.4),
    avgSessionDuration: kpis.avgDuration,
    avgPagesPerSession: totalPageViews / totalVisitors,
    bounceRate: randomInRange(35, 55),
    scrollDepth: randomInRange(60, 85),
    sectionEngagement,
    deviceBreakdown,
    totalConversions,
    conversionRate,
    conversionChange: kpis.conversionChange,
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
    crawledPages: topCrawledPages.length,
    avgCrawlRate:
      botVisitsTimeline.reduce((sum, t) => sum + t.visits, 0) / botVisitsTimeline.length,
    botVisitsTimeline,
    botTypes,
    topCrawledPages,
    insights,
    alerts,
    blogData,
    postsData,
  };
}

interface SimulationProviderProps {
  children: ReactNode;
}

export function SimulationProvider({ children }: SimulationProviderProps) {
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  const toggleSimulationMode = useCallback(() => {
    setIsSimulationMode(prev => !prev);
  }, []);

  const setSimulationMode = useCallback((value: boolean) => {
    setIsSimulationMode(value);
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        isSimulationMode,
        toggleSimulationMode,
        setSimulationMode,
        generateSimulatedData,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
