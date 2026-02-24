/**
 * Analytics Tracking Hooks
 *
 * All tracking functions delegate to the unified @kairn/analytics tracker
 * which batches events and sends them via /api/analytics/track.
 *
 * For page/section tracking hooks, use useTracker.ts instead.
 * This module provides conversion, custom event, and funnel tracking.
 */

'use client';

import { getTracker, type ConversionType } from '@/lib/tracking';

// Re-export page/section hooks from useTracker to avoid duplication
export { usePageTracking, useSectionTracking as useSectionTimeTracking } from './useTracker';

// ============================================
// Conversion Tracking
// ============================================

/**
 * Track conversion events via the unified tracker.
 */
export async function trackConversionEvent(
  eventType:
    | 'appointment_request'
    | 'seminar_registration'
    | 'contact_form'
    | 'fab_click'
    | 'quick_contact_form',
  stepName: string,
  completed: boolean,
  metadata?: Record<string, unknown>
) {
  try {
    const tracker = getTracker();
    tracker.trackConversion(eventType as ConversionType, stepName, 1, completed, undefined, metadata);
  } catch (error) {
    console.error('Failed to track conversion event:', error);
  }
}

// ============================================
// Custom Event Tracking
// ============================================

export interface CustomEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Track a custom event via the unified tracker.
 */
export async function trackEvent(event: CustomEvent) {
  try {
    const tracker = getTracker();
    tracker.trackEvent(event.category, event.action, event.label, event.value, event.metadata);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Hook for tracking custom events with common presets.
 */
export function useEventTracking() {
  const trackVideoPlay = (videoId: string, videoTitle?: string) => {
    trackEvent({ category: 'Video', action: 'play', label: videoTitle || videoId, metadata: { videoId } });
  };

  const trackVideoPause = (videoId: string, currentTime: number) => {
    trackEvent({ category: 'Video', action: 'pause', label: videoId, value: Math.round(currentTime), metadata: { currentTime } });
  };

  const trackVideoComplete = (videoId: string, duration: number) => {
    trackEvent({ category: 'Video', action: 'complete', label: videoId, value: Math.round(duration), metadata: { duration } });
  };

  const trackDownload = (fileName: string, fileType?: string) => {
    trackEvent({ category: 'Download', action: 'click', label: fileName, metadata: { fileType } });
  };

  const trackCtaClick = (ctaName: string, ctaLocation?: string) => {
    trackEvent({ category: 'CTA', action: 'click', label: ctaName, metadata: { location: ctaLocation } });
  };

  const trackExternalLink = (url: string, linkText?: string) => {
    trackEvent({ category: 'Outbound', action: 'click', label: url, metadata: { linkText } });
  };

  const trackFormStart = (formName: string) => {
    trackEvent({ category: 'Form', action: 'start', label: formName });
  };

  const trackFormSubmit = (formName: string, success: boolean) => {
    trackEvent({ category: 'Form', action: success ? 'submit_success' : 'submit_error', label: formName, value: success ? 1 : 0 });
  };

  const trackSearch = (searchTerm: string, resultsCount?: number) => {
    trackEvent({ category: 'Search', action: 'query', label: searchTerm, value: resultsCount });
  };

  const trackShare = (platform: string, contentType?: string) => {
    trackEvent({ category: 'Share', action: platform, label: contentType });
  };

  return {
    trackVideoPlay,
    trackVideoPause,
    trackVideoComplete,
    trackDownload,
    trackCtaClick,
    trackExternalLink,
    trackFormStart,
    trackFormSubmit,
    trackSearch,
    trackShare,
    trackEvent,
  };
}

// ============================================
// Funnel Tracking
// ============================================

/**
 * Track funnel steps via the unified tracker.
 */
export async function trackFunnelStep(
  funnelName: string,
  stepName: string,
  stepOrder: number,
  metadata?: Record<string, unknown>
) {
  try {
    const tracker = getTracker();
    tracker.trackConversion(funnelName as ConversionType, stepName, stepOrder, false, undefined, metadata);
  } catch (error) {
    console.error('Failed to track funnel step:', error);
  }
}

/**
 * Hook for tracking funnel progress.
 */
export function useFunnelTracking(funnelName: string) {
  const trackStep = (stepName: string, stepOrder: number, metadata?: Record<string, unknown>) => {
    return trackFunnelStep(funnelName, stepName, stepOrder, metadata);
  };

  const trackAppointmentFunnel = {
    viewPage: () => trackStep('Page vue', 1),
    clickCta: () => trackStep('CTA cliqué', 2),
    openForm: () => trackStep('Formulaire ouvert', 3),
    fillForm: () => trackStep('Formulaire rempli', 4),
    submitForm: () => trackStep('Formulaire soumis', 5),
    confirmBooking: () => trackStep('Réservation confirmée', 6),
  };

  const trackSeminarFunnel = {
    viewSeminar: () => trackStep('Séminaire vu', 1),
    clickRegister: () => trackStep('Inscription cliquée', 2),
    fillDetails: () => trackStep('Détails remplis', 3),
    confirmRegistration: () => trackStep('Inscription confirmée', 4),
  };

  return {
    trackStep,
    trackAppointmentFunnel,
    trackSeminarFunnel,
  };
}

/**
 * Track goal completion via the unified tracker.
 */
export async function trackGoalCompletion(goalId: string, value?: number) {
  try {
    const tracker = getTracker();
    tracker.trackEvent('Goal', 'completion', goalId, value);
  } catch (error) {
    console.error('Failed to track goal completion:', error);
  }
}
