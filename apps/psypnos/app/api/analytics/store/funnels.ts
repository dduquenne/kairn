/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Funnel Operations
 */

import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";
import type { FunnelStep } from "./types";

export async function trackFunnelStep(step: Omit<FunnelStep, "id">): Promise<FunnelStep> {
  const data = await readAnalyticsData();
  const id = generateId("fs");
  const newStep = { ...step, id };
  data.funnelSteps.push(newStep);
  await writeAnalyticsData(data);
  return newStep;
}

export async function getFunnelSteps(
  funnelName?: string,
  startDate?: string,
  endDate?: string,
): Promise<FunnelStep[]> {
  const data = await readAnalyticsData();
  let steps = data.funnelSteps;

  if (funnelName) {
    steps = steps.filter((s) => s.funnelName === funnelName);
  }

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    steps = steps.filter((s) => {
      const sTime = new Date(s.timestamp).getTime();
      return sTime >= start && sTime <= end;
    });
  }

  return steps;
}

export async function getFunnelAnalysis(
  funnelName: string,
  startDate?: string,
  endDate?: string,
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
    const prevStepUsers = index > 0 ? (stepUsers.get(sortedStepOrders[index - 1])?.size || 0) : usersAtStep;
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

  const lastStepUsers = stepUsers.get(sortedStepOrders[sortedStepOrders.length - 1])?.size || 0;

  return {
    funnelName,
    steps: analysisSteps,
    overallConversion: firstStepUsers > 0 ? (lastStepUsers / firstStepUsers) * 100 : 0,
    totalUsers: firstStepUsers,
  };
}

export async function getAvailableFunnels(
  startDate?: string,
  endDate?: string,
): Promise<string[]> {
  const steps = await getFunnelSteps(undefined, startDate, endDate);
  return Array.from(new Set(steps.map((s) => s.funnelName)));
}
