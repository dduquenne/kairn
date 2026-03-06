/**
 * PostgreSQL Page Exit Operations
 *
 * Uses the unified AnalyticsEvent model with EventType.PAGE_EXIT
 * and EventType.SCROLL_DEPTH.
 */

import { EventType } from '@prisma/client';

import { getAnalyticsContext } from '../context';
import { toPrismaJson, buildPageExitData } from '../utils';

/** Persist a page_exit event */
export async function trackPageExit(params: {
  timestamp: string;
  sessionId: string;
  page: string;
  timeOnPage: number;
  scrollDepthPercent: number;
  engagementScore?: number;
}): Promise<void> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();
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

/** Persist a scroll_depth event */
export async function trackScrollDepth(params: {
  timestamp: string;
  sessionId: string;
  page: string;
  depth: number;
}): Promise<void> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();
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
