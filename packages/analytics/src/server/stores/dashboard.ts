/**
 * PostgreSQL Dashboard Config Operations
 *
 * Uses the AnalyticsDashboardConfig model for dashboard configurations.
 * Ported from apps/psypnos — uses DI context instead of direct imports.
 */

import { getAnalyticsContext } from '../context';
import type { DashboardConfig } from '../types';
import { toPrismaJson, type InputJsonValue } from '../utils';

/** Widget type definition - matches DashboardConfig.widgets from types.ts */
type WidgetType =
  | 'stat_card'
  | 'line_chart'
  | 'bar_chart'
  | 'funnel'
  | 'heatmap'
  | 'table'
  | 'cohort'
  | 'attribution'
  | 'ai_insights'
  | 'anomalies'
  | 'alerts';

type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
};

/**
 * Converts a Prisma AnalyticsDashboardConfig record to DashboardConfig type
 */
function toDashboardConfig(record: {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: unknown;
  settings: unknown;
  createdAt: Date;
  updatedAt: Date;
}): DashboardConfig {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    isDefault: record.isDefault,
    widgets: (record.widgets ?? []) as Widget[],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Create a new dashboard configuration
 */
export async function createDashboardConfig(config: {
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: Widget[];
}): Promise<DashboardConfig> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();

  // If setting as default, unset other defaults for this user
  if (config.isDefault) {
    await prisma.analyticsDashboardConfig.updateMany({
      where: { userId: config.userId, siteId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const result = await prisma.analyticsDashboardConfig.create({
    data: {
      userId: config.userId,
      name: config.name,
      isDefault: config.isDefault,
      widgets: toPrismaJson(config.widgets as unknown as Record<string, unknown>) || [],
      siteId,
    },
  });

  return toDashboardConfig(result);
}

/**
 * Get dashboard configurations
 */
export async function getDashboardConfigs(userId?: string): Promise<DashboardConfig[]> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();

  const where: { siteId: string; userId?: string } = { siteId };
  if (userId) where.userId = userId;

  const configs = await prisma.analyticsDashboardConfig.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return configs.map(toDashboardConfig);
}

/**
 * Get a specific dashboard configuration
 */
export async function getDashboardConfig(id: string): Promise<DashboardConfig | undefined> {
  const { prisma } = getAnalyticsContext();

  const config = await prisma.analyticsDashboardConfig.findUnique({
    where: { id },
  });

  if (!config) return undefined;

  return toDashboardConfig(config);
}

/**
 * Get the default dashboard configuration for a user
 */
export async function getDefaultDashboardConfig(
  userId: string
): Promise<DashboardConfig | undefined> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();

  const config = await prisma.analyticsDashboardConfig.findFirst({
    where: { userId, siteId, isDefault: true },
  });

  if (!config) return undefined;

  return toDashboardConfig(config);
}

/**
 * Update a dashboard configuration
 */
export async function updateDashboardConfig(
  id: string,
  updates: Partial<{
    name: string;
    isDefault: boolean;
    widgets: Widget[];
  }>
): Promise<DashboardConfig | null> {
  const { prisma, getSiteId } = getAnalyticsContext();

  try {
    const siteId = await getSiteId();

    // If setting as default, unset other defaults for this user
    if (updates.isDefault) {
      const config = await prisma.analyticsDashboardConfig.findUnique({
        where: { id },
      });
      if (config) {
        await prisma.analyticsDashboardConfig.updateMany({
          where: {
            userId: config.userId,
            siteId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;
    if (updates.widgets !== undefined) {
      updateData.widgets = toPrismaJson(updates.widgets as unknown as Record<string, unknown>);
    }

    const result = await prisma.analyticsDashboardConfig.update({
      where: { id },
      data: updateData as {
        name?: string;
        isDefault?: boolean;
        widgets?: InputJsonValue;
      },
    });

    return toDashboardConfig(result);
  } catch {
    return null;
  }
}

/**
 * Delete a dashboard configuration
 */
export async function deleteDashboardConfig(id: string): Promise<boolean> {
  const { prisma } = getAnalyticsContext();

  try {
    await prisma.analyticsDashboardConfig.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Default dashboard widget configuration
 */
export function getDefaultWidgets(): DashboardConfig['widgets'] {
  return [
    {
      id: 'w1',
      type: 'stat_card',
      title: 'Visites',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: { metric: 'visits' },
    },
    {
      id: 'w2',
      type: 'stat_card',
      title: 'Sessions',
      position: { x: 3, y: 0, w: 3, h: 2 },
      config: { metric: 'sessions' },
    },
    {
      id: 'w3',
      type: 'stat_card',
      title: 'Temps moyen',
      position: { x: 6, y: 0, w: 3, h: 2 },
      config: { metric: 'avg_time' },
    },
    {
      id: 'w4',
      type: 'stat_card',
      title: 'Taux de conversion',
      position: { x: 9, y: 0, w: 3, h: 2 },
      config: { metric: 'conversion_rate' },
    },
    {
      id: 'w5',
      type: 'line_chart',
      title: 'Tendance des visites',
      position: { x: 0, y: 2, w: 8, h: 4 },
      config: { metric: 'visits', period: 'day' },
    },
    {
      id: 'w6',
      type: 'bar_chart',
      title: 'Temps par section',
      position: { x: 8, y: 2, w: 4, h: 4 },
      config: { metric: 'section_time' },
    },
    {
      id: 'w7',
      type: 'funnel',
      title: 'Entonnoir de conversion',
      position: { x: 0, y: 6, w: 6, h: 4 },
      config: {},
    },
    {
      id: 'w8',
      type: 'heatmap',
      title: 'Engagement sections',
      position: { x: 6, y: 6, w: 6, h: 4 },
      config: {},
    },
    {
      id: 'w9',
      type: 'anomalies',
      title: 'Anomalies detectees',
      position: { x: 0, y: 10, w: 6, h: 3 },
      config: {},
    },
    {
      id: 'w10',
      type: 'alerts',
      title: 'Alertes recentes',
      position: { x: 6, y: 10, w: 6, h: 3 },
      config: {},
    },
  ];
}
