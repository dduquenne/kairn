/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Dashboard Config Operations
 */

import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";
import type { DashboardConfig } from "./types";

export async function createDashboardConfig(config: Omit<DashboardConfig, "id" | "createdAt" | "updatedAt">): Promise<DashboardConfig> {
  const data = await readAnalyticsData();
  const id = generateId("dashboard");
  const now = new Date().toISOString();

  // If this is set as default, unset other defaults for this user
  if (config.isDefault) {
    data.dashboardConfigs.forEach((dc) => {
      if (dc.userId === config.userId && dc.isDefault) {
        dc.isDefault = false;
      }
    });
  }

  const newConfig: DashboardConfig = {
    ...config,
    id,
    createdAt: now,
    updatedAt: now,
  };
  data.dashboardConfigs.push(newConfig);
  await writeAnalyticsData(data);
  return newConfig;
}

export async function getDashboardConfigs(userId?: string): Promise<DashboardConfig[]> {
  const data = await readAnalyticsData();
  if (userId) {
    return data.dashboardConfigs.filter((dc) => dc.userId === userId);
  }
  return data.dashboardConfigs;
}

export async function getDashboardConfig(id: string): Promise<DashboardConfig | undefined> {
  const data = await readAnalyticsData();
  return data.dashboardConfigs.find((dc) => dc.id === id);
}

export async function getDefaultDashboardConfig(userId: string): Promise<DashboardConfig | undefined> {
  const data = await readAnalyticsData();
  return data.dashboardConfigs.find((dc) => dc.userId === userId && dc.isDefault);
}

export async function updateDashboardConfig(id: string, updates: Partial<Omit<DashboardConfig, "id" | "createdAt">>): Promise<DashboardConfig | null> {
  const data = await readAnalyticsData();
  const index = data.dashboardConfigs.findIndex((dc) => dc.id === id);
  if (index === -1) return null;

  // If setting as default, unset other defaults for this user
  if (updates.isDefault) {
    const userId = data.dashboardConfigs[index].userId;
    data.dashboardConfigs.forEach((dc) => {
      if (dc.userId === userId && dc.isDefault && dc.id !== id) {
        dc.isDefault = false;
      }
    });
  }

  data.dashboardConfigs[index] = {
    ...data.dashboardConfigs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeAnalyticsData(data);
  return data.dashboardConfigs[index];
}

export async function deleteDashboardConfig(id: string): Promise<boolean> {
  const data = await readAnalyticsData();
  const index = data.dashboardConfigs.findIndex((dc) => dc.id === id);
  if (index === -1) return false;

  data.dashboardConfigs.splice(index, 1);
  await writeAnalyticsData(data);
  return true;
}

// Default dashboard widget configuration
export function getDefaultWidgets(): DashboardConfig['widgets'] {
  return [
    { id: 'w1', type: 'stat_card', title: 'Visites', position: { x: 0, y: 0, w: 3, h: 2 }, config: { metric: 'visits' } },
    { id: 'w2', type: 'stat_card', title: 'Sessions', position: { x: 3, y: 0, w: 3, h: 2 }, config: { metric: 'sessions' } },
    { id: 'w3', type: 'stat_card', title: 'Temps moyen', position: { x: 6, y: 0, w: 3, h: 2 }, config: { metric: 'avg_time' } },
    { id: 'w4', type: 'stat_card', title: 'Taux de conversion', position: { x: 9, y: 0, w: 3, h: 2 }, config: { metric: 'conversion_rate' } },
    { id: 'w5', type: 'line_chart', title: 'Tendance des visites', position: { x: 0, y: 2, w: 8, h: 4 }, config: { metric: 'visits', period: 'day' } },
    { id: 'w6', type: 'bar_chart', title: 'Temps par section', position: { x: 8, y: 2, w: 4, h: 4 }, config: { metric: 'section_time' } },
    { id: 'w7', type: 'funnel', title: 'Entonnoir de conversion', position: { x: 0, y: 6, w: 6, h: 4 }, config: {} },
    { id: 'w8', type: 'heatmap', title: 'Engagement sections', position: { x: 6, y: 6, w: 6, h: 4 }, config: {} },
    { id: 'w9', type: 'anomalies', title: 'Anomalies detectees', position: { x: 0, y: 10, w: 6, h: 3 }, config: {} },
    { id: 'w10', type: 'alerts', title: 'Alertes recentes', position: { x: 6, y: 10, w: 6, h: 3 }, config: {} },
  ];
}
