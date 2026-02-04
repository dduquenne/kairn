/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";

import { getPageVisits } from "../store-index";

export const dynamic = "force-dynamic";

interface TopPage {
  page: string;
  title: string;
  count: number;
  percentage: number;
}

/**
 * Parse time range string (e.g., "24h", "7d", "30d", "90d") and return start/end dates
 */
function parseTimeRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = new Date(now);
  const startDate = new Date(now);

  const match = range.match(/^(\d+)([hdwmy])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "h": // hours
        startDate.setHours(startDate.getHours() - value);
        break;
      case "d": // days
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        startDate.setDate(startDate.getDate() - value);
        break;
      case "w": // weeks
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        startDate.setDate(startDate.getDate() - value * 7);
        break;
      case "m": // months
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        startDate.setMonth(startDate.getMonth() - value);
        break;
      case "y": // years
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        startDate.setFullYear(startDate.getFullYear() - value);
        break;
    }
  } else {
    // Default: 7 days
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    startDate.setDate(startDate.getDate() - 7);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Generate a human-readable title from a page path
 */
function generateTitle(page: string): string {
  // Remove leading slash and query params
  const path = page.replace(/^\//, "").split("?")[0];

  // Handle home page
  if (!path || path === "/") {
    return "Accueil";
  }

  // Handle common patterns
  const patterns: Record<string, string> = {
    "blog": "Blog",
    "contact": "Contact",
    "about": "À propos",
    "services": "Services",
    "admin": "Administration",
    "hypnose": "Hypnose",
    "tarifs": "Tarifs",
    "rdv": "Rendez-vous",
    "temoignages": "Témoignages",
    "faq": "FAQ",
  };

  // Check for exact matches first
  if (patterns[path]) {
    return patterns[path];
  }

  // Handle blog article paths
  if (path.startsWith("blog/")) {
    const slug = path.replace("blog/", "");
    // Convert slug to title: my-article-title -> My article title
    return slug
      .split("-")
      .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(" ");
  }

  // Default: capitalize first letter and replace hyphens with spaces
  return path
    .split("/")
    .pop()!
    .split("-")
    .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "7d";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const { startDate, endDate } = parseTimeRange(range);

    // Fetch all page visits for the period
    const visits = await getPageVisits(startDate, endDate);

    // Filter out bot visits
    const humanVisits = visits.filter((v) => !v.isBot);

    // Aggregate visits by page
    const pageCountMap = new Map<string, number>();
    for (const visit of humanVisits) {
      const page = visit.page;
      pageCountMap.set(page, (pageCountMap.get(page) || 0) + 1);
    }

    // Calculate total visits
    const totalVisits = humanVisits.length;

    // Convert to array and sort by count
    const topPages: TopPage[] = Array.from(pageCountMap.entries())
      .map(([page, count]) => ({
        page,
        title: generateTitle(page),
        count,
        percentage: totalVisits > 0 ? (count / totalVisits) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return Response.json(
      {
        topPages,
        totalVisits,
        uniquePages: pageCountMap.size,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching top pages:", error);
    return Response.json(
      { error: "Failed to fetch top pages" },
      { status: 500 }
    );
  }
}
