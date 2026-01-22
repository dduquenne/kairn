// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Marketing Attribution
 */

import { getPageVisits } from "./page-visits";
import { getConversionEvents } from "./conversions";

export async function getMarketingAttribution(
  startDate?: string,
  endDate?: string,
): Promise<Array<{
  source: string;
  medium: string;
  campaign?: string;
  firstTouchConversions: number;
  lastTouchConversions: number;
  linearConversions: number;
  timeDecayConversions: number;
  uShapedConversions: number;
  totalTouchpoints: number;
  uniqueSessions: number;
}>> {
  const visits = await getPageVisits(startDate, endDate);
  const events = await getConversionEvents(startDate, endDate);

  const convertingSessions = new Set(events.filter((e) => e.completed).map((e) => e.sessionId));

  const sessionVisits = new Map<string, typeof visits>();
  visits.forEach((visit) => {
    if (!sessionVisits.has(visit.sessionId)) {
      sessionVisits.set(visit.sessionId, []);
    }
    sessionVisits.get(visit.sessionId)!.push(visit);
  });

  const attributionMap = new Map<string, {
    source: string;
    medium: string;
    campaign?: string;
    firstTouch: number;
    lastTouch: number;
    linear: number;
    timeDecay: number;
    uShaped: number;
    touchpoints: number;
    sessions: Set<string>;
  }>();

  convertingSessions.forEach((sessionId) => {
    const sessionData = sessionVisits.get(sessionId);
    if (!sessionData || sessionData.length === 0) return;

    const sortedVisits = [...sessionData].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const touchpoints: Array<{ source: string; medium: string; campaign?: string; timestamp: number }> = [];
    const seenTouchpoints = new Set<string>();

    sortedVisits.forEach((visit) => {
      const source = visit.utmSource || visit.referrerDomain || 'direct';
      const medium = visit.utmMedium || 'none';
      const key = `${source}|${medium}|${visit.utmCampaign || ''}`;

      if (!seenTouchpoints.has(key)) {
        seenTouchpoints.add(key);
        touchpoints.push({
          source,
          medium,
          campaign: visit.utmCampaign,
          timestamp: new Date(visit.timestamp).getTime(),
        });
      }
    });

    if (touchpoints.length === 0) return;

    const numTouchpoints = touchpoints.length;
    const lastTimestamp = touchpoints[numTouchpoints - 1].timestamp;

    touchpoints.forEach((tp, index) => {
      const key = `${tp.source}|${tp.medium}|${tp.campaign || ''}`;

      if (!attributionMap.has(key)) {
        attributionMap.set(key, {
          source: tp.source,
          medium: tp.medium,
          campaign: tp.campaign,
          firstTouch: 0,
          lastTouch: 0,
          linear: 0,
          timeDecay: 0,
          uShaped: 0,
          touchpoints: 0,
          sessions: new Set(),
        });
      }

      const attr = attributionMap.get(key)!;
      attr.touchpoints++;
      attr.sessions.add(sessionId);

      // First-touch: 100% to first touchpoint
      if (index === 0) {
        attr.firstTouch += 1;
      }

      // Last-touch: 100% to last touchpoint
      if (index === numTouchpoints - 1) {
        attr.lastTouch += 1;
      }

      // Linear: Equal credit to all touchpoints
      attr.linear += 1 / numTouchpoints;

      // Time-decay: More recent = more credit (half-life of 7 days)
      const daysDiff = (lastTimestamp - tp.timestamp) / (1000 * 60 * 60 * 24);
      const decayWeight = Math.pow(0.5, daysDiff / 7);
      const totalDecayWeight = touchpoints.reduce((sum, t) => {
        const d = (lastTimestamp - t.timestamp) / (1000 * 60 * 60 * 24);
        return sum + Math.pow(0.5, d / 7);
      }, 0);
      attr.timeDecay += decayWeight / totalDecayWeight;

      // U-shaped: 40% first, 40% last, 20% distributed among middle
      if (numTouchpoints === 1) {
        attr.uShaped += 1;
      } else if (numTouchpoints === 2) {
        attr.uShaped += 0.5;
      } else {
        if (index === 0) {
          attr.uShaped += 0.4;
        } else if (index === numTouchpoints - 1) {
          attr.uShaped += 0.4;
        } else {
          attr.uShaped += 0.2 / (numTouchpoints - 2);
        }
      }
    });
  });

  return Array.from(attributionMap.values())
    .map((attr) => ({
      source: attr.source,
      medium: attr.medium,
      campaign: attr.campaign,
      firstTouchConversions: Math.round(attr.firstTouch * 100) / 100,
      lastTouchConversions: Math.round(attr.lastTouch * 100) / 100,
      linearConversions: Math.round(attr.linear * 100) / 100,
      timeDecayConversions: Math.round(attr.timeDecay * 100) / 100,
      uShapedConversions: Math.round(attr.uShaped * 100) / 100,
      totalTouchpoints: attr.touchpoints,
      uniqueSessions: attr.sessions.size,
    }))
    .sort((a, b) => b.firstTouchConversions - a.firstTouchConversions);
}
