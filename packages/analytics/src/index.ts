// Types
export * from './types';

// Client exports (re-exported for convenience)
export {
  Tracker,
  getTracker,
  initTracker,
  resetTracker,
  SessionManager,
  getSessionManager,
  resetSessionManager,
} from './client';

// Consent management
export {
  getConsentLevel,
  setConsentLevel,
  isTrackingAllowed,
  revokeConsent,
  hasConsent,
  type ConsentLevel,
  type ConsentState,
} from './client/consent';

// Consent UI
export { ConsentBanner, type ConsentBannerProps } from './client/ConsentBanner';

// Hooks
export {
  usePageTracking,
  useScrollTracking,
  useSectionTimeTracking,
  useEventTracking,
  useFunnelTracking,
  useArticleReadingTracker,
} from './client/hooks';
