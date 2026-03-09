/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Store Types
 * All interfaces and types for the analytics system
 */

export interface PageVisit {
  id: string;
  timestamp: string;
  sessionId: string;
  page: string;
  referrer?: string;
  userAgent?: string;

  // Source & Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrerDomain?: string;

  // Device & Browser
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;

  // Engagement
  scrollDepthPercent?: number;
  timeOnPage?: number;

  // Bot detection
  isBot?: boolean;
}

export interface SectionTime {
  id: string;
  timestamp: string;
  sessionId: string;
  section: string;
  timeSpent: number; // in milliseconds
}

export interface ConversionEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  eventType: "appointment_request" | "seminar_registration" | "contact_form";
  stepName: string;
  completed: boolean;
  metadata?: Record<string, unknown>;
}

export interface CustomEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface Goal {
  id: string;
  name: string;
  type: 'destination' | 'event' | 'duration' | 'pages_per_session';
  destinationUrl?: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  durationSeconds?: number;
  comparison?: 'greater_than' | 'less_than';
  pagesCount?: number;
  value?: number;
  enabled: boolean;
  createdAt: string;
}

export interface GoalCompletion {
  id: string;
  timestamp: string;
  sessionId: string;
  goalId: string;
  value?: number;
}

export interface FunnelStep {
  id: string;
  timestamp: string;
  sessionId: string;
  funnelName: string;
  stepName: string;
  stepOrder: number;
  metadata?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  name: string;
  description?: string;
  type: 'threshold' | 'anomaly' | 'trend';
  metric: 'visits' | 'sessions' | 'conversions' | 'conversion_rate' | 'avg_time' | 'bounce_rate';
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percent';
  threshold: number;
  timeWindow: 'hour' | 'day' | 'week' | 'month';
  channels: Array<'email' | 'webhook'>;
  emailRecipients?: string[];
  webhookUrl?: string;
  enabled: boolean;
  lastTriggered?: string;
  lastValue?: number;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  alertName: string;
  triggeredAt: string;
  metric: string;
  condition: string;
  threshold: number;
  actualValue: number;
  message: string;
  notificationsSent: Array<{ channel: string; success: boolean; error?: string }>;
}

export interface DashboardConfig {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: Array<{
    id: string;
    type: 'stat_card' | 'line_chart' | 'bar_chart' | 'funnel' | 'heatmap' | 'table' | 'cohort' | 'attribution' | 'ai_insights' | 'anomalies' | 'alerts';
    title: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  recipients: string[];
  format: 'email' | 'pdf' | 'both';
  sections: Array<'summary' | 'traffic' | 'conversions' | 'sections' | 'devices' | 'cohorts' | 'insights'>;
  enabled: boolean;
  lastSent?: string;
  nextScheduled?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  type: 'spike' | 'drop' | 'unusual_pattern';
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface Analytics {
  pageVisits: PageVisit[];
  sectionTimes: SectionTime[];
  conversionEvents: ConversionEvent[];
  customEvents: CustomEvent[];
  goals: Goal[];
  goalCompletions: GoalCompletion[];
  funnelSteps: FunnelStep[];
  alerts: Alert[];
  alertHistory: AlertHistory[];
  dashboardConfigs: DashboardConfig[];
  scheduledReports: ScheduledReport[];
  anomalies: Anomaly[];
}
