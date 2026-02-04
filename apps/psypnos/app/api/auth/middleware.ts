/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ErrorCode, createApiError } from "../common/error-codes";

import { verifyToken, JWTPayload } from "./jwt";

/**
 * Extrait et vérifie le JWT token depuis les cookies
 */
export async function verifyAdminToken(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("psypnos_admin_token")?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    return payload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Vérifie que l'utilisateur est authentifié et admin
 * À utiliser dans les layouts admin
 */
export async function requireAdminAuth(): Promise<JWTPayload> {
  const payload = await verifyAdminToken();

  if (!payload || payload.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return payload;
}

/**
 * Middleware pour protéger les routes API admin
 * Retourne une erreur 401 si l'utilisateur n'est pas authentifié
 *
 * Utilisation:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await withAdminAuth();
 *   if (authResult.error) return authResult.error;
 *
 *   const user = authResult.user;
 *   // ... votre logique protégée
 * }
 * ```
 */
export async function withAdminAuth(): Promise<{
  user?: JWTPayload;
  error?: NextResponse;
}> {
  const payload = await verifyAdminToken();

  if (!payload) {
    const error = createApiError(ErrorCode.UNAUTHORIZED);
    return {
      error: NextResponse.json(error, { status: error.statusCode }),
    };
  }

  if (payload.role !== "admin") {
    const error = createApiError(ErrorCode.INSUFFICIENT_PERMISSIONS);
    return {
      error: NextResponse.json(error, { status: error.statusCode }),
    };
  }

  return { user: payload };
}
