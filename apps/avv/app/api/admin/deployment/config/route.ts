/**
 * GET /api/admin/deployment/config
 *
 * Returns the deployment configuration status (which env vars are set).
 * Used by the deployment dashboard to show alerts for missing configuration.
 */

import { checkDeploymentConfig } from '@kairn/core/deployment';
import { NextResponse } from 'next/server';

import { withAdminAuth } from '@/app/api/auth/middleware';

export const dynamic = 'force-dynamic';

/** GET — Check deployment configuration status */
export async function GET(): Promise<NextResponse> {
  const authResult = await withAdminAuth();
  if (authResult.error) return authResult.error;

  const config = checkDeploymentConfig();

  return NextResponse.json(config, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
