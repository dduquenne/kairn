'use client';

import { CookieConsentBanner as BaseCookieConsentBanner, type ConsentLevel } from '@kairn/ui';

import { getConsentLevel, setConsentLevel, initTracker } from '@/lib/tracking';

/** Psypnos-themed cookie consent colors */
const PSYPNOS_COLORS = {
  background: 'bg-night/95',
  border: 'border-gold/20',
  text: 'text-ivory/80',
  primaryButton: 'bg-gold',
  primaryButtonText: 'text-night',
  primaryButtonBorder: 'border-gold',
  secondaryButton: 'border-ivory/20',
  secondaryButtonText: 'text-ivory',
  link: 'text-gold',
  linkHover: 'hover:text-gold/80',
};

/**
 * Psypnos-specific cookie consent banner wrapper.
 *
 * Wraps the shared @kairn/ui CookieConsentBanner with:
 * - Psypnos theme colors (gold/night)
 * - Analytics tracker initialization on consent
 * - kairn:tracker-ready event dispatch for SectionTracker
 */
export function CookieConsentBanner() {
  /**
   * Handle consent by initializing the tracker and notifying SectionTracker
   */
  const handleConsent = (_level: ConsentLevel) => {
    initTracker();
    window.dispatchEvent(new Event('kairn:tracker-ready'));
  };

  return (
    <BaseCookieConsentBanner
      colors={PSYPNOS_COLORS}
      getConsentLevel={getConsentLevel}
      setConsentLevel={setConsentLevel}
      onConsent={handleConsent}
    />
  );
}
