/**
 * PostgreSQL Page Exit Operations
 *
 * Uses the unified AnalyticsEvent model with EventType.PAGE_EXIT.
 * Page exit data (timeOnPage, scrollDepthPercent, engagementScore) is
 * stored in the `data` JSON field.
 *
 * Previously, page_exit events were stored as EventType.CUSTOM via
 * trackCustomEvent(), making them invisible to engagement aggregation
 * queries. This module stores them under their proper EventType so that
 * getAnalyticsSummary() and getDeviceBreakdown() can compute session
 * duration and scroll depth correctly.
 */

import { EventType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

import {
  toPrismaJson,
  buildPageExitData,
  buildDateFilter,
  extractFromData,
  getCurrentSiteId,
} from './utils';

/**
 * Persists a page_exit event as EventType.PAGE_EXIT.
 */
export async function trackPageExit(params: {
  timestamp: string;
  sessionId: string;
  page: string;
  timeOnPage: number;
  scrollDepthPercent: number;
  engagementScore?: number;
}): Promise<void> {
  const siteId = await getCurrentSiteId();

  const eventData = buildPageExitData({
    timeOnPage: params.timeOnPage,
    scrollDepthPercent: params.scrollDepthPercent,
    engagementScore: params.engagementScore,
  });

  await prisma.analyticsEvent.create({
    data: {
      type: EventType.PAGE_EXIT,
      path: params.page,
      name: 'page_exit',
      sessionId: params.sessionId,
      data: toPrismaJson(eventData),
      createdAt: new Date(params.timestamp),
      siteId,
    },
  });
}

/**
 * Persists a scroll_depth event as EventType.SCROLL_DEPTH.
 */
export async function trackScrollDepth(params: {
  timestamp: string;
  sessionId: string;
  page: string;
  depth: number;
}): Promise<void> {
  const siteId = await getCurrentSiteId();

  await prisma.analyticsEvent.create({
    data: {
      type: EventType.SCROLL_DEPTH,
      path: params.page,
      name: `scroll_${params.depth}`,
      sessionId: params.sessionId,
      data: toPrismaJson({ depth: params.depth }),
      createdAt: new Date(params.timestamp),
      siteId,
    },
  });
}
