/**
 * API de Tracking Analytics Unifiée
 *
 * Ce endpoint reçoit les événements de tracking en batch et les persiste
 * dans la base de données PostgreSQL. Il gère également l'enrichissement
 * des données (géolocalisation) côté serveur.
 *
 * @endpoint POST /api/analytics/track
 */

import { createHmac } from 'crypto';

import { NextRequest } from 'next/server';
import { z } from 'zod';

import type { TrackingPayload, TrackingEvent, GeolocationData } from '@/lib/tracking';

import { recordAttempt, getClientIP } from '../../common/rate-limiter';

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

const VALID_EVENT_TYPES = [
  'page_view',
  'page_exit',
  'scroll_depth',
  'section_view',
  'section_time',
  'conversion',
  'custom_event',
  'session_start',
  'session_end',
] as const;

const BaseEventSchema = z.object({
  type: z.enum(VALID_EVENT_TYPES),
  timestamp: z.string().refine(s => !isNaN(Date.parse(s)), { message: 'Invalid timestamp' }),
  sessionId: z.string().min(1),
  url: z.string().min(1),
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
    /bot\b/i,
    /crawler/i,
    /spider/i,
    /crawling/i,
    /headless/i,
    /lighthouse/i,
    /pingdom/i,
    /gtmetrix/i,
    /pagespeed/i,
    /googlebot/i,
    /google-inspectiontool/i,
    /bingbot/i,
    /bingpreview/i,
    /yahoo!?\s*slurp/i,
    /yandexbot/i,
    /baiduspider/i,
    /duckduckbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /slackbot/i,
    /telegrambot/i,
    /whatsapp/i,
    /semrushbot/i,
    /ahrefsbot/i,
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

  return botPatterns.some(pattern => pattern.test(userAgent));
}

// ============================================
// Traitement des événements
// ============================================

/**
 * Traite les événements de tracking et les persiste en base de données
 */
// Type for event fields that go beyond BaseEventSchema
// These are validated by the client tracker but passed through BaseEventSchema
interface EventExtras {
  referrer?: string;
  timeOnPage?: number;
  scrollDepthPercent?: number;
  engagementScore?: number;
  depth?: number;
  sectionId?: string;
  sectionName?: string;
  timeSpent?: number;
  conversionType?: string;
  stepName?: string;
  stepOrder?: number;
  completed?: boolean;
  value?: number;
  metadata?: Record<string, unknown>;
  category?: string;
  action?: string;
  label?: string;
  duration?: number;
  pageViewCount?: number;
  exitPage?: string;
  bounced?: boolean;
}

type ValidatedEvent = z.infer<typeof BaseEventSchema> & EventExtras;

async function processEvents(
  events: ValidatedEvent[],
  session: z.infer<typeof SessionDataSchema>,
  clientInfo: z.infer<typeof TrackingPayloadSchema>['clientInfo'],
  geolocation: GeolocationData | null,
  clientIP: string
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  const store = await import('../store-index');

  const firstEvent = events[0];
  if (geolocation && firstEvent) {
    try {
      await trackGeolocation(session.id, firstEvent.timestamp, geolocation, clientIP);
    } catch (error) {
      console.error('[Track API] Error tracking geolocation:', error);
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
            referrer: event.referrer || undefined,
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
          await store.trackPageExit({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            page: event.url,
            timeOnPage: event.timeOnPage || 0,
            scrollDepthPercent: event.scrollDepthPercent || 0,
            engagementScore: event.engagementScore,
          });
          break;

        case 'scroll_depth':
          await store.trackScrollDepth({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            page: event.url,
            depth: event.depth || 0,
          });
          break;

        case 'section_view':
          await store.trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Section',
            action: 'view',
            label: event.sectionName || event.sectionId,
            metadata: { sectionId: event.sectionId, page: event.url },
          });
          break;

        case 'section_time': {
          const sectionName = event.sectionName || event.sectionId;
          if (sectionName && sectionName.toLowerCase() !== 'unknown') {
            await store.trackSectionTime({
              timestamp: event.timestamp,
              sessionId: event.sessionId,
              section: sectionName,
              timeSpent: event.timeSpent || 0,
            });
          }
          break;
        }

        case 'conversion': {
          const conversionType = event.conversionType || 'contact_form';
          const stepName = event.stepName || 'unknown';

          await store.trackConversionEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            eventType: conversionType as
              | 'appointment_request'
              | 'seminar_registration'
              | 'contact_form',
            stepName,
            completed: event.completed || false,
            metadata: event.metadata,
          });

          await store.trackFunnelStep({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            funnelName: conversionType,
            stepName,
            stepOrder: event.stepOrder || 0,
            metadata: event.metadata,
          });
          break;
        }

        case 'custom_event':
          await store.trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: event.category || 'Unknown',
            action: event.action || 'unknown',
            label: event.label,
            value: event.value,
            metadata: event.metadata,
          });
          break;

        case 'session_start':
          break;

        case 'session_end':
          await store.trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Session',
            action: 'end',
            value: event.duration,
            metadata: {
              pageViewCount: event.pageViewCount,
              exitPage: event.exitPage,
              bounced: event.bounced,
            },
          });
          break;
      }

      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Event ${event.type}: ${message}`);
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
  const { getCurrentSiteId } = await import('../store-postgres/utils');

  const siteId = await getCurrentSiteId();

  // Use upsert to avoid race conditions between concurrent requests
  // for the same session (findFirst + create is not atomic)
  await prisma.visitorGeolocation.upsert({
    where: { sessionId },
    update: {}, // No-op if already exists
    create: {
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
      ipAddress: hashIP(ipAddress),
      siteId,
    },
  });
}

/**
 * Hash cryptographique de l'IP pour la confidentialité
 * Utilise HMAC-SHA256 avec un secret pour empêcher la réversibilité par force brute
 */
function hashIP(ip: string): string {
  const secret = process.env.IP_HASH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[Track API] No IP_HASH_SECRET or JWT_SECRET configured, IP hashing is insecure');
    return `ip_${createHmac('sha256', 'kairn-dev-only').update(ip).digest('hex').slice(0, 16)}`;
  }
  return `ip_${createHmac('sha256', secret).update(ip).digest('hex').slice(0, 16)}`;
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

    const payload = validationResult.data;

    // Vérifier si c'est un bot
    if (isBot(payload.clientInfo.userAgent)) {
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
      payload.events as ValidatedEvent[],
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
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = getAllowedOrigin(origin);

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function getAllowedOrigin(origin: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (!siteUrl) {
    // In development, allow localhost origins
    if (origin.startsWith('http://localhost:')) return origin;
    return '';
  }

  const normalizedSiteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
  if (origin === normalizedSiteUrl) return origin;

  // Allow Vercel preview deployments
  if (origin.endsWith('.vercel.app')) return origin;

  return '';
}
