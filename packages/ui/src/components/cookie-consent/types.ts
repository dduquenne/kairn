/**
 * Types for the CookieConsentBanner component.
 */

/** Consent levels matching GDPR requirements */
export type ConsentLevel = 'essential' | 'analytics' | 'marketing';

/** Color configuration for the cookie consent banner */
export interface CookieConsentColors {
  /** Background color class (e.g. 'bg-night/95') */
  background?: string;
  /** Border color class (e.g. 'border-gold/20') */
  border?: string;
  /** Text color class (e.g. 'text-ivory/80') */
  text?: string;
  /** Primary button background class (e.g. 'bg-gold') */
  primaryButton?: string;
  /** Primary button text class (e.g. 'text-night') */
  primaryButtonText?: string;
  /** Primary button border class (e.g. 'border-gold') */
  primaryButtonBorder?: string;
  /** Secondary button border class (e.g. 'border-ivory/20') */
  secondaryButton?: string;
  /** Secondary button text class (e.g. 'text-ivory') */
  secondaryButtonText?: string;
  /** Link color class (e.g. 'text-gold') */
  link?: string;
  /** Link hover color class (e.g. 'hover:text-gold/80') */
  linkHover?: string;
}

/** Labels for the cookie consent banner */
export interface CookieConsentLabels {
  /** Banner description text */
  description?: string;
  /** Privacy policy link text */
  privacyPolicyText?: string;
  /** Essential only button label */
  essentialOnly?: string;
  /** Accept analytics button label */
  acceptAnalytics?: string;
  /** Accept all button label */
  acceptAll?: string;
}

/** Props for the CookieConsentBanner component */
export interface CookieConsentBannerProps {
  /** URL to the privacy policy page */
  privacyPolicyUrl?: string;
  /** Custom color classes */
  colors?: CookieConsentColors;
  /** Custom labels */
  labels?: CookieConsentLabels;
  /** Callback when consent level is set */
  onConsent?: (level: ConsentLevel) => void;
  /** Function to get current consent level */
  getConsentLevel: () => ConsentLevel | null;
  /** Function to set consent level */
  setConsentLevel: (level: ConsentLevel) => void;
  /** Additional CSS class for the root element */
  className?: string;
}
