/**
 * Analytics Request Filters
 *
 * Utilities for excluding development, test, and bot traffic
 * from analytics tracking. Framework-agnostic — works with
 * any HTTP request object that provides headers.
 */

/** Standard headers interface for request filtering */
export interface RequestHeaders {
  get: (name: string) => string | null;
}

/** Lists of IPs to exclude (localhost, development) */
const EXCLUDED_IPS = ['127.0.0.1', '::1', 'localhost', '0.0.0.0'];

/** User-agent patterns to exclude (dev tools, bots, test tools) */
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

/** Referrer domains to exclude */
const EXCLUDED_REFERRER_DOMAINS = ['localhost', '127.0.0.1', '0.0.0.0'];

/** Page path patterns to exclude */
const EXCLUDED_PAGES = [
  /^\/_next/,
  /^\/__nextjs/,
  /^\/test/,
  /^\/dev/,
  /^\/api/,
  /^\/debug/,
  /^\/admin/i,
];

/**
 * Extracts the client IP from request headers.
 * Supports X-Forwarded-For, X-Real-IP, and CF-Connecting-IP.
 */
export function getClientIP(headers: RequestHeaders): string | null {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0] ?? null;
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;

  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  return null;
}

/**
 * Checks if an IP should be excluded from tracking.
 */
export function isExcludedIP(ip: string | null): boolean {
  if (!ip) return false;
  return EXCLUDED_IPS.some(excludedIP => ip.includes(excludedIP));
}

/**
 * Checks if a user-agent should be excluded from tracking.
 */
export function isExcludedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return EXCLUDED_USER_AGENTS.some(pattern => pattern.test(userAgent));
}

/**
 * Checks if a referrer domain should be excluded from tracking.
 */
export function isExcludedReferrer(referrer: string | null): boolean {
  if (!referrer) return false;

  try {
    const url = new URL(referrer);
    const hostname = url.hostname;
    return EXCLUDED_REFERRER_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Checks if a page path should be excluded from tracking.
 */
export function isExcludedPage(page: string): boolean {
  return EXCLUDED_PAGES.some(pattern => pattern.test(page));
}

/**
 * Checks if the request originates from localhost.
 */
export function isLocalhost(headers: RequestHeaders): boolean {
  const ip = getClientIP(headers);
  const hostname = headers.get('host') || '';

  return (
    isExcludedIP(ip) ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.startsWith('0.0.0.0')
  );
}

/** Filter evaluation result */
export interface FilterResult {
  shouldTrack: boolean;
  reason?: string;
}

/**
 * Main filter: determines if a request should be tracked.
 */
export function shouldTrackRequest(
  headers: RequestHeaders,
  page?: string,
  userAgent?: string,
  referrer?: string
): FilterResult {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') {
    return { shouldTrack: false, reason: 'Analytics disabled' };
  }

  const ip = getClientIP(headers);
  if (isExcludedIP(ip)) {
    return { shouldTrack: false, reason: `Excluded IP: ${ip}` };
  }

  if (isLocalhost(headers)) {
    return { shouldTrack: false, reason: 'Localhost request' };
  }

  const ua = userAgent || headers.get('user-agent');
  if (isExcludedUserAgent(ua)) {
    return { shouldTrack: false, reason: 'Excluded user-agent' };
  }

  if (referrer && isExcludedReferrer(referrer)) {
    return { shouldTrack: false, reason: 'Excluded referrer' };
  }

  if (page && isExcludedPage(page)) {
    return { shouldTrack: false, reason: `Excluded page: ${page}` };
  }

  return { shouldTrack: true };
}
