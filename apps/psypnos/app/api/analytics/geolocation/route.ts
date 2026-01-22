// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isMockMode, generateMockGeolocationData, logDataMode } from '@/lib/pwaDataMode';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/geolocation
 * Récupère les données de géolocalisation des visiteurs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Log le mode de données
    logDataMode();

    // Si en mode mock, retourner des données simulées
    if (isMockMode()) {
      console.log('📊 [Geolocation Analytics] Using MOCK data');
      const mockData = generateMockGeolocationData();
      return NextResponse.json(mockData, { status: 200 });
    }

    // Mode réel - récupérer les vraies données depuis VisitorGeolocation
    console.log('📊 [Geolocation Analytics] Using REAL data');

    // Calculer les dates de filtrage
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    let startDate = startDateParam ? new Date(startDateParam) : new Date();

    if (!startDateParam) {
      // Par défaut, 30 derniers jours
      startDate.setDate(endDate.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Récupérer toutes les données de géolocalisation dans la période
    const geolocations = await prisma.visitorGeolocation.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
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
        isp: true,
        timestamp: true
      }
    });

    // Agréger par pays
    const countryStats: Record<string, { count: number; countryCode: string }> = {};
    // Agréger par région
    const regionStats: Record<string, { count: number; country: string; countryCode: string }> = {};
    // Agréger par ville
    const cityStats: Record<string, { count: number; country: string; region: string | null; latitude: number | null; longitude: number | null }> = {};
    // Set pour compter les visiteurs uniques
    const uniqueVisitors = new Set<string>();

    for (const geo of geolocations) {
      uniqueVisitors.add(geo.sessionId);

      // Comptage par pays
      if (!countryStats[geo.country]) {
        countryStats[geo.country] = { count: 0, countryCode: geo.countryCode };
      }
      countryStats[geo.country].count++;

      // Comptage par région
      if (geo.region) {
        const regionKey = `${geo.country}|${geo.region}`;
        if (!regionStats[regionKey]) {
          regionStats[regionKey] = { count: 0, country: geo.country, countryCode: geo.countryCode };
        }
        regionStats[regionKey].count++;
      }

      // Comptage par ville
      if (geo.city) {
        const cityKey = `${geo.country}|${geo.region || ''}|${geo.city}`;
        if (!cityStats[cityKey]) {
          cityStats[cityKey] = {
            count: 0,
            country: geo.country,
            region: geo.region,
            latitude: geo.latitude,
            longitude: geo.longitude
          };
        }
        cityStats[cityKey].count++;
      }
    }

    // Formater les résultats
    const byCountry = Object.entries(countryStats)
      .map(([country, data]) => ({
        country,
        countryCode: data.countryCode,
        visitors: data.count
      }))
      .sort((a, b) => b.visitors - a.visitors);

    const byRegion = Object.entries(regionStats)
      .map(([key, data]) => {
        const [, region] = key.split('|');
        return {
          region,
          country: data.country,
          countryCode: data.countryCode,
          visitors: data.count
        };
      })
      .sort((a, b) => b.visitors - a.visitors);

    const byCity = Object.entries(cityStats)
      .map(([key, data]) => {
        const [, , city] = key.split('|');
        return {
          city,
          country: data.country,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
          visitors: data.count
        };
      })
      .sort((a, b) => b.visitors - a.visitors);

    // Top 10 villes
    const topCities = byCity.slice(0, 10);

    return NextResponse.json({
      totalVisitors: uniqueVisitors.size,
      byCountry,
      byRegion,
      byCity,
      topCities,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching geolocation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geolocation data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
