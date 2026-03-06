/**
 * PostgreSQL Cohort Analysis
 *
 * Performs cohort analysis by grouping users based on acquisition date,
 * traffic source, referrer, or device type.
 */

import { getAnalyticsContext } from '../context';
import { ANALYTICS_CACHE_KEYS, ANALYTICS_CACHE_TTL } from '../types';

import { getConversionEvents } from './conversions';
import { getPageVisits } from './page-visits';
import { getSectionTimes } from './section-times';

/** Get cohort analysis grouped by the specified dimension */
export async function getCohortAnalysis(
  cohortBy: 'week' | 'month' | 'utm_source' | 'referrer' | 'device' = 'week',
  startDate?: string,
  endDate?: string
) {
  const { cache } = getAnalyticsContext();
  const cacheKey = cache.buildKey(ANALYTICS_CACHE_KEYS.COHORTS, {
    cohortBy,
    start: startDate,
    end: endDate,
  });

  return cache.getCached(
    cacheKey,
    async () => {
      const [visits, times, events] = await Promise.all([
        getPageVisits(startDate, endDate),
        getSectionTimes(startDate, endDate),
        getConversionEvents(startDate, endDate),
      ]);

      const sessionCohorts = new Map<string, Set<string>>();
      const sessionFirstVisit = new Map<string, Date>();
      const sessionLastVisit = new Map<string, Date>();
      const sessionPageViews = new Map<string, number>();

      visits.forEach(visit => {
        const visitDate = new Date(visit.timestamp);
        let cohortKey = '';

        switch (cohortBy) {
          case 'week': {
            const tempDate = new Date(visitDate);
            tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
            const yearStart = new Date(tempDate.getFullYear(), 0, 1);
            const weekNum = Math.ceil(
              ((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
            );
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

        const existing = sessionCohorts.get(cohortKey);
        if (existing) {
          existing.add(visit.sessionId);
        } else {
          sessionCohorts.set(cohortKey, new Set([visit.sessionId]));
        }

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
      times.forEach(time => {
        sessionDurations.set(
          time.sessionId,
          (sessionDurations.get(time.sessionId) || 0) + time.timeSpent
        );
      });

      const sessionConversions = new Set(events.filter(e => e.completed).map(e => e.sessionId));

      return Array.from(sessionCohorts.entries())
        .map(([cohortName, sessions]) => {
          const sessionsArray = Array.from(sessions);
          const userCount = sessionsArray.length;

          let retentionDay1 = 0;
          let retentionDay7 = 0;
          let retentionDay30 = 0;

          sessionsArray.forEach(sessionId => {
            const firstVisit = sessionFirstVisit.get(sessionId);
            const lastVisit = sessionLastVisit.get(sessionId);

            if (firstVisit && lastVisit) {
              const daysDiff = Math.floor(
                (lastVisit.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysDiff >= 1) retentionDay1++;
              if (daysDiff >= 7) retentionDay7++;
              if (daysDiff >= 30) retentionDay30++;
            }
          });

          const conversions = sessionsArray.filter(s => sessionConversions.has(s)).length;
          const totalDuration = sessionsArray.reduce(
            (sum, s) => sum + (sessionDurations.get(s) || 0),
            0
          );
          const totalPageViews = sessionsArray.reduce(
            (sum, s) => sum + (sessionPageViews.get(s) || 0),
            0
          );

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
    },
    ANALYTICS_CACHE_TTL.LONG
  );
}
