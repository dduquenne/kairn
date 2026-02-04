/**
 * PostgreSQL Dashboard Config Operations
 *
 * Uses the AnalyticsDashboardConfig model for dashboard configurations.
 */

import { prisma } from "@/lib/db/prisma";

import type { DashboardConfig } from "../store/types";

import { getCurrentSiteId, toPrismaJson, type InputJsonValue } from "./utils";

/** Widget type definition - matches DashboardConfig.widgets from store/types.ts */
type WidgetType =
  | "stat_card"
  | "line_chart"
  | "bar_chart"
  | "funnel"
  | "heatmap"
  | "table"
  | "cohort"
  | "attribution"
  | "ai_insights"
  | "anomalies"
  | "alerts";

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
  const siteId = getCurrentSiteId();

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
  const siteId = getCurrentSiteId();

  const where: { siteId: string; userId?: string } = { siteId };
  if (userId) where.userId = userId;

  const configs = await prisma.analyticsDashboardConfig.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return configs.map(toDashboardConfig);
}

/**
 * Get a specific dashboard configuration
 */
export async function getDashboardConfig(id: string): Promise<DashboardConfig | undefined> {
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
  const siteId = getCurrentSiteId();

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
  try {
    const siteId = getCurrentSiteId();

    // If setting as default, unset other defaults for this user
    if (updates.isDefault) {
      const config = await prisma.analyticsDashboardConfig.findUnique({
        where: { id },
      });
      if (config) {
        await prisma.analyticsDashboardConfig.updateMany({
          where: { userId: config.userId, siteId, isDefault: true, id: { not: id } },
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
      data: updateData as { name?: string; isDefault?: boolean; widgets?: InputJsonValue },
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
  try {
    await prisma.analyticsDashboardConfig.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
