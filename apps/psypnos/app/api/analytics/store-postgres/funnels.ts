// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Funnel Operations
 */

import { prisma } from "@/lib/db/prisma";
import type { FunnelStep } from "../store/types";
import { toPrismaJson } from "./utils";

// Type alias for where input (workaround for ungenerated Prisma client)
type FunnelStepWhereInput = {
  timestamp?: { gte?: Date; lte?: Date };
  funnelName?: string;
};

/**
 * Prisma FunnelStep record type.
 * Prisma uses `null` for absent optional values, while our FunnelStep type uses `undefined`.
 */
interface FunnelStepRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  funnelName: string;
  stepName: string;
  stepOrder: number;
  metadata: unknown;
}

/**
 * Convert a Prisma FunnelStepRecord to our application FunnelStep type.
 * This handles the null → undefined conversion for optional fields.
 */
function toFunnelStep(record: FunnelStepRecord): FunnelStep {
  return {
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    sessionId: record.sessionId,
    funnelName: record.funnelName,
    stepName: record.stepName,
    stepOrder: record.stepOrder,
    metadata: (record.metadata as Record<string, unknown>) ?? undefined,
  };
}

export async function trackFunnelStep(step: {
  timestamp: string;
  sessionId: string;
  funnelName: string;
  stepName: string;
  stepOrder: number;
  metadata?: Record<string, unknown>;
}): Promise<FunnelStep> {
  const result = await prisma.funnelStep.create({
    data: {
      timestamp: new Date(step.timestamp),
      sessionId: step.sessionId,
      funnelName: step.funnelName,
      stepName: step.stepName,
      stepOrder: step.stepOrder,
      metadata: toPrismaJson(step.metadata),
    },
  });

  return toFunnelStep(result as FunnelStepRecord);
}

export async function getFunnelSteps(
  funnelName?: string,
  startDate?: string,
  endDate?: string,
): Promise<FunnelStep[]> {
  const where: FunnelStepWhereInput = {};

  if (funnelName) where.funnelName = funnelName;

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const steps = await prisma.funnelStep.findMany({
    where,
    orderBy: { timestamp: "asc" },
  });

  return (steps as FunnelStepRecord[]).map(toFunnelStep);
}

export async function getFunnelAnalysis(
  funnelName: string,
  startDate?: string,
  endDate?: string,
) {
  const steps = await getFunnelSteps(funnelName, startDate, endDate);

  const sessionSteps = new Map<string, Set<number>>();
  const stepUsers = new Map<number, Set<string>>();
  const stepNames = new Map<number, string>();
  const stepTimestamps = new Map<string, Map<number, number>>();

  steps.forEach((step) => {
    if (!sessionSteps.has(step.sessionId)) {
      sessionSteps.set(step.sessionId, new Set());
    }
    sessionSteps.get(step.sessionId)!.add(step.stepOrder);

    if (!stepUsers.has(step.stepOrder)) {
      stepUsers.set(step.stepOrder, new Set());
    }
    stepUsers.get(step.stepOrder)!.add(step.sessionId);

    stepNames.set(step.stepOrder, step.stepName);

    if (!stepTimestamps.has(step.sessionId)) {
      stepTimestamps.set(step.sessionId, new Map());
    }
    stepTimestamps.get(step.sessionId)!.set(step.stepOrder, new Date(step.timestamp).getTime());
  });

  const sortedStepOrders = Array.from(stepNames.keys()).sort((a, b) => a - b);
  const firstStepUsers = stepUsers.get(sortedStepOrders[0])?.size || 0;

  const analysisSteps = sortedStepOrders.map((stepOrder, index) => {
    const usersAtStep = stepUsers.get(stepOrder)?.size || 0;
    const prevStepUsers =
      index > 0 ? stepUsers.get(sortedStepOrders[index - 1])?.size || 0 : usersAtStep;
    const nextStepOrder = sortedStepOrders[index + 1];

    let avgTimeToNext: number | undefined;
    if (nextStepOrder !== undefined) {
      const times: number[] = [];
      stepTimestamps.forEach((timestamps) => {
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

  const lastStepUsers =
    stepUsers.get(sortedStepOrders[sortedStepOrders.length - 1])?.size || 0;

  return {
    funnelName,
    steps: analysisSteps,
    overallConversion: firstStepUsers > 0 ? (lastStepUsers / firstStepUsers) * 100 : 0,
    totalUsers: firstStepUsers,
  };
}

export async function getAvailableFunnels(startDate?: string, endDate?: string): Promise<string[]> {
  const steps = await getFunnelSteps(undefined, startDate, endDate);
  return Array.from(new Set(steps.map((s) => s.funnelName)));
}
