/**
 * PostgreSQL Goal Operations
 *
 * Uses the AnalyticsGoal and AnalyticsGoalCompletion models.
 */

import { GoalType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { Goal, GoalCompletion } from "../store/types";

import { getPageVisits } from "./page-visits";
import { getCurrentSiteId } from "./utils";

/**
 * Maps internal goal type strings to Prisma GoalType enum
 */
function toGoalType(type: string): GoalType {
  const mapping: Record<string, GoalType> = {
    destination: GoalType.DESTINATION,
    event: GoalType.EVENT,
    duration: GoalType.DURATION,
    pages_per_session: GoalType.PAGES_PER_SESSION,
  };
  return mapping[type] || GoalType.EVENT;
}

/**
 * Maps Prisma GoalType enum to internal type string
 */
function fromGoalType(type: GoalType): string {
  const mapping: Record<GoalType, string> = {
    [GoalType.DESTINATION]: "destination",
    [GoalType.EVENT]: "event",
    [GoalType.DURATION]: "duration",
    [GoalType.PAGES_PER_SESSION]: "pages_per_session",
  };
  return mapping[type] || "event";
}

/**
 * Converts a Prisma AnalyticsGoal record to Goal type
 */
function toGoal(record: {
  id: string;
  name: string;
  type: GoalType;
  destinationUrl: string | null;
  eventCategory: string | null;
  eventAction: string | null;
  eventLabel: string | null;
  durationSeconds: number | null;
  comparison: string | null;
  pagesCount: number | null;
  value: number | null;
  enabled: boolean;
  createdAt: Date;
}): Goal {
  return {
    id: record.id,
    name: record.name,
    type: fromGoalType(record.type) as "destination" | "event" | "duration" | "pages_per_session",
    destinationUrl: record.destinationUrl ?? undefined,
    eventCategory: record.eventCategory ?? undefined,
    eventAction: record.eventAction ?? undefined,
    eventLabel: record.eventLabel ?? undefined,
    durationSeconds: record.durationSeconds ?? undefined,
    comparison: (record.comparison as "greater_than" | "less_than") ?? undefined,
    pagesCount: record.pagesCount ?? undefined,
    value: record.value ?? undefined,
    enabled: record.enabled,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Converts a Prisma AnalyticsGoalCompletion record to GoalCompletion type
 */
function toGoalCompletion(record: {
  id: string;
  timestamp: Date;
  sessionId: string;
  goalId: string;
  value: number | null;
}): GoalCompletion {
  return {
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    sessionId: record.sessionId,
    goalId: record.goalId,
    value: record.value ?? undefined,
  };
}

/**
 * Create a new goal
 */
export async function createGoal(goal: {
  name: string;
  type: "destination" | "event" | "duration" | "pages_per_session";
  destinationUrl?: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  durationSeconds?: number;
  comparison?: "greater_than" | "less_than";
  pagesCount?: number;
  value?: number;
  enabled: boolean;
}): Promise<Goal> {
  const siteId = getCurrentSiteId();

  const result = await prisma.analyticsGoal.create({
    data: {
      name: goal.name,
      type: toGoalType(goal.type),
      destinationUrl: goal.destinationUrl,
      eventCategory: goal.eventCategory,
      eventAction: goal.eventAction,
      eventLabel: goal.eventLabel,
      durationSeconds: goal.durationSeconds,
      comparison: goal.comparison,
      pagesCount: goal.pagesCount,
      value: goal.value,
      enabled: goal.enabled,
      siteId,
    },
  });

  return toGoal(result);
}

/**
 * Get all goals
 */
export async function getGoals(): Promise<Goal[]> {
  const siteId = getCurrentSiteId();

  const goals = await prisma.analyticsGoal.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });

  return goals.map(toGoal);
}

/**
 * Get a single goal by ID
 */
export async function getGoal(id: string): Promise<Goal | undefined> {
  const goal = await prisma.analyticsGoal.findUnique({
    where: { id },
  });

  if (!goal) return undefined;

  return toGoal(goal);
}

/**
 * Update a goal
 */
export async function updateGoal(
  id: string,
  updates: Partial<{
    name: string;
    type: "destination" | "event" | "duration" | "pages_per_session";
    destinationUrl?: string;
    eventCategory?: string;
    eventAction?: string;
    eventLabel?: string;
    durationSeconds?: number;
    comparison?: "greater_than" | "less_than";
    pagesCount?: number;
    value?: number;
    enabled: boolean;
  }>
): Promise<Goal | null> {
  try {
    const data: Record<string, unknown> = { ...updates };

    // Convert type if provided
    if (updates.type) {
      data.type = toGoalType(updates.type);
    }

    const result = await prisma.analyticsGoal.update({
      where: { id },
      data,
    });

    return toGoal(result);
  } catch {
    return null;
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(id: string): Promise<boolean> {
  try {
    await prisma.analyticsGoal.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Track a goal completion
 */
export async function trackGoalCompletion(completion: {
  timestamp: string;
  sessionId: string;
  goalId: string;
  value?: number;
}): Promise<GoalCompletion> {
  const result = await prisma.analyticsGoalCompletion.create({
    data: {
      timestamp: new Date(completion.timestamp),
      sessionId: completion.sessionId,
      goalId: completion.goalId,
      value: completion.value,
    },
  });

  return toGoalCompletion(result);
}

/**
 * Get goal completions
 */
export async function getGoalCompletions(
  goalId?: string,
  startDate?: string,
  endDate?: string
): Promise<GoalCompletion[]> {
  const where: {
    goalId?: string;
    timestamp?: { gte?: Date; lte?: Date };
  } = {};

  if (goalId) where.goalId = goalId;

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const completions = await prisma.analyticsGoalCompletion.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return completions.map(toGoalCompletion);
}

/**
 * Get goals summary with completion stats
 */
export async function getGoalsSummary(startDate?: string, endDate?: string) {
  const [goals, completions, visits] = await Promise.all([
    getGoals(),
    getGoalCompletions(undefined, startDate, endDate),
    getPageVisits(startDate, endDate),
  ]);

  const totalSessions = new Set(visits.map((v) => v.sessionId)).size;

  return goals
    .filter((g) => g.enabled)
    .map((goal) => {
      const goalCompletions = completions.filter((gc) => gc.goalId === goal.id);
      const uniqueSessions = new Set(goalCompletions.map((gc) => gc.sessionId)).size;
      const totalValue = goalCompletions.reduce(
        (sum, gc) => sum + (gc.value || goal.value || 0),
        0
      );

      return {
        goal,
        completions: goalCompletions.length,
        completionRate: totalSessions > 0 ? (uniqueSessions / totalSessions) * 100 : 0,
        totalValue,
        uniqueSessions,
      };
    });
}
