/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Cohort Analysis
 */

import { getConversionEvents } from "./conversions";
import { getPageVisits } from "./page-visits";
import { getSectionTimes } from "./section-times";

export async function getCohortAnalysis(
  cohortBy: 'week' | 'month' | 'utm_source' | 'referrer' | 'device' = 'week',
  startDate?: string,
  endDate?: string,
): Promise<Array<{
  cohortName: string;
  acquisitionDate?: string;
  userCount: number;
  retentionDay1: number;
  retentionDay7: number;
  retentionDay30: number;
  conversions: number;
  conversionRate: number;
  averageSessionDuration: number;
  averagePageViews: number;
}>> {
  const visits = await getPageVisits(startDate, endDate);
  const times = await getSectionTimes(startDate, endDate);
  const events = await getConversionEvents(startDate, endDate);

  const sessionCohorts = new Map<string, Set<string>>();
  const sessionFirstVisit = new Map<string, Date>();
  const sessionLastVisit = new Map<string, Date>();
  const sessionPageViews = new Map<string, number>();

  visits.forEach((visit) => {
    const visitDate = new Date(visit.timestamp);
    let cohortKey = '';

    switch (cohortBy) {
      case 'week': {
        const tempDate = new Date(visitDate);
        tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
        const yearStart = new Date(tempDate.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        cohortKey = `${visitDate.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        break;
      }
      case 'month':
        cohortKey = `${visitDate.getFullYear()}-${(visitDate.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'utm_source':
        cohortKey = visit.utmSource || 'direct';
        break;
      case 'referrer':
        cohortKey = visit.referrerDomain || 'direct';
        break;
      case 'device':
        cohortKey = visit.deviceType || 'unknown';
        break;
    }

    if (!sessionCohorts.has(cohortKey)) {
      sessionCohorts.set(cohortKey, new Set());
    }
    sessionCohorts.get(cohortKey)!.add(visit.sessionId);

    const currentFirst = sessionFirstVisit.get(visit.sessionId);
    if (!currentFirst || visitDate < currentFirst) {
      sessionFirstVisit.set(visit.sessionId, visitDate);
    }

    const currentLast = sessionLastVisit.get(visit.sessionId);
    if (!currentLast || visitDate > currentLast) {
      sessionLastVisit.set(visit.sessionId, visitDate);
    }

    sessionPageViews.set(visit.sessionId, (sessionPageViews.get(visit.sessionId) || 0) + 1);
  });

  const sessionDurations = new Map<string, number>();
  times.forEach((time) => {
    sessionDurations.set(time.sessionId, (sessionDurations.get(time.sessionId) || 0) + time.timeSpent);
  });

  const sessionConversions = new Set<string>();
  events.filter((e) => e.completed).forEach((e) => sessionConversions.add(e.sessionId));

  return Array.from(sessionCohorts.entries())
    .map(([cohortName, sessions]) => {
      const sessionsArray = Array.from(sessions);
      const userCount = sessionsArray.length;

      let retentionDay1 = 0;
      let retentionDay7 = 0;
      let retentionDay30 = 0;

      sessionsArray.forEach((sessionId) => {
        const firstVisit = sessionFirstVisit.get(sessionId);
        const lastVisit = sessionLastVisit.get(sessionId);

        if (firstVisit && lastVisit) {
          const daysDiff = Math.floor((lastVisit.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 1) retentionDay1++;
          if (daysDiff >= 7) retentionDay7++;
          if (daysDiff >= 30) retentionDay30++;
        }
      });

      const conversions = sessionsArray.filter((s) => sessionConversions.has(s)).length;
      const totalDuration = sessionsArray.reduce((sum, s) => sum + (sessionDurations.get(s) || 0), 0);
      const totalPageViews = sessionsArray.reduce((sum, s) => sum + (sessionPageViews.get(s) || 0), 0);

      return {
        cohortName,
        acquisitionDate: cohortBy === 'week' || cohortBy === 'month' ? cohortName : undefined,
        userCount,
        retentionDay1: userCount > 0 ? (retentionDay1 / userCount) * 100 : 0,
        retentionDay7: userCount > 0 ? (retentionDay7 / userCount) * 100 : 0,
        retentionDay30: userCount > 0 ? (retentionDay30 / userCount) * 100 : 0,
        conversions,
        conversionRate: userCount > 0 ? (conversions / userCount) * 100 : 0,
        averageSessionDuration: userCount > 0 ? totalDuration / userCount : 0,
        averagePageViews: userCount > 0 ? totalPageViews / userCount : 0,
      };
    })
    .sort((a, b) => b.userCount - a.userCount);
}
