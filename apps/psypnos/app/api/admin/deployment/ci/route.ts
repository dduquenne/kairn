/**
 * GET /api/admin/deployment/ci
 *
 * Fetches the latest CI pipeline results from GitHub Actions.
 * Returns workflow runs with individual job statuses.
 */

import { fetchLatestCIRun, fetchWorkflowRuns } from '@kairn/core/deployment';
import { NextRequest, NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';

export const dynamic = 'force-dynamic';

/** GET — Fetch GitHub Actions CI results */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    return NextResponse.json(
      {
        error: 'Configuration GitHub manquante',
        message: 'GITHUB_TOKEN et GITHUB_REPOSITORY doivent être configurés.',
      },
      { status: 503 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const branch = searchParams.get('branch') || 'main';
    const mode = searchParams.get('mode') || 'latest';
    const config = { token, repository };

    if (mode === 'history') {
      const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);
      const runs = await fetchWorkflowRuns(config, limit, branch);
      return NextResponse.json({ runs }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Default: latest run with jobs
    const latestRun = await fetchLatestCIRun(config, branch);

    return NextResponse.json({ run: latestRun }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Deployment] GitHub API error:', error);
    return NextResponse.json(
      {
        error: 'Erreur API GitHub',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 502 }
    );
  }
}
