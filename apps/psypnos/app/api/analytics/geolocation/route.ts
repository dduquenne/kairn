/**
 * Geolocation Analytics API Route
 *
 * GET /api/analytics/geolocation
 * Retrieves visitor geolocation data aggregated by country, region, and city.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isMockMode, generateMockGeolocationData, logDataMode } from "@/lib/pwaDataMode";
import { getCurrentSiteId } from "../store-postgres/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Log the data mode
    logDataMode();

    // If in mock mode, return simulated data
    if (isMockMode()) {
      console.log("📊 [Geolocation Analytics] Using MOCK data");
      const mockData = generateMockGeolocationData();
      return NextResponse.json(mockData, { status: 200 });
    }

    // Real mode - fetch data from VisitorGeolocation table
    console.log("📊 [Geolocation Analytics] Using REAL data");

    const siteId = getCurrentSiteId();

    // Calculate date filters
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    let startDate = startDateParam ? new Date(startDateParam) : new Date();

    if (!startDateParam) {
      // Default: last 30 days
      startDate.setDate(endDate.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all geolocation data in the period
    const geolocations = await prisma.visitorGeolocation.findMany({
      where: {
        siteId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        sessionId: true,
        country: true,
        countryCode: true,
        region: true,
        regionCode: true,
        city: true,
        latitude: true,
        longitude: true,
        timestamp: true,
      },
    });

    // Aggregate by country
    const countryStats: Record<string, { count: number; countryCode: string }> = {};
    // Aggregate by region
    const regionStats: Record<
      string,
      { count: number; country: string; countryCode: string }
    > = {};
    // Aggregate by city
    const cityStats: Record<
      string,
      {
        count: number;
        country: string;
        countryCode: string;
        region: string | null;
        latitude: number | null;
        longitude: number | null;
      }
    > = {};
    // Set for counting unique visitors
    const uniqueVisitors = new Set<string>();

    for (const geo of geolocations) {
      uniqueVisitors.add(geo.sessionId);

      // Count by country
      if (!countryStats[geo.country]) {
        countryStats[geo.country] = { count: 0, countryCode: geo.countryCode };
      }
      const countryStat = countryStats[geo.country];
      if (countryStat) {
        countryStat.count++;
      }

      // Count by region
      if (geo.region) {
        const regionKey = `${geo.country}|${geo.region}`;
        if (!regionStats[regionKey]) {
          regionStats[regionKey] = {
            count: 0,
            country: geo.country,
            countryCode: geo.countryCode,
          };
        }
        regionStats[regionKey].count++;
      }

      // Count by city
      if (geo.city) {
        const cityKey = `${geo.country}|${geo.region || ""}|${geo.city}`;
        if (!cityStats[cityKey]) {
          cityStats[cityKey] = {
            count: 0,
            country: geo.country,
            countryCode: geo.countryCode,
            region: geo.region,
            latitude: geo.latitude,
            longitude: geo.longitude,
          };
        }
        cityStats[cityKey].count++;
      }
    }

    // Format results
    const byCountry = Object.entries(countryStats)
      .map(([country, data]) => ({
        country,
        countryCode: data.countryCode,
        visitors: data.count,
      }))
      .sort((a, b) => b.visitors - a.visitors);

    const byRegion = Object.entries(regionStats)
      .map(([key, data]) => {
        const [, region] = key.split("|");
        return {
          region,
          country: data.country,
          countryCode: data.countryCode,
          visitors: data.count,
        };
      })
      .sort((a, b) => b.visitors - a.visitors);

    const byCity = Object.entries(cityStats)
      .map(([key, data]) => {
        const [, , city] = key.split("|");
        return {
          city,
          country: data.country,
          countryCode: data.countryCode,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
          visitors: data.count,
        };
      })
      .sort((a, b) => b.visitors - a.visitors);

    // Top 10 cities
    const topCities = byCity.slice(0, 10);

    return NextResponse.json(
      {
        totalVisitors: uniqueVisitors.size,
        byCountry,
        byRegion,
        byCity,
        topCities,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching geolocation data:", error);
    return NextResponse.json(
      { error: "Failed to fetch geolocation data" },
      { status: 500 }
    );
  }
}
