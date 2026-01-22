// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * API de Tracking Analytics Unifiée
 *
 * Ce endpoint reçoit les événements de tracking en batch et les persiste
 * dans la base de données PostgreSQL. Il gère également l'enrichissement
 * des données (géolocalisation) côté serveur.
 *
 * @endpoint POST /api/analytics/track
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { recordAttempt, getClientIP } from '../../common/rate-limiter';
import type { TrackingPayload, TrackingEvent, GeolocationData } from '@/lib/tracking/types';

// Force le mode dynamique pour cette route
export const dynamic = 'force-dynamic';

// ============================================
// Schémas de validation Zod
// ============================================

const SessionDataSchema = z.object({
  id: z.string().min(1),
  startedAt: z.string(),
  lastActivityAt: z.string(),
  landingPage: z.string(),
  referrer: z.string().nullable(),
  utmSource: z.string().nullable(),
  utmMedium: z.string().nullable(),
  utmCampaign: z.string().nullable(),
  utmTerm: z.string().nullable(),
  utmContent: z.string().nullable(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  screenWidth: z.number(),
  screenHeight: z.number(),
  pageViewCount: z.number(),
  isReturning: z.boolean(),
});

const BaseEventSchema = z.object({
  type: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  url: z.string(),
});

const TrackingPayloadSchema = z.object({
  events: z.array(BaseEventSchema).min(1).max(100),
  session: SessionDataSchema,
  clientInfo: z.object({
    userAgent: z.string(),
    language: z.string(),
    timezone: z.string(),
    screenWidth: z.number(),
    screenHeight: z.number(),
    colorDepth: z.number(),
    pixelRatio: z.number(),
    touchSupport: z.boolean(),
    connectionType: z.string().optional(),
  }),
});

// ============================================
// Extraction de géolocalisation
// ============================================

/**
 * Extrait les données de géolocalisation depuis les headers de la requête
 * Supporte Cloudflare, Vercel et autres CDN populaires
 */
function extractGeolocation(request: NextRequest): GeolocationData | null {
  // Headers Cloudflare
  const cfCountry = request.headers.get('cf-ipcountry');
  const cfCity = request.headers.get('cf-ipcity');
  const cfRegion = request.headers.get('cf-region');
  const cfRegionCode = request.headers.get('cf-region-code');
  const cfLatitude = request.headers.get('cf-iplatitude');
  const cfLongitude = request.headers.get('cf-iplongitude');
  const cfTimezone = request.headers.get('cf-timezone');

  // Headers Vercel
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const vercelCity = request.headers.get('x-vercel-ip-city');
  const vercelRegion = request.headers.get('x-vercel-ip-country-region');
  const vercelLatitude = request.headers.get('x-vercel-ip-latitude');
  const vercelLongitude = request.headers.get('x-vercel-ip-longitude');
  const vercelTimezone = request.headers.get('x-vercel-ip-timezone');

  // Prioriser Cloudflare, fallback sur Vercel
  const country = cfCountry || vercelCountry;
  const city = cfCity || vercelCity;
  const region = cfRegion || vercelRegion;
  const regionCode = cfRegionCode || vercelRegion; // Vercel utilise le même header pour region et regionCode
  const latitude = cfLatitude || vercelLatitude;
  const longitude = cfLongitude || vercelLongitude;
  const timezone = cfTimezone || vercelTimezone;

  if (!country) {
    return null;
  }

  return {
    country: getCountryName(country),
    countryCode: country,
    region: region || undefined,
    regionCode: regionCode || undefined,
    city: city || undefined,
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
    timezone: timezone || undefined,
  };
}

/**
 * Convertit un code pays ISO en nom de pays
 */
function getCountryName(code: string): string {
  const countryNames: Record<string, string> = {
    FR: 'France',
    BE: 'Belgique',
    CH: 'Suisse',
    CA: 'Canada',
    US: 'États-Unis',
    GB: 'Royaume-Uni',
    DE: 'Allemagne',
    ES: 'Espagne',
    IT: 'Italie',
    PT: 'Portugal',
    NL: 'Pays-Bas',
    LU: 'Luxembourg',
    MC: 'Monaco',
    // Ajouter d'autres pays si nécessaire
  };

  return countryNames[code] || code;
}

// ============================================
// Détection de bot
// ============================================

/**
 * Vérifie si la requête provient d'un bot
 */
function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /crawling/i,
    /headless/i,
    /lighthouse/i,
    /pingdom/i,
    /gtmetrix/i,
    /pagespeed/i,
    /google/i,
    /bing/i,
    /yahoo/i,
    /yandex/i,
    /baidu/i,
    /duckduck/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /slackbot/i,
    /telegrambot/i,
    /whatsapp/i,
    /semrush/i,
    /ahrefs/i,
    /mj12bot/i,
    /dotbot/i,
    /petalbot/i,
    /bytespider/i,
    /cypress/i,
    /playwright/i,
    /puppeteer/i,
    /selenium/i,
    /phantomjs/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

// ============================================
// Traitement des événements
// ============================================

/**
 * Traite les événements de tracking et les persiste en base de données
 */
async function processEvents(
  events: TrackingEvent[],
  session: TrackingPayload['session'],
  clientInfo: TrackingPayload['clientInfo'],
  geolocation: GeolocationData | null,
  clientIP: string
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  // Import dynamique du store
  const store = await import('../store-index');

  // IMPORTANT: Enregistrer la géolocalisation au premier événement de chaque session
  // La fonction trackGeolocation vérifie si une entrée existe déjà pour éviter les doublons
  if (geolocation && events.length > 0) {
    try {
      await trackGeolocation(
        session.id,
        events[0].timestamp,
        geolocation,
        clientIP
      );
    } catch (error) {
      console.error('[Track API] Error tracking geolocation:', error);
      // Ne pas bloquer le traitement des événements si la géolocalisation échoue
    }
  }

  for (const event of events) {
    try {
      switch (event.type) {
        case 'page_view':
          await store.trackPageVisit({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            page: event.url,
            referrer: (event as { referrer?: string }).referrer || undefined,
            userAgent: clientInfo.userAgent,
            utmSource: session.utmSource || undefined,
            utmMedium: session.utmMedium || undefined,
            utmCampaign: session.utmCampaign || undefined,
            utmTerm: session.utmTerm || undefined,
            utmContent: session.utmContent || undefined,
            referrerDomain: extractDomain(session.referrer),
            deviceType: session.deviceType,
            browser: session.browser || undefined,
            os: session.os || undefined,
            isBot: isBot(clientInfo.userAgent),
          });
          break;

        case 'page_exit':
          // Mise à jour de la visite de page existante avec le temps et scroll
          const exitEvent = event as {
            timeOnPage?: number;
            scrollDepthPercent?: number;
          };

          // On enregistre comme un événement personnalisé pour le temps et scroll
          await store.trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Engagement',
            action: 'page_exit',
            label: event.url,
            value: exitEvent.timeOnPage,
            metadata: {
              scrollDepthPercent: exitEvent.scrollDepthPercent,
              engagementScore: (event as { engagementScore?: number }).engagementScore,
            },
          });
          break;

        case 'scroll_depth':
          const scrollEvent = event as { depth?: number };
          await store.trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Engagement',
            action: 'scroll_depth',
            label: event.url,
            value: scrollEvent.depth,
          });
          break;

        case 'section_view':
          const sectionViewEvent = event as { sectionId?: string; sectionName?: string };
          await store.trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Section',
            action: 'view',
            label: sectionViewEvent.sectionName || sectionViewEvent.sectionId,
            metadata: { sectionId: sectionViewEvent.sectionId, page: event.url },
          });
          break;

        case 'section_time':
          const sectionTimeEvent = event as {
            sectionId?: string;
            sectionName?: string;
            timeSpent?: number;
          };
          // Determine section name, skip if unknown or invalid
          const sectionName = sectionTimeEvent.sectionName || sectionTimeEvent.sectionId;
          if (sectionName && sectionName.toLowerCase() !== 'unknown') {
            await store.trackSectionTime({
              timestamp: event.timestamp,
              sessionId: event.sessionId,
              section: sectionName,
              timeSpent: sectionTimeEvent.timeSpent || 0,
            });
          }
          // Skip tracking for 'unknown' sections - they provide no useful data
          break;

        case 'conversion':
          const conversionEvent = event as {
            conversionType?: string;
            stepName?: string;
            stepOrder?: number;
            completed?: boolean;
            value?: number;
            metadata?: Record<string, unknown>;
          };

          // Enregistrer l'événement de conversion
          await store.trackConversionEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            eventType: (conversionEvent.conversionType ||
              'contact_form') as 'appointment_request' | 'seminar_registration' | 'contact_form',
            stepName: conversionEvent.stepName || 'unknown',
            completed: conversionEvent.completed || false,
            metadata: conversionEvent.metadata,
          });

          // Enregistrer aussi comme étape de funnel
          await store.trackFunnelStep({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            funnelName: conversionEvent.conversionType || 'default',
            stepName: conversionEvent.stepName || 'unknown',
            stepOrder: conversionEvent.stepOrder || 0,
            metadata: conversionEvent.metadata,
          });
          break;

        case 'custom_event':
          const customEvent = event as {
            category?: string;
            action?: string;
            label?: string;
            value?: number;
            metadata?: Record<string, unknown>;
          };
          await store.trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: customEvent.category || 'Unknown',
            action: customEvent.action || 'unknown',
            label: customEvent.label,
            value: customEvent.value,
            metadata: customEvent.metadata,
          });
          break;

        case 'session_start':
          // La géolocalisation est maintenant enregistrée automatiquement au début de processEvents
          // Ce case est conservé pour compatibilité avec les clients qui envoient cet événement
          break;

        case 'session_end':
          const sessionEndEvent = event as {
            duration?: number;
            pageViewCount?: number;
            exitPage?: string;
            bounced?: boolean;
          };

          // Enregistrer comme événement personnalisé
          await store.trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Session',
            action: 'end',
            value: sessionEndEvent.duration,
            metadata: {
              pageViewCount: sessionEndEvent.pageViewCount,
              exitPage: sessionEndEvent.exitPage,
              bounced: sessionEndEvent.bounced,
            },
          });
          break;

        default:
          // Type d'événement inconnu - logger mais ne pas échouer
          console.warn(`[Track API] Unknown event type: ${(event as { type: string }).type}`);
      }

      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Event ${(event as { type: string }).type}: ${message}`);
      console.error(`[Track API] Error processing event:`, error);
    }
  }

  return { processed, errors };
}

/**
 * Enregistre les données de géolocalisation pour une session
 */
async function trackGeolocation(
  sessionId: string,
  timestamp: string,
  geo: GeolocationData,
  ipAddress: string
): Promise<void> {
  const { prisma } = await import('@/lib/db/prisma');

  // Vérifier si la géolocalisation existe déjà pour cette session
  const existing = await prisma.visitorGeolocation.findFirst({
    where: { sessionId },
  });

  if (existing) return;

  await prisma.visitorGeolocation.create({
    data: {
      timestamp: new Date(timestamp),
      sessionId,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      regionCode: geo.regionCode,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: geo.timezone,
      ipAddress: hashIP(ipAddress), // Hasher l'IP pour la confidentialité
    },
  });
}

/**
 * Hash simple de l'IP pour la confidentialité
 */
function hashIP(ip: string): string {
  // Hash simple - en production utiliser une fonction de hash appropriée
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir en 32bit integer
  }
  return `ip_${Math.abs(hash).toString(16)}`;
}

/**
 * Extrait le domaine d'une URL
 */
function extractDomain(url: string | null): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return undefined;
  }
}

// ============================================
// Route Handler
// ============================================

/**
 * POST /api/analytics/track
 *
 * Reçoit et traite un batch d'événements de tracking
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = recordAttempt('analytics', clientIP);

  if (rateLimitResult.limited) {
    return Response.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    // Parser et valider le payload
    const body = await request.json();
    const validationResult = TrackingPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        {
          success: false,
          error: 'Invalid payload',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = validationResult.data as TrackingPayload;

    // Vérifier si c'est un bot
    if (isBot(payload.clientInfo.userAgent)) {
      // Ignorer silencieusement les requêtes de bots
      return Response.json({
        success: true,
        processed: 0,
        sessionId: payload.session.id,
        message: 'Bot traffic ignored',
      });
    }

    // Extraire la géolocalisation
    const geolocation = extractGeolocation(request);

    // Traiter les événements
    const result = await processEvents(
      payload.events as TrackingEvent[],
      payload.session,
      payload.clientInfo,
      geolocation,
      clientIP
    );

    // Réponse
    return Response.json({
      success: true,
      processed: result.processed,
      errors: result.errors.length > 0 ? result.errors : undefined,
      sessionId: payload.session.id,
    });
  } catch (error) {
    console.error('[Track API] Error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler pour CORS (si nécessaire)
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
