/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Goal Operations
 */

import { readAnalyticsData, writeAnalyticsData, generateId } from "./cache";
import { getPageVisits } from "./page-visits";
import type { Goal, GoalCompletion } from "./types";

export async function createGoal(goal: Omit<Goal, "id" | "createdAt">): Promise<Goal> {
  const data = await readAnalyticsData();
  const id = generateId("goal");
  const newGoal: Goal = { ...goal, id, createdAt: new Date().toISOString() };
  data.goals.push(newGoal);
  await writeAnalyticsData(data);
  return newGoal;
}

export async function getGoals(): Promise<Goal[]> {
  const data = await readAnalyticsData();
  return data.goals;
}

export async function getGoal(id: string): Promise<Goal | undefined> {
  const data = await readAnalyticsData();
  return data.goals.find((g) => g.id === id);
}

export async function updateGoal(id: string, updates: Partial<Omit<Goal, "id" | "createdAt">>): Promise<Goal | null> {
  const data = await readAnalyticsData();
  const index = data.goals.findIndex((g) => g.id === id);
  if (index === -1) return null;

  data.goals[index] = { ...data.goals[index], ...updates };
  await writeAnalyticsData(data);
  return data.goals[index];
}

export async function deleteGoal(id: string): Promise<boolean> {
  const data = await readAnalyticsData();
  const index = data.goals.findIndex((g) => g.id === id);
  if (index === -1) return false;

  data.goals.splice(index, 1);
  data.goalCompletions = data.goalCompletions.filter((gc) => gc.goalId !== id);
  await writeAnalyticsData(data);
  return true;
}

export async function trackGoalCompletion(completion: Omit<GoalCompletion, "id">): Promise<GoalCompletion> {
  const data = await readAnalyticsData();
  const id = generateId("gc");
  const newCompletion = { ...completion, id };
  data.goalCompletions.push(newCompletion);
  await writeAnalyticsData(data);
  return newCompletion;
}

export async function getGoalCompletions(
  goalId?: string,
  startDate?: string,
  endDate?: string,
): Promise<GoalCompletion[]> {
  const data = await readAnalyticsData();
  let completions = data.goalCompletions;

  if (goalId) {
    completions = completions.filter((gc) => gc.goalId === goalId);
  }

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    completions = completions.filter((gc) => {
      const gcTime = new Date(gc.timestamp).getTime();
      return gcTime >= start && gcTime <= end;
    });
  }

  return completions;
}

export async function getGoalsSummary(
  startDate?: string,
  endDate?: string,
): Promise<Array<{
  goal: Goal;
  completions: number;
  completionRate: number;
  totalValue: number;
  uniqueSessions: number;
}>> {
  const goals = await getGoals();
  const completions = await getGoalCompletions(undefined, startDate, endDate);
  const visits = await getPageVisits(startDate, endDate);

  const totalSessions = new Set(visits.map((v) => v.sessionId)).size;

  return goals.filter((g) => g.enabled).map((goal) => {
    const goalCompletions = completions.filter((gc) => gc.goalId === goal.id);
    const uniqueSessions = new Set(goalCompletions.map((gc) => gc.sessionId)).size;
    const totalValue = goalCompletions.reduce((sum, gc) => sum + (gc.value || goal.value || 0), 0);

    return {
      goal,
      completions: goalCompletions.length,
      completionRate: totalSessions > 0 ? (uniqueSessions / totalSessions) * 100 : 0,
      totalValue,
      uniqueSessions,
    };
  });
}
