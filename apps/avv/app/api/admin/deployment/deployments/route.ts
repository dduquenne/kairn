/**
 * GET /api/admin/deployment/deployments
 *
 * Fetches recent deployments from the Vercel API.
 * Replaces the old status/history routes that used the local DB.
 */

import { fetchVercelDeployments } from '@kairn/core/deployment';
import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';

export const dynamic = 'force-dynamic';

/** GET — List recent Vercel deployments */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return NextResponse.json(
      {
        error: 'Configuration Vercel manquante',
        message: 'VERCEL_TOKEN et VERCEL_PROJECT_ID doivent être configurés.',
      },
      { status: 503 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const target = searchParams.get('target') as 'production' | 'preview' | null;

    const deployments = await fetchVercelDeployments(
      {
        token,
        projectId,
        teamId: process.env.VERCEL_TEAM_ID,
      },
      limit,
      target ?? undefined
    );

    return NextResponse.json({ deployments }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Deployment] Vercel API error:', error);
    return NextResponse.json(
      {
        error: 'Erreur API Vercel',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 502 }
    );
  }
}
