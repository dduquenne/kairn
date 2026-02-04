/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - BotVisit model not available in Kairn schema
/**
 * Bot Analytics API
 *
 * This endpoint provides bot visit statistics for SEO analytics.
 * It requires admin authentication.
 *
 * @endpoint GET /api/analytics/bots
 */

import { NextRequest, NextResponse } from "next/server";

import { withAdminAuth } from "@/app/api/auth/middleware";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

// Pages statiques du site (correspondant au sitemap)
const STATIC_PAGES = [
  "/",
  "/a-propos",
  "/demande-rendez-vous",
  "/inscription-seminaire",
  "/politique-de-confidentialite",
  "/conditions-utilisation",
  "/blog",
];

// Type for BotVisit record from database
interface BotVisitRecord {
  id: string;
  timestamp: Date;
  botName: string;
  botType: string;
  userAgent: string | null;
  page: string;
  referrer: string | null;
  method: string;
  statusCode: number | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  ipHash: string | null;
}

interface BotStats {
  summary: {
    totalVisits: number;
    uniqueBots: number;
    uniquePages: number;
    lastVisit: string | null;
    // Couverture du site par les bots
    totalSitePages: number;
    crawlCoverage: number; // Pourcentage de pages crawlées
  };
  byType: Array<{
    type: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  byBot: Array<{
    name: string;
    type: string;
    count: number;
    lastVisit: string;
  }>;
  byPage: Array<{
    page: string;
    visits: number;
    uniqueBots: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
    searchEngine: number;
    social: number;
    seoTool: number;
    monitor: number;
    other: number;
  }>;
  recentVisits: Array<{
    id: string;
    timestamp: string;
    botName: string;
    botType: string;
    page: string;
    country: string | null;
  }>;
}

const BOT_TYPE_LABELS: Record<string, string> = {
  search_engine: "Moteurs de recherche",
  social: "Réseaux sociaux",
  seo_tool: "Outils SEO",
  monitor: "Monitoring",
  other: "Autres",
};

export async function GET(request: NextRequest): Promise<Response> {
  // Check admin authentication
  const authResult = await withAdminAuth();
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "30d";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    let dateFrom: Date;
    let dateTo = new Date();

    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
      switch (timeRange) {
        case "24h":
          dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const { prisma } = await import("@/lib/db/prisma");

    // Fetch all visits in the date range
    const visits: BotVisitRecord[] = await prisma.botVisit.findMany({
      where: {
        timestamp: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Calculate summary stats
    const uniqueBots = new Set(visits.map((v) => v.botName)).size;
    const uniquePages = new Set(visits.map((v) => v.page)).size;
    const lastVisit = visits.length > 0 ? visits[0].timestamp.toISOString() : null;

    // Group by bot type
    const byTypeMap = new Map<string, number>();
    visits.forEach((v) => {
      byTypeMap.set(v.botType, (byTypeMap.get(v.botType) || 0) + 1);
    });

    const totalVisits = visits.length;
    const byType = Array.from(byTypeMap.entries())
      .map(([type, count]) => ({
        type,
        label: BOT_TYPE_LABELS[type] || type,
        count,
        percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Group by bot name
    const byBotMap = new Map<string, { type: string; count: number; lastVisit: Date }>();
    visits.forEach((v) => {
      const existing = byBotMap.get(v.botName);
      if (existing) {
        existing.count++;
        if (v.timestamp > existing.lastVisit) {
          existing.lastVisit = v.timestamp;
        }
      } else {
        byBotMap.set(v.botName, {
          type: v.botType,
          count: 1,
          lastVisit: v.timestamp,
        });
      }
    });

    const byBot = Array.from(byBotMap.entries())
      .map(([name, data]) => ({
        name,
        type: data.type,
        count: data.count,
        lastVisit: data.lastVisit.toISOString(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Group by page
    const byPageMap = new Map<string, { visits: number; bots: Set<string> }>();
    visits.forEach((v) => {
      const existing = byPageMap.get(v.page);
      if (existing) {
        existing.visits++;
        existing.bots.add(v.botName);
      } else {
        byPageMap.set(v.page, { visits: 1, bots: new Set([v.botName]) });
      }
    });

    const byPage = Array.from(byPageMap.entries())
      .map(([page, data]) => ({
        page,
        visits: data.visits,
        uniqueBots: data.bots.size,
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 20);

    // Build timeline (group by day)
    const timelineMap = new Map<
      string,
      {
        count: number;
        searchEngine: number;
        social: number;
        seoTool: number;
        monitor: number;
        other: number;
      }
    >();

    visits.forEach((v) => {
      const dateKey = v.timestamp.toISOString().split("T")[0];
      const existing = timelineMap.get(dateKey) || {
        count: 0,
        searchEngine: 0,
        social: 0,
        seoTool: 0,
        monitor: 0,
        other: 0,
      };

      existing.count++;
      switch (v.botType) {
        case "search_engine":
          existing.searchEngine++;
          break;
        case "social":
          existing.social++;
          break;
        case "seo_tool":
          existing.seoTool++;
          break;
        case "monitor":
          existing.monitor++;
          break;
        default:
          existing.other++;
      }

      timelineMap.set(dateKey, existing);
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get recent visits
    const recentVisits = visits.slice(0, 50).map((v) => ({
      id: v.id,
      timestamp: v.timestamp.toISOString(),
      botName: v.botName,
      botType: v.botType,
      page: v.page,
      country: v.country,
    }));

    // Calculate crawl coverage (pages crawled vs total site pages)
    const blogPosts = getAllPosts();
    const blogPages = blogPosts.map((post) => `/blog/${post.slug}`);
    const allSitePages = [...STATIC_PAGES, ...blogPages];
    const totalSitePages = allSitePages.length;

    // Get unique pages that have been crawled
    const crawledPages = new Set(visits.map((v) => v.page));
    const crawledSitePages = allSitePages.filter((page) => crawledPages.has(page));
    const crawlCoverage = totalSitePages > 0
      ? Math.round((crawledSitePages.length / totalSitePages) * 100)
      : 0;

    const stats: BotStats = {
      summary: {
        totalVisits,
        uniqueBots,
        uniquePages,
        lastVisit,
        totalSitePages,
        crawlCoverage,
      },
      byType,
      byBot,
      byPage,
      timeline,
      recentVisits,
    };

    return Response.json(stats);
  } catch (error) {
    console.error("[Bot Analytics API] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
