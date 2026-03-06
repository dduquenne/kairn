/**
 * Middleware d'authentification admin pour routes API Next.js
 *
 * Version standardisée de withAdminAuth qui utilise l'API cookies() de Next.js.
 * Remplace les implémentations spécifiques dans chaque app.
 *
 * @module with-admin-auth
 */

import { verifyToken, type JWTPayload } from '@kairn/core/auth';

import type { ApiErrorResponse } from './types';

/** Configuration du middleware admin auth */
export interface AdminAuthConfig {
  /** Nom du cookie contenant le token JWT (ex: 'psypnos_admin_token') */
  cookieName: string;
  /** Rôle admin requis (défaut: 'admin') */
  adminRole?: string;
  /** Fonction pour récupérer les cookies (Next.js cookies()) */
  getCookies: () => Promise<{ get: (name: string) => { value: string } | undefined }>;
}

/** Résultat de l'authentification admin */
export type AdminAuthResult =
  | { success: true; user: JWTPayload }
  | { success: false; error: ApiErrorResponse; response?: unknown };

/**
 * Vérifie l'authentification admin via cookies Next.js
 *
 * @param config - Configuration du middleware
 * @returns Résultat d'authentification avec user ou erreur
 *
 * @example
 * ```typescript
 * import { withAdminAuth } from '@kairn/api';
 * import { cookies } from 'next/headers';
 *
 * export async function GET() {
 *   const auth = await withAdminAuth({
 *     cookieName: 'psypnos_admin_token',
 *     getCookies: () => cookies(),
 *   });
 *   if (!auth.success) {
 *     return NextResponse.json(auth.error, { status: auth.error.statusCode });
 *   }
 *   const { user } = auth;
 *   // ... logique admin
 * }
 * ```
 */
export async function withAdminAuth(config: AdminAuthConfig): Promise<AdminAuthResult> {
  const { cookieName, adminRole = 'admin', getCookies } = config;

  try {
    const cookieStore = await getCookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentification requise',
          statusCode: 401,
        },
      };
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token invalide ou expiré',
          statusCode: 401,
        },
      };
    }

    if (payload.role !== adminRole) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permissions insuffisantes',
          statusCode: 403,
        },
      };
    }

    return { success: true, user: payload };
  } catch {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Erreur de vérification du token',
        statusCode: 401,
      },
    };
  }
}

/**
 * Factory pour créer un middleware admin auth préconfigureé
 *
 * @param defaultConfig - Configuration par défaut
 * @returns Fonction withAdminAuth préconfigurée
 *
 * @example
 * ```typescript
 * // lib/auth.ts
 * import { createAdminAuth } from '@kairn/api';
 * import { cookies } from 'next/headers';
 *
 * export const withSiteAdminAuth = createAdminAuth({
 *   cookieName: 'psypnos_admin_token',
 *   getCookies: () => cookies(),
 * });
 *
 * // app/api/admin/route.ts
 * import { withSiteAdminAuth } from '@/lib/auth';
 *
 * export async function GET() {
 *   const auth = await withSiteAdminAuth();
 *   if (!auth.success) return NextResponse.json(auth.error, { status: auth.error.statusCode });
 *   // ...
 * }
 * ```
 */
export function createAdminAuth(defaultConfig: AdminAuthConfig) {
  return (overrides?: Partial<AdminAuthConfig>) =>
    withAdminAuth({ ...defaultConfig, ...overrides });
}
