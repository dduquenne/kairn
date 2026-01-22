// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Analytics Store Cache
 * File I/O and in-memory caching for analytics data
 */

import { promises as fs } from "fs";
import { join } from "path";
import type { Analytics } from "./types";
import { analyticsSchema } from "./schemas";

// Determine the correct data path
function getDataFilePath(): string {
  const primaryPath = join(process.cwd(), "public", "data");
  return join(primaryPath, "analytics.json");
}

const dataFilePath = getDataFilePath();

// In-memory cache to prevent data loss during rapid requests
let analyticsCache: Analytics | null = null;
let cacheTimestamp: number = 0;
const CACHE_VALIDITY_MS = 5000; // Cache valid for 5 seconds

async function ensureDataDirectory() {
  const dir = join(dataFilePath, "..");
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

function getEmptyAnalytics(): Analytics {
  return {
    pageVisits: [],
    sectionTimes: [],
    conversionEvents: [],
    customEvents: [],
    goals: [],
    goalCompletions: [],
    funnelSteps: [],
    alerts: [],
    alertHistory: [],
    dashboardConfigs: [],
    scheduledReports: [],
    anomalies: [],
  };
}

// Get cache or read from disk
export async function readAnalyticsData(): Promise<Analytics> {
  const now = Date.now();

  // Check if cache is still valid
  if (analyticsCache && now - cacheTimestamp < CACHE_VALIDITY_MS) {
    return analyticsCache;
  }

  try {
    await ensureDataDirectory();
    const data = await fs.readFile(dataFilePath, "utf-8");
    const parsed = JSON.parse(data);
    const validated = analyticsSchema.parse(parsed);

    const result: Analytics = {
      pageVisits: validated.pageVisits || [],
      sectionTimes: validated.sectionTimes || [],
      conversionEvents: validated.conversionEvents || [],
      customEvents: validated.customEvents || [],
      goals: validated.goals || [],
      goalCompletions: validated.goalCompletions || [],
      funnelSteps: validated.funnelSteps || [],
      alerts: validated.alerts || [],
      alertHistory: validated.alertHistory || [],
      dashboardConfigs: validated.dashboardConfigs || [],
      scheduledReports: validated.scheduledReports || [],
      anomalies: validated.anomalies || [],
    };

    // Update cache
    analyticsCache = result;
    cacheTimestamp = now;

    return result;
  } catch (error) {
    // If file doesn't exist, return empty data
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return getEmptyAnalytics();
    }

    // For other errors, log and return cached data if available
    console.error("Error reading analytics data:", error);
    if (analyticsCache) {
      return analyticsCache;
    }

    return getEmptyAnalytics();
  }
}

// Write with cache invalidation
export async function writeAnalyticsData(data: Analytics): Promise<void> {
  try {
    await ensureDataDirectory();
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

    // Update cache immediately after write
    analyticsCache = data;
    cacheTimestamp = Date.now();
  } catch (error) {
    console.error("Error writing analytics data:", error);
    // Even if write fails, update cache to prevent data loss in memory
    analyticsCache = data;
    cacheTimestamp = Date.now();
    throw error;
  }
}

// Generate unique ID with prefix
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
