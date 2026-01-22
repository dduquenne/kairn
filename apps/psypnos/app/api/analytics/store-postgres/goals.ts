// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Goal Operations
 */

import { prisma } from "@/lib/db/prisma";
import type { Goal, GoalCompletion } from "../store/types";
import { getPageVisits } from "./page-visits";

// Type alias for where input (workaround for ungenerated Prisma client)
type GoalCompletionWhereInput = {
  timestamp?: { gte?: Date; lte?: Date };
  goalId?: string;
};

/**
 * Prisma Goal record type.
 * Prisma uses `null` for absent optional values, while our Goal type uses `undefined`.
 */
interface GoalRecord {
  id: string;
  name: string;
  type: string;
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
}

/**
 * Prisma GoalCompletion record type.
 */
interface GoalCompletionRecord {
  id: string;
  timestamp: Date;
  sessionId: string;
  goalId: string;
  value: number | null;
}

/**
 * Convert a Prisma GoalRecord to our application Goal type.
 * This handles the null → undefined conversion for optional fields.
 */
function toGoal(record: GoalRecord): Goal {
  return {
    id: record.id,
    name: record.name,
    type: record.type as "destination" | "event" | "duration" | "pages_per_session",
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
 * Convert a Prisma GoalCompletionRecord to our application GoalCompletion type.
 */
function toGoalCompletion(record: GoalCompletionRecord): GoalCompletion {
  return {
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    sessionId: record.sessionId,
    goalId: record.goalId,
    value: record.value ?? undefined,
  };
}

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
  const result = await prisma.goal.create({
    data: {
      name: goal.name,
      type: goal.type,
      destinationUrl: goal.destinationUrl,
      eventCategory: goal.eventCategory,
      eventAction: goal.eventAction,
      eventLabel: goal.eventLabel,
      durationSeconds: goal.durationSeconds,
      comparison: goal.comparison,
      pagesCount: goal.pagesCount,
      value: goal.value,
      enabled: goal.enabled,
    },
  });

  return toGoal(result as GoalRecord);
}

export async function getGoals(): Promise<Goal[]> {
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (goals as GoalRecord[]).map(toGoal);
}

export async function getGoal(id: string): Promise<Goal | undefined> {
  const goal = await prisma.goal.findUnique({ where: { id } });

  if (!goal) return undefined;

  return toGoal(goal as GoalRecord);
}

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
  }>,
): Promise<Goal | null> {
  try {
    const result = await prisma.goal.update({
      where: { id },
      data: updates,
    });

    return toGoal(result as GoalRecord);
  } catch {
    return null;
  }
}

export async function deleteGoal(id: string): Promise<boolean> {
  try {
    await prisma.goal.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function trackGoalCompletion(completion: {
  timestamp: string;
  sessionId: string;
  goalId: string;
  value?: number;
}): Promise<GoalCompletion> {
  const result = await prisma.goalCompletion.create({
    data: {
      timestamp: new Date(completion.timestamp),
      sessionId: completion.sessionId,
      goalId: completion.goalId,
      value: completion.value,
    },
  });

  return toGoalCompletion(result as GoalCompletionRecord);
}

export async function getGoalCompletions(
  goalId?: string,
  startDate?: string,
  endDate?: string,
): Promise<GoalCompletion[]> {
  const where: GoalCompletionWhereInput = {};

  if (goalId) where.goalId = goalId;

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const completions = await prisma.goalCompletion.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return (completions as GoalCompletionRecord[]).map(toGoalCompletion);
}

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
        0,
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
