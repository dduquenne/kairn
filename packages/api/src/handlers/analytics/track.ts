/**
 * Analytics Track Handler
 *
 * Receives and processes tracking events in batches.
 */

import type { ApiRequest } from '../../middleware/types';
import { getClientIP, withRateLimit } from '../../middleware/with-rate-limit';
import { withBodyValidation } from '../../middleware/with-validation';

import {
  extractDomain,
  getCountryName,
  hashIP,
  isBot,
  trackingPayloadSchema,
  type AnalyticsHandlerConfig,
  type GeolocationData,
  type TrackingPayload,
} from './types';

/**
 * Track handler result
 */
export interface TrackResult {
  response: {
    success: boolean;
    processed?: number;
    errors?: string[];
    sessionId?: string;
    message?: string;
    error?: string;
    details?: unknown;
    retryAfter?: number;
  };
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Extract geolocation from request headers
 */
export function extractGeolocation(request: ApiRequest): GeolocationData | null {
  // Cloudflare headers
  const cfCountry = request.headers.get('cf-ipcountry');
  const cfCity = request.headers.get('cf-ipcity');
  const cfRegion = request.headers.get('cf-region');
  const cfRegionCode = request.headers.get('cf-region-code');
  const cfLatitude = request.headers.get('cf-iplatitude');
  const cfLongitude = request.headers.get('cf-iplongitude');
  const cfTimezone = request.headers.get('cf-timezone');

  // Vercel headers
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const vercelCity = request.headers.get('x-vercel-ip-city');
  const vercelRegion = request.headers.get('x-vercel-ip-country-region');
  const vercelLatitude = request.headers.get('x-vercel-ip-latitude');
  const vercelLongitude = request.headers.get('x-vercel-ip-longitude');
  const vercelTimezone = request.headers.get('x-vercel-ip-timezone');

  // Priority: Cloudflare > Vercel
  const country = cfCountry || vercelCountry;
  const city = cfCity || vercelCity;
  const region = cfRegion || vercelRegion;
  const regionCode = cfRegionCode || vercelRegion;
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
 * Process tracking events
 */
async function processEvents(
  payload: TrackingPayload,
  geolocation: GeolocationData | null,
  clientIP: string,
  config: AnalyticsHandlerConfig
): Promise<{ processed: number; errors: string[] }> {
  const {
    trackPageVisit,
    trackCustomEvent,
    trackSectionTime,
    trackConversionEvent,
    trackFunnelStep,
    trackGeolocation,
  } = config;

  const errors: string[] = [];
  let processed = 0;
  const { events, session, clientInfo } = payload;

  // Track geolocation for first event if available
  if (geolocation && events.length > 0 && trackGeolocation) {
    try {
      const firstEvent = events[0];
      if (firstEvent) {
        await trackGeolocation({
          sessionId: session.id,
          timestamp: firstEvent.timestamp,
          geolocation,
          ipHash: hashIP(clientIP),
        });
      }
    } catch (e) {
      console.error('[Track API] Error tracking geolocation:', e);
    }
  }

  for (const event of events) {
    try {
      switch (event.type) {
        case 'page_view':
          await trackPageVisit({
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

        case 'page_exit': {
          const exitEvent = event as {
            timeOnPage?: number;
            scrollDepthPercent?: number;
            engagementScore?: number;
          };
          await trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Engagement',
            action: 'page_exit',
            label: event.url,
            value: exitEvent.timeOnPage,
            metadata: {
              scrollDepthPercent: exitEvent.scrollDepthPercent,
              engagementScore: exitEvent.engagementScore,
            },
          });
          break;
        }

        case 'scroll_depth': {
          const scrollEvent = event as { depth?: number };
          await trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Engagement',
            action: 'scroll_depth',
            label: event.url,
            value: scrollEvent.depth,
          });
          break;
        }

        case 'section_view': {
          const sectionViewEvent = event as { sectionId?: string; sectionName?: string };
          await trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: 'Section',
            action: 'view',
            label: sectionViewEvent.sectionName || sectionViewEvent.sectionId,
            metadata: { sectionId: sectionViewEvent.sectionId, page: event.url },
          });
          break;
        }

        case 'section_time':
          if (trackSectionTime) {
            const sectionTimeEvent = event as {
              sectionId?: string;
              sectionName?: string;
              timeSpent?: number;
            };
            const sectionName = sectionTimeEvent.sectionName || sectionTimeEvent.sectionId;
            if (sectionName && sectionName.toLowerCase() !== 'unknown') {
              await trackSectionTime({
                timestamp: event.timestamp,
                sessionId: event.sessionId,
                section: sectionName,
                timeSpent: sectionTimeEvent.timeSpent || 0,
              });
            }
          }
          break;

        case 'conversion':
          if (trackConversionEvent) {
            const conversionEvent = event as {
              conversionType?: string;
              stepName?: string;
              stepOrder?: number;
              completed?: boolean;
              value?: number;
              metadata?: Record<string, unknown>;
            };

            await trackConversionEvent({
              timestamp: event.timestamp,
              sessionId: event.sessionId,
              eventType: conversionEvent.conversionType || 'custom',
              stepName: conversionEvent.stepName || 'unknown',
              completed: conversionEvent.completed || false,
              metadata: conversionEvent.metadata,
            });

            // Also track as funnel step
            if (trackFunnelStep) {
              await trackFunnelStep({
                timestamp: event.timestamp,
                sessionId: event.sessionId,
                funnelName: conversionEvent.conversionType || 'default',
                stepName: conversionEvent.stepName || 'unknown',
                stepOrder: conversionEvent.stepOrder || 0,
                metadata: conversionEvent.metadata,
              });
            }
          }
          break;

        case 'custom_event': {
          const customEvent = event as {
            category?: string;
            action?: string;
            label?: string;
            value?: number;
            metadata?: Record<string, unknown>;
          };
          await trackCustomEvent({
            timestamp: event.timestamp,
            sessionId: event.sessionId,
            category: customEvent.category || 'Unknown',
            action: customEvent.action || 'unknown',
            label: customEvent.label,
            value: customEvent.value,
            metadata: customEvent.metadata,
          });
          break;
        }

        case 'session_start':
          // Geolocation is tracked automatically
          break;

        case 'session_end': {
          const sessionEndEvent = event as {
            duration?: number;
            pageViewCount?: number;
            exitPage?: string;
            bounced?: boolean;
          };
          await trackCustomEvent({
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
        }

        default:
          console.warn(`[Track API] Unknown event type: ${event.type}`);
      }

      processed++;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`Event ${event.type}: ${message}`);
      console.error('[Track API] Error processing event:', e);
    }
  }

  return { processed, errors };
}

