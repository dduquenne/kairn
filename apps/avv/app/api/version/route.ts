/**
 * Version API Route
 *
 * Endpoint pour vérifier la version actuelle de l'application.
 * Utilisé par le client pour détecter les nouvelles versions après déploiement.
 *
 * IMPORTANT: Cet endpoint ne doit JAMAIS être mis en cache.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VersionResponse {
  version: string;
  buildId: string;
  buildTime: string;
  environment: string;
}

/** Server start time (approximation of build time for Serverless) */
const serverStartTime = new Date().toISOString();

/** GET /api/version — Return current app version and build info */
export async function GET(): Promise<NextResponse<VersionResponse>> {
  const version = process.env.npm_package_version || '1.0.0';
  const buildId = process.env.NEXT_BUILD_ID || process.env.VERCEL_DEPLOYMENT_ID || 'development';

  const response: VersionResponse = {
    version,
    buildId,
    buildTime: serverStartTime,
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
      'X-Build-Id': buildId,
      'X-App-Version': version,
    },
  });
}
