/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Version API Route
 *
 * Endpoint pour vérifier la version actuelle de l'application.
 * Utilisé par le client pour détecter les nouvelles versions après déploiement.
 *
 * IMPORTANT: Cet endpoint ne doit JAMAIS être mis en cache.
 */

import * as fs from "fs";
import * as path from "path";

import { NextResponse } from "next/server";

// Force dynamic pour éviter le cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface VersionResponse {
  version: string;
  buildId: string;
  buildTime: string;
  environment: string;
}

// Cache le BUILD_ID en mémoire pour éviter les lectures répétées
let cachedBuildId: string | null = null;

function getBuildId(): string {
  if (cachedBuildId) return cachedBuildId;

  try {
    // En production standalone, le BUILD_ID est dans .next/BUILD_ID
    const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
    if (fs.existsSync(buildIdPath)) {
      cachedBuildId = fs.readFileSync(buildIdPath, "utf-8").trim();
      return cachedBuildId;
    }
  } catch {
    // Ignorer les erreurs de lecture
  }

  // Fallback : utiliser la variable d'environnement ou un ID par défaut
  cachedBuildId = process.env.BUILD_ID || process.env.NEXT_BUILD_ID || "development";
  return cachedBuildId;
}

// Lecture de la version depuis package.json (au démarrage)
let appVersion: string = "1.0.0";
try {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    appVersion = packageJson.version || "1.0.0";
  }
} catch {
  // Utiliser la version par défaut
}

// Horodatage du démarrage du serveur (approximation du build time)
const serverStartTime = new Date().toISOString();

export async function GET(): Promise<NextResponse<VersionResponse>> {
  const buildId = getBuildId();

  const response: VersionResponse = {
    version: appVersion,
    buildId: buildId,
    buildTime: serverStartTime,
    environment: process.env.NODE_ENV || "development",
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      // CRUCIAL: Empêcher tout mise en cache de cet endpoint
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store",
      // Ajouter un timestamp pour prouver que c'est frais
      "X-Build-Id": buildId,
      "X-App-Version": appVersion,
    },
  });
}