/**
 * Handle tracking request
 *
 * @param request - The incoming request
 * @param config - Handler configuration
 * @returns Track result
 */
export async function handleTrack(
  request: ApiRequest,
  config: AnalyticsHandlerConfig
): Promise<TrackResult> {
  const clientIP = getClientIP(request);
  const headers: Record<string, string> = {};

  // Rate limiting (100 requests per minute per IP)
  const rateLimitResult = await withRateLimit(request, {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyGenerator: () => `analytics:${clientIP}`,
  });

  Object.assign(headers, rateLimitResult.headers);

  if (!rateLimitResult.success) {
    return {
      response: {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.error.details?.retryAfter as number,
      },
      statusCode: 429,
      headers: {
        ...headers,
        'Retry-After': String(rateLimitResult.error.details?.retryAfter || 60),
      },
    };
  }

  // Validate payload
  const validationResult = await withBodyValidation(request, trackingPayloadSchema);

  if (!validationResult.success) {
    return {
      response: {
        success: false,
        error: 'Invalid payload',
        details: validationResult.error.details,
      },
      statusCode: 400,
      headers,
    };
  }

  const payload = validationResult.body;

  // Check for bots
  if (isBot(payload.clientInfo.userAgent)) {
    return {
      response: {
        success: true,
        processed: 0,
        sessionId: payload.session.id,
        message: 'Bot traffic ignored',
      },
      statusCode: 200,
      headers,
    };
  }

  // Extract geolocation
  const geolocation = extractGeolocation(request);

  // Process events
  try {
    const result = await processEvents(payload, geolocation, clientIP, config);

    return {
      response: {
        success: true,
        processed: result.processed,
        errors: result.errors.length > 0 ? result.errors : undefined,
        sessionId: payload.session.id,
      },
      statusCode: 200,
      headers,
    };
  } catch (e) {
    console.error('[Track API] Error:', e);
    return {
      response: {
        success: false,
        error: e instanceof Error ? e.message : 'Internal server error',
      },
      statusCode: 500,
      headers,
    };
  }
}

/**
 * Create track handler with preset configuration
 */
export function createTrackHandler(config: AnalyticsHandlerConfig) {
  return (request: ApiRequest) => handleTrack(request, config);
}
