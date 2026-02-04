/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - BlogAnalytics model not available in Kairn schema
import { PrismaClient } from "@prisma/client";
import type { NextRequest } from "next/server";

import { withAdminAuth } from "../../auth/middleware";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const { purgeDate } = await request.json();

    if (!purgeDate) {
      return Response.json(
        { error: "purgeDate is required" },
        { status: 400 }
      );
    }

    // Parse the purge date and set it to end of day (23:59:59.999)
    const purgeDateObj = new Date(purgeDate);
    purgeDateObj.setHours(23, 59, 59, 999);

    if (isNaN(purgeDateObj.getTime())) {
      return Response.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Count records before deletion
    const countsBefore = await Promise.all([
      prisma.pageVisit.count(),
      prisma.sectionTime.count(),
      prisma.conversionEvent.count(),
      prisma.customEvent.count(),
      prisma.blogAnalytics.count(),
      prisma.blogCtaClick.count(),
      prisma.blogFaqClick.count(),
      prisma.visitorGeolocation.count(),
      prisma.goalCompletion.count(),
      prisma.funnelStep.count(),
      prisma.alertHistory.count(),
      prisma.anomaly.count(),
      prisma.dailySummary.count(),
      prisma.trafficSourceSummary.count(),
      prisma.sectionSummary.count(),
    ]);

    // Delete all records with timestamp <= purgeDate using deleteMany
    const deletionResults = await Promise.all([
      prisma.pageVisit.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.sectionTime.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.conversionEvent.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.customEvent.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.blogAnalytics.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.blogCtaClick.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.blogFaqClick.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.visitorGeolocation.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.goalCompletion.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.funnelStep.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.alertHistory.deleteMany({
        where: {
          triggeredAt: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.anomaly.deleteMany({
        where: {
          timestamp: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.dailySummary.deleteMany({
        where: {
          date: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.trafficSourceSummary.deleteMany({
        where: {
          date: {
            lte: purgeDateObj,
          },
        },
      }),
      prisma.sectionSummary.deleteMany({
        where: {
          date: {
            lte: purgeDateObj,
          },
        },
      }),
    ]);

    // Count records after deletion
    const countsAfter = await Promise.all([
      prisma.pageVisit.count(),
      prisma.sectionTime.count(),
      prisma.conversionEvent.count(),
      prisma.customEvent.count(),
      prisma.blogAnalytics.count(),
      prisma.blogCtaClick.count(),
      prisma.blogFaqClick.count(),
      prisma.visitorGeolocation.count(),
      prisma.goalCompletion.count(),
      prisma.funnelStep.count(),
      prisma.alertHistory.count(),
      prisma.anomaly.count(),
      prisma.dailySummary.count(),
      prisma.trafficSourceSummary.count(),
      prisma.sectionSummary.count(),
    ]);

    const [
      deletedPageVisits,
      deletedSectionTimes,
      deletedConversionEvents,
      deletedCustomEvents,
      deletedBlogAnalytics,
      deletedBlogCtaClicks,
      deletedBlogFaqClicks,
      deletedVisitorGeolocations,
      deletedGoalCompletions,
      deletedFunnelSteps,
      deletedAlertHistory,
      deletedAnomalies,
      deletedDailySummaries,
      deletedTrafficSourceSummaries,
      deletedSectionSummaries,
    ] = deletionResults.map((result) => result.count);

    const totalDeleted =
      deletedPageVisits +
      deletedSectionTimes +
      deletedConversionEvents +
      deletedCustomEvents +
      deletedBlogAnalytics +
      deletedBlogCtaClicks +
      deletedBlogFaqClicks +
      deletedVisitorGeolocations +
      deletedGoalCompletions +
      deletedFunnelSteps +
      deletedAlertHistory +
      deletedAnomalies +
      deletedDailySummaries +
      deletedTrafficSourceSummaries +
      deletedSectionSummaries;

    return Response.json(
      {
        success: true,
        message: `Purged ${totalDeleted} records up to and including ${purgeDate}`,
        deletedRecords: {
          pageVisits: deletedPageVisits,
          sectionTimes: deletedSectionTimes,
          conversionEvents: deletedConversionEvents,
          customEvents: deletedCustomEvents,
          blogAnalytics: deletedBlogAnalytics,
          blogCtaClicks: deletedBlogCtaClicks,
          blogFaqClicks: deletedBlogFaqClicks,
          visitorGeolocations: deletedVisitorGeolocations,
          goalCompletions: deletedGoalCompletions,
          funnelSteps: deletedFunnelSteps,
          alertHistory: deletedAlertHistory,
          anomalies: deletedAnomalies,
          dailySummaries: deletedDailySummaries,
          trafficSourceSummaries: deletedTrafficSourceSummaries,
          sectionSummaries: deletedSectionSummaries,
          total: totalDeleted,
        },
        remainingRecords: {
          pageVisits: countsAfter[0],
          sectionTimes: countsAfter[1],
          conversionEvents: countsAfter[2],
          customEvents: countsAfter[3],
          blogAnalytics: countsAfter[4],
          blogCtaClicks: countsAfter[5],
          blogFaqClicks: countsAfter[6],
          visitorGeolocations: countsAfter[7],
          goalCompletions: countsAfter[8],
          funnelSteps: countsAfter[9],
          alertHistory: countsAfter[10],
          anomalies: countsAfter[11],
          dailySummaries: countsAfter[12],
          trafficSourceSummaries: countsAfter[13],
          sectionSummaries: countsAfter[14],
          total: countsAfter.reduce((sum, count) => sum + count, 0),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error purging analytics data:", error);
    return Response.json(
      { error: "Failed to purge analytics data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return Response.json(
    {
      message: "POST with { purgeDate: string } to purge data up to and including that date (ISO format)",
    },
    { status: 200 }
  );
}
