// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { trackPageVisit } from "../store-index";
import type { NextRequest } from "next/server";
import { withAdminAuth } from "../../auth/middleware";
import { recordAttempt, getClientIP } from "../../common/rate-limiter";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // PROTECTION : Rate limiting - 100 requêtes par minute par IP
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt("analytics", clientIP);

  if (rateLimitResult.limited) {
    return Response.json(
      {
        error: "Trop de tentatives. Veuillez réessayer dans quelques instants.",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { sessionId, page } = body;

    if (!sessionId || !page) {
      return Response.json(
        { error: "Missing required fields: sessionId, page" },
        { status: 400 },
      );
    }

    // Pass all enriched data from client (UTM, device, browser, OS, etc.)
    const visit = await trackPageVisit({
      timestamp: new Date().toISOString(),
      ...body, // Include all fields from client
    });

    return Response.json(visit, { status: 201 });
  } catch (error) {
    console.error("Error tracking page visit:", error);
    return Response.json(
      { error: "Failed to track page visit" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // SÉCURITÉ : Protéger l'accès aux données analytics
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const { getPageVisits } = await import("../store-index");
    const visits = await getPageVisits(startDate || undefined, endDate || undefined);

    return Response.json(visits, { status: 200 });
  } catch (error) {
    console.error("Error fetching page visits:", error);
    return Response.json(
      { error: "Failed to fetch page visits" },
      { status: 500 },
    );
  }
}
