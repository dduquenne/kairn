/**
 * Middleware d'authentification CRON pour les routes API Next.js
 *
 * Wrapper réutilisable autour de verifyCronAuth de @kairn/core.
 * Standardise la gestion d'erreur et le logging pour tous les endpoints CRON.
 *
 * @module with-cron-auth
 */

import { verifyCronAuth, type VerifyResult, type VerifyQStashConfig } from '@kairn/core/scheduler';

import type { ApiErrorResponse } from './types';

/** Résultat de l'authentification CRON */
export type CronAuthResult =
  | { success: true; source: VerifyResult['source'] }
  | { success: false; error: ApiErrorResponse };

/**
 * Vérifie l'authentification d'une requête CRON
 *
 * Supporte la signature QStash, le CRON_SECRET et le mode développement.
 *
 * @param request - Requête entrante (NextRequest ou Request standard)
 * @param config - Configuration optionnelle pour les clés QStash
 * @returns Résultat d'authentification avec erreur standardisée
 *
 * @example
 * ```typescript
 * import { withCronAuth } from '@kairn/api';
 *
 * export async function GET(request: NextRequest) {
 *   const auth = await withCronAuth(request);
 *   if (!auth.success) {
 *     return NextResponse.json(auth.error, { status: auth.error.statusCode });
 *   }
 *   // auth.source contient 'qstash' | 'cron_secret' | 'development'
 *   // ... logique CRON
 * }
 * ```
 */
export async function withCronAuth(
  request: Request,
  config?: VerifyQStashConfig
): Promise<CronAuthResult> {
  const result = await verifyCronAuth(request, config);

  if (!result.valid) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: result.error || 'Authentification CRON requise',
        statusCode: 401,
      },
    };
  }

  return {
    success: true,
    source: result.source,
  };
}
