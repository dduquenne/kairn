/**
 * Web Vitals Analytics API Endpoint
 *
 * Receives and stores Web Vitals metrics from the client.
 * Data is stored in the analytics JSON file for dashboard reporting.
 */
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { NextResponse } from 'next/server';

// Path to analytics data file
const ANALYTICS_FILE = join(process.cwd(), 'public', 'data', 'analytics.json');

interface WebVitalsData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
  url: string;
  referrer?: string;
  userAgent?: string;
  timestamp: number;
}

interface AnalyticsData {
  pageVisits: unknown[];
  sectionTimes: unknown[];
  conversionEvents: unknown[];
  customEvents: unknown[];
  goals: unknown[];
  goalCompletions: unknown[];
  funnelSteps: unknown[];
  alerts: unknown[];
  alertHistory: unknown[];
  dashboardConfigs: unknown[];
  scheduledReports: unknown[];
  anomalies: unknown[];
  webVitals?: WebVitalsData[];
}

async function loadAnalyticsData(): Promise<AnalyticsData> {
  try {
    const content = await readFile(ANALYTICS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Return default structure if file doesn't exist
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
      webVitals: [],
    };
  }
}

async function saveAnalyticsData(data: AnalyticsData): Promise<void> {
  await writeFile(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  try {
    const vitalsData: WebVitalsData = await request.json();

    // Validate required fields
    if (!vitalsData.name || typeof vitalsData.value !== 'number') {
      return NextResponse.json({ error: 'Invalid Web Vitals data' }, { status: 400 });
    }

    // Load existing data
    const analyticsData = await loadAnalyticsData();

    // Initialize webVitals array if it doesn't exist
    if (!analyticsData.webVitals) {
      analyticsData.webVitals = [];
    }

    // Add new metric
    analyticsData.webVitals.push({
      ...vitalsData,
      timestamp: vitalsData.timestamp || Date.now(),
    });

    // Keep only last 1000 entries to prevent file from growing too large
    if (analyticsData.webVitals.length > 1000) {
      analyticsData.webVitals = analyticsData.webVitals.slice(-1000);
    }

    // Save updated data
    await saveAnalyticsData(analyticsData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WebVitals API] Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for dashboard to retrieve metrics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const since = parseInt(searchParams.get('since') || '0', 10);

    const analyticsData = await loadAnalyticsData();
    let vitals = analyticsData.webVitals || [];

    // Filter by metric name if specified
    if (metric) {
      vitals = vitals.filter(v => v.name === metric);
    }

    // Filter by timestamp if specified
    if (since > 0) {
      vitals = vitals.filter(v => v.timestamp >= since);
    }

    // Get latest entries
    vitals = vitals.slice(-limit);

    // Calculate aggregates
    const aggregates = calculateAggregates(vitals);

    return NextResponse.json({
      metrics: vitals,
      aggregates,
      count: vitals.length,
    });
  } catch (error) {
    console.error('[WebVitals API] Error fetching metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateAggregates(vitals: WebVitalsData[]) {
  const metricNames = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
  const aggregates: Record<
    string,
    { avg: number; p75: number; good: number; poor: number; count: number }
  > = {};

  for (const name of metricNames) {
    const values = vitals.filter(v => v.name === name).map(v => v.value);

    if (values.length === 0) {
      aggregates[name] = { avg: 0, p75: 0, good: 0, poor: 0, count: 0 };
      continue;
    }

    values.sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const p75Index = Math.floor(values.length * 0.75);
    const p75 = values[p75Index] ?? values[values.length - 1] ?? 0;

    const ratings = vitals.filter(v => v.name === name);
    const good = ratings.filter(v => v.rating === 'good').length;
    const poor = ratings.filter(v => v.rating === 'poor').length;

    aggregates[name] = {
      avg: Math.round(avg * 100) / 100,
      p75: Math.round(p75 * 100) / 100,
      good,
      poor,
      count: values.length,
    };
  }

  return aggregates;
}
