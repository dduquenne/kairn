// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Store Schemas
 * Zod validation schemas for analytics data
 */

import { z } from "zod";

export const pageVisitSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  page: z.string(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),

  // Source & Attribution
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  referrerDomain: z.string().optional(),

  // Device & Browser
  deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),

  // Engagement
  scrollDepthPercent: z.number().optional(),
  timeOnPage: z.number().optional(),

  // Bot detection
  isBot: z.boolean().optional(),
});

export const sectionTimeSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  section: z.string(),
  timeSpent: z.number(),
});

export const conversionEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  eventType: z.enum(["appointment_request", "seminar_registration", "contact_form"]),
  stepName: z.string(),
  completed: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

export const customEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  category: z.string(),
  action: z.string(),
  label: z.string().optional(),
  value: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const goalSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['destination', 'event', 'duration', 'pages_per_session']),
  destinationUrl: z.string().optional(),
  eventCategory: z.string().optional(),
  eventAction: z.string().optional(),
  eventLabel: z.string().optional(),
  durationSeconds: z.number().optional(),
  comparison: z.enum(['greater_than', 'less_than']).optional(),
  pagesCount: z.number().optional(),
  value: z.number().optional(),
  enabled: z.boolean(),
  createdAt: z.string(),
});

export const goalCompletionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  goalId: z.string(),
  value: z.number().optional(),
});

export const funnelStepSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  funnelName: z.string(),
  stepName: z.string(),
  stepOrder: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export const alertSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['threshold', 'anomaly', 'trend']),
  metric: z.enum(['visits', 'sessions', 'conversions', 'conversion_rate', 'avg_time', 'bounce_rate']),
  condition: z.enum(['greater_than', 'less_than', 'equals', 'change_percent']),
  threshold: z.number(),
  timeWindow: z.enum(['hour', 'day', 'week', 'month']),
  channels: z.array(z.enum(['email', 'webhook'])),
  emailRecipients: z.array(z.string()).optional(),
  webhookUrl: z.string().optional(),
  enabled: z.boolean(),
  lastTriggered: z.string().optional(),
  lastValue: z.number().optional(),
  triggerCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const alertHistorySchema = z.object({
  id: z.string(),
  alertId: z.string(),
  alertName: z.string(),
  triggeredAt: z.string(),
  metric: z.string(),
  condition: z.string(),
  threshold: z.number(),
  actualValue: z.number(),
  message: z.string(),
  notificationsSent: z.array(z.object({
    channel: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  })),
});

export const dashboardConfigSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
  widgets: z.array(z.object({
    id: z.string(),
    type: z.enum(['stat_card', 'line_chart', 'bar_chart', 'funnel', 'heatmap', 'table', 'cohort', 'attribution', 'ai_insights', 'anomalies', 'alerts']),
    title: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    }),
    config: z.record(z.unknown()),
  })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const scheduledReportSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  timeOfDay: z.string(),
  recipients: z.array(z.string()),
  format: z.enum(['email', 'pdf', 'both']),
  sections: z.array(z.enum(['summary', 'traffic', 'conversions', 'sections', 'devices', 'cohorts', 'insights'])),
  enabled: z.boolean(),
  lastSent: z.string().optional(),
  nextScheduled: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const anomalySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  metric: z.string(),
  expectedValue: z.number(),
  actualValue: z.number(),
  deviation: z.number(),
  severity: z.enum(['low', 'medium', 'high']),
  type: z.enum(['spike', 'drop', 'unusual_pattern']),
  message: z.string(),
  acknowledged: z.boolean(),
  acknowledgedAt: z.string().optional(),
  acknowledgedBy: z.string().optional(),
});

export const analyticsSchema = z.object({
  pageVisits: z.array(pageVisitSchema).optional().default([]),
  sectionTimes: z.array(sectionTimeSchema).optional().default([]),
  conversionEvents: z.array(conversionEventSchema).optional().default([]),
  customEvents: z.array(customEventSchema).optional().default([]),
  goals: z.array(goalSchema).optional().default([]),
  goalCompletions: z.array(goalCompletionSchema).optional().default([]),
  funnelSteps: z.array(funnelStepSchema).optional().default([]),
  alerts: z.array(alertSchema).optional().default([]),
  alertHistory: z.array(alertHistorySchema).optional().default([]),
  dashboardConfigs: z.array(dashboardConfigSchema).optional().default([]),
  scheduledReports: z.array(scheduledReportSchema).optional().default([]),
  anomalies: z.array(anomalySchema).optional().default([]),
});
