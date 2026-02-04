/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Filtres pour exclure le trafic de développement/test des analytics
 */

import { NextRequest } from "next/server";

/**
 * Liste des IPs à exclure (localhost, développement)
 */
const EXCLUDED_IPS = [
  "127.0.0.1",
  "::1",
  "localhost",
  "0.0.0.0",
  // Ajoutez ici vos IPs de développement si nécessaire
  // "192.168.1.100", // Exemple: votre IP locale
];

/**
 * Liste des user-agents à exclure (outils de dev, bots de test)
 */
const EXCLUDED_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /cypress/i,
  /playwright/i,
  /puppeteer/i,
  /selenium/i,
  /webdriver/i,
  /headless/i,
  /lighthouse/i,
  /pagespeed/i,
  /gtmetrix/i,
  /pingdom/i,
  /uptimerobot/i,
];

/**
 * Liste des domaines de référence à exclure
 */
const EXCLUDED_REFERRER_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  // Ajoutez vos domaines de staging/dev si nécessaire
  // "dev.psypnos.fr",
  // "staging.psypnos.fr",
];

/**
 * Liste des pages à exclure (pages de développement/test/admin)
 */
const EXCLUDED_PAGES = [
  /^\/_next/,
  /^\/__nextjs/,
  /^\/test/,
  /^\/dev/,
  /^\/api/,
  /^\/debug/,
  /^\/admin/i, // Exclure les pages admin (insensible à la casse)
];

/**
 * Extrait l'IP du client depuis une requête Next.js
 */
export function getClientIP(request: NextRequest): string | null {
  // 1. Check X-Forwarded-For header (proxy/load balancer)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0]; // Premier IP = client original
  }

  // 2. Check X-Real-IP header
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // 3. Check CF-Connecting-IP (Cloudflare)
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) {
    return cfIP;
  }

  // 4. Fallback to remote address (pas disponible dans Next.js Edge)
  return null;
}

/**
 * Vérifie si une IP doit être exclue
 */
export function isExcludedIP(ip: string | null): boolean {
  if (!ip) return false;
  return EXCLUDED_IPS.some((excludedIP) => ip.includes(excludedIP));
}

/**
 * Vérifie si un user-agent doit être exclu
 */
export function isExcludedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return EXCLUDED_USER_AGENTS.some((pattern) => pattern.test(userAgent));
}

/**
 * Vérifie si un domaine de référence doit être exclu
 */
export function isExcludedReferrer(referrer: string | null): boolean {
  if (!referrer) return false;

  try {
    const url = new URL(referrer);
    const hostname = url.hostname;
    return EXCLUDED_REFERRER_DOMAINS.some((domain) =>
      hostname.includes(domain)
    );
  } catch {
    // URL invalide
    return false;
  }
}

/**
 * Vérifie si une page doit être exclue
 */
export function isExcludedPage(page: string): boolean {
  return EXCLUDED_PAGES.some((pattern) => pattern.test(page));
}

/**
 * Vérifie si la requête provient de localhost
 */
export function isLocalhost(request: NextRequest): boolean {
  const ip = getClientIP(request);
  const hostname = request.headers.get("host") || "";

  return (
    isExcludedIP(ip) ||
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    hostname.startsWith("0.0.0.0")
  );
}

/**
 * Filtre principal : détermine si la requête doit être trackée
 */
export interface FilterResult {
  shouldTrack: boolean;
  reason?: string;
}

export function shouldTrackRequest(
  request: NextRequest,
  page?: string,
  userAgent?: string,
  referrer?: string
): FilterResult {
  // 1. Vérifier si les analytics sont activés
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") {
    return { shouldTrack: false, reason: "Analytics disabled" };
  }

  // 2. Vérifier l'IP
  const ip = getClientIP(request);
  if (isExcludedIP(ip)) {
    return { shouldTrack: false, reason: `Excluded IP: ${ip}` };
  }

  // 3. Vérifier si c'est localhost
  if (isLocalhost(request)) {
    return { shouldTrack: false, reason: "Localhost request" };
  }

  // 4. Vérifier le user-agent
  const ua = userAgent || request.headers.get("user-agent");
  if (isExcludedUserAgent(ua)) {
    return { shouldTrack: false, reason: "Excluded user-agent" };
  }

  // 5. Vérifier le référent
  if (referrer && isExcludedReferrer(referrer)) {
    return { shouldTrack: false, reason: "Excluded referrer" };
  }

  // 6. Vérifier la page
  if (page && isExcludedPage(page)) {
    return { shouldTrack: false, reason: `Excluded page: ${page}` };
  }

  return { shouldTrack: true };
}

/**
 * Middleware pour filtrer les requêtes analytics
 * Utilisation dans un API route:
 *
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const filter = shouldTrackRequest(request);
 *   if (!filter.shouldTrack) {
 *     return new Response(null, { status: 204 }); // No content
 *   }
 *   // Traiter la requête analytics...
 * }
 * ```
 */
export function analyticsFilter(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const filter = shouldTrackRequest(request);

    if (!filter.shouldTrack) {
      console.log(`[Analytics] Request filtered: ${filter.reason}`);
      return new Response(null, { status: 204 }); // No content
    }

    return handler(request);
  };
}
