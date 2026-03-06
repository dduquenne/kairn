/**
 * PostgreSQL Funnel Operations
 *
 * Uses the unified AnalyticsEvent model with EventType.FUNNEL_STEP
 * Funnel step data is stored in the `data` JSON field.
 */

import { EventType } from '@prisma/client';

import { getAnalyticsContext } from '../context';
import type { FunnelStep } from '../types';
import { toPrismaJson, buildFunnelStepData, buildDateFilter, extractFromData } from '../utils';

/**
 * Converts an AnalyticsEvent record to FunnelStep type
 */
function toFunnelStep(record: {
  id: string;
  createdAt: Date;
  sessionId: string | null;
  name: string | null;
  data: unknown;
}): FunnelStep {
  const data = (record.data as Record<string, unknown>) || {};

  return {
    id: record.id,
    timestamp: record.createdAt.toISOString(),
    sessionId: record.sessionId || '',
    funnelName: extractFromData<string>(data, 'funnelName', 'unknown'),
    stepName: extractFromData<string>(data, 'stepName', 'unknown'),
    stepOrder: extractFromData<number>(data, 'stepOrder', 0),
    metadata: extractFromData<Record<string, unknown> | undefined>(data, 'metadata', undefined),
  };
}

/** Track a funnel step */
export async function trackFunnelStep(step: {
  timestamp: string;
  sessionId: string;
  funnelName: string;
  stepName: string;
  stepOrder: number;
  metadata?: Record<string, unknown>;
}): Promise<FunnelStep> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();

  const eventData = buildFunnelStepData({
    funnelName: step.funnelName,
    stepName: step.stepName,
    stepOrder: step.stepOrder,
    metadata: step.metadata,
  });

  const result = await prisma.analyticsEvent.create({
    data: {
      type: EventType.FUNNEL_STEP,
      path: '/',
      name: `${step.funnelName}:${step.stepName}`,
      sessionId: step.sessionId,
      data: toPrismaJson(eventData),
      createdAt: new Date(step.timestamp),
      siteId,
    },
  });

  return toFunnelStep(result);
}

/** Get funnel steps within a date range */
export async function getFunnelSteps(
  funnelName?: string,
  startDate?: string,
  endDate?: string
): Promise<FunnelStep[]> {
  const { prisma, getSiteId } = getAnalyticsContext();
  const siteId = await getSiteId();
  const dateFilter = buildDateFilter(startDate, endDate);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      siteId,
      type: EventType.FUNNEL_STEP,
      ...dateFilter,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Filter by funnel name if specified
  let filteredEvents = events;
  if (funnelName) {
    filteredEvents = events.filter(event => {
      const data = (event.data as Record<string, unknown>) || {};
      return extractFromData<string>(data, 'funnelName', '') === funnelName;
    });
  }

  return filteredEvents.map(toFunnelStep);
}

/** Get funnel analysis with conversion rates */
export async function getFunnelAnalysis(
  funnelName: string,
  startDate?: string,
  endDate?: string
): Promise<{
  funnelName: string;
  steps: Array<{
    stepName: string;
    stepOrder: number;
    users: number;
    conversionRate: number;
    dropoffRate: number;
    avgTimeToNext?: number;
  }>;
  overallConversion: number;
  totalUsers: number;
}> {
  const steps = await getFunnelSteps(funnelName, startDate, endDate);

  const sessionSteps = new Map<string, Set<number>>();
  const stepUsers = new Map<number, Set<string>>();
  const stepNames = new Map<number, string>();
  const stepTimestamps = new Map<string, Map<number, number>>();

  for (const step of steps) {
    // Track which steps each session completed
    const sessionSet = sessionSteps.get(step.sessionId);
    if (sessionSet) {
      sessionSet.add(step.stepOrder);
    } else {
      sessionSteps.set(step.sessionId, new Set([step.stepOrder]));
    }

    // Track unique users at each step
    const userSet = stepUsers.get(step.stepOrder);
    if (userSet) {
      userSet.add(step.sessionId);
    } else {
      stepUsers.set(step.stepOrder, new Set([step.sessionId]));
    }

    // Track step names
    stepNames.set(step.stepOrder, step.stepName);

    // Track timestamps for time calculations
    const tsMap = stepTimestamps.get(step.sessionId);
    if (tsMap) {
      tsMap.set(step.stepOrder, new Date(step.timestamp).getTime());
    } else {
      stepTimestamps.set(
        step.sessionId,
        new Map([[step.stepOrder, new Date(step.timestamp).getTime()]])
      );
    }
  }

  const sortedStepOrders = Array.from(stepNames.keys()).sort((a, b) => a - b);
  const firstStepOrder = sortedStepOrders[0];
  const firstStepUsers =
    firstStepOrder !== undefined ? stepUsers.get(firstStepOrder)?.size || 0 : 0;

  const analysisSteps = sortedStepOrders.map((stepOrder, index) => {
    const usersAtStep = stepUsers.get(stepOrder)?.size || 0;
    const prevStepOrder = sortedStepOrders[index - 1];
    const prevStepUsers =
      index > 0 && prevStepOrder !== undefined
        ? stepUsers.get(prevStepOrder)?.size || 0
        : usersAtStep;
    const nextStepOrder = sortedStepOrders[index + 1];

    // Calculate average time to next step
    let avgTimeToNext: number | undefined;
    if (nextStepOrder !== undefined) {
      const times: number[] = [];
      stepTimestamps.forEach(timestamps => {
        const currentTime = timestamps.get(stepOrder);
        const nextTime = timestamps.get(nextStepOrder);
        if (currentTime && nextTime) {
          times.push(nextTime - currentTime);
        }
      });
      if (times.length > 0) {
        avgTimeToNext = times.reduce((a, b) => a + b, 0) / times.length;
      }
    }

    return {
      stepName: stepNames.get(stepOrder) || `Step ${stepOrder}`,
      stepOrder,
      users: usersAtStep,
      conversionRate: prevStepUsers > 0 ? (usersAtStep / prevStepUsers) * 100 : 100,
      dropoffRate: prevStepUsers > 0 ? ((prevStepUsers - usersAtStep) / prevStepUsers) * 100 : 0,
      avgTimeToNext,
    };
  });

  const lastStepOrder = sortedStepOrders[sortedStepOrders.length - 1];
  const lastStepUsers = lastStepOrder !== undefined ? stepUsers.get(lastStepOrder)?.size || 0 : 0;

  return {
    funnelName,
    steps: analysisSteps,
    overallConversion: firstStepUsers > 0 ? (lastStepUsers / firstStepUsers) * 100 : 0,
    totalUsers: firstStepUsers,
  };
}

/** Get list of available funnels */
export async function getAvailableFunnels(startDate?: string, endDate?: string): Promise<string[]> {
  const steps = await getFunnelSteps(undefined, startDate, endDate);
  return Array.from(new Set(steps.map(s => s.funnelName)));
}
