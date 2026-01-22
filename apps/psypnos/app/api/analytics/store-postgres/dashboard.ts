// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Dashboard Config Operations
 */

import { prisma } from "@/lib/db/prisma";
import type { JsonValue, InputJsonValue } from "@prisma/client/runtime/library";
import type { DashboardConfig } from "../store/types";

/** Widget type definition - matches DashboardConfig.widgets from store/types.ts */
type WidgetType = 'stat_card' | 'line_chart' | 'bar_chart' | 'funnel' | 'heatmap' | 'table' | 'cohort' | 'attribution' | 'ai_insights' | 'anomalies' | 'alerts';

type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
};

/**
 * Convert a Prisma DashboardConfig record to our application DashboardConfig type.
 */
function toDashboardConfig(record: {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: JsonValue;
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

export async function createDashboardConfig(config: {
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: Widget[];
}): Promise<DashboardConfig> {
  // If setting as default, unset other defaults for this user
  if (config.isDefault) {
    await prisma.dashboardConfig.updateMany({
      where: { userId: config.userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const result = await prisma.dashboardConfig.create({
    data: {
      userId: config.userId,
      name: config.name,
      isDefault: config.isDefault,
      widgets: config.widgets as InputJsonValue,
    },
  });

  return toDashboardConfig(result);
}

export async function getDashboardConfigs(userId?: string): Promise<DashboardConfig[]> {
  const where = userId ? { userId } : {};

  const configs = await prisma.dashboardConfig.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return configs.map(toDashboardConfig);
}

export async function getDashboardConfig(id: string): Promise<DashboardConfig | undefined> {
  const config = await prisma.dashboardConfig.findUnique({ where: { id } });

  if (!config) return undefined;

  return toDashboardConfig(config);
}

export async function getDefaultDashboardConfig(userId: string): Promise<DashboardConfig | undefined> {
  const config = await prisma.dashboardConfig.findFirst({
    where: { userId, isDefault: true },
  });

  if (!config) return undefined;

  return toDashboardConfig(config);
}

export async function updateDashboardConfig(
  id: string,
  updates: Partial<{
    name: string;
    isDefault: boolean;
    widgets: Widget[];
  }>,
): Promise<DashboardConfig | null> {
  try {
    // If setting as default, unset other defaults for this user
    if (updates.isDefault) {
      const config = await prisma.dashboardConfig.findUnique({ where: { id } });
      if (config) {
        await prisma.dashboardConfig.updateMany({
          where: { userId: config.userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
    }

    // Build update data with proper typing
    const updateData: { name?: string; isDefault?: boolean; widgets?: InputJsonValue } = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;
    if (updates.widgets !== undefined) updateData.widgets = updates.widgets as InputJsonValue;

    const result = await prisma.dashboardConfig.update({
      where: { id },
      data: updateData,
    });

    return toDashboardConfig(result);
  } catch {
    return null;
  }
}

export async function deleteDashboardConfig(id: string): Promise<boolean> {
  try {
    await prisma.dashboardConfig.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
