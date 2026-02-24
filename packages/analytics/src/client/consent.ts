/**
 * Consent management for GDPR-compliant analytics tracking.
 *
 * Three consent levels:
 * - 'essential': Anonymous page views only (no fingerprinting, no persistent visitor ID)
 * - 'analytics': Full analytics tracking (sessions, scroll, sections, conversions)
 * - 'marketing': UTM tracking and cross-session visitor identification
 *
 * Consent is stored in a cookie (not localStorage) for server-side access.
 */

export type ConsentLevel = 'essential' | 'analytics' | 'marketing';

export interface ConsentState {
  level: ConsentLevel;
  updatedAt: string;
}

const CONSENT_COOKIE_NAME = 'kairn_consent';
const CONSENT_COOKIE_MAX_AGE = 13 * 30 * 24 * 60 * 60; // ~13 months (CNIL recommendation)

function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Get current consent level from cookie
 */
export function getConsentLevel(): ConsentLevel | null {
  if (isServer()) return null;

  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`));
    if (!match || !match[1]) return null;

    const state: ConsentState = JSON.parse(decodeURIComponent(match[1]));
    return state.level;
  } catch {
    return null;
  }
}

/**
 * Set consent level (stored as cookie)
 */
export function setConsentLevel(level: ConsentLevel): void {
  if (isServer()) return;

  const state: ConsentState = {
    level,
    updatedAt: new Date().toISOString(),
  };

  const value = encodeURIComponent(JSON.stringify(state));
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Check if a specific tracking feature is allowed by current consent
 */
export function isTrackingAllowed(feature: 'pageView' | 'scroll' | 'sections' | 'conversions' | 'fingerprint' | 'visitorId' | 'utm'): boolean {
  const level = getConsentLevel();

  // No consent given — only truly essential (no tracking at all)
  if (!level) return false;

  switch (feature) {
    case 'pageView':
      // Allowed at all consent levels
      return true;

    case 'scroll':
    case 'sections':
    case 'conversions':
      // Requires analytics consent
      return level === 'analytics' || level === 'marketing';

    case 'fingerprint':
    case 'visitorId':
    case 'utm':
      // Requires marketing consent
      return level === 'marketing';

    default:
      return false;
  }
}

/**
 * Revoke consent and clean up tracking data
 */
export function revokeConsent(): void {
  if (isServer()) return;

  // Remove consent cookie
  document.cookie = `${CONSENT_COOKIE_NAME}=; path=/; max-age=0`;

  // Clean up localStorage tracking data
  try {
    localStorage.removeItem('kairn_visitor_id');
    localStorage.removeItem('kairn_tracking_session');
    sessionStorage.removeItem('kairn_tracking_session');
  } catch {
    // Storage not available
  }
}

/**
 * Check if consent has been given (any level)
 */
export function hasConsent(): boolean {
  return getConsentLevel() !== null;
}
