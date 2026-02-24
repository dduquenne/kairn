/**
 * Analytics Tracking Hooks
 *
 * All tracking functions now delegate to the unified @kairn/analytics tracker
 * which batches events and sends them via /api/analytics/track.
 *
 * Legacy individual endpoints (/page-visit, /scroll-depth, /section-time, etc.)
 * are no longer used directly from client code.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

import { initTracker, getTracker, type ConversionType } from '@/lib/tracking';

// ============================================
// Page Tracking
// ============================================

/**
 * Track page visits via the unified tracker.
 * The tracker handles UA parsing, UTM extraction, session management,
 * and batched sending automatically.
 */
export function usePageTracking() {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') return;
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    initTracker();
  }, []);
}

// ============================================
// Scroll Tracking
// ============================================

/**
 * Track scroll depth via the unified tracker.
 * The tracker already has built-in scroll tracking with threshold detection.
 */
export function useScrollTracking() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') return;

    // The unified tracker handles scroll tracking automatically
    // when initialized via initTracker() in usePageTracking
  }, []);
}

// ============================================
// Section Time Tracking
// ============================================

/**
 * Track time spent on a section via the unified tracker's
 * IntersectionObserver-based section tracking.
 */
export function useSectionTimeTracking(sectionId: string) {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') return;

    const sectionElement =
      document.getElementById(sectionId) ||
      document.querySelector(`[data-section="${sectionId}"]`) ||
      elementRef.current;

    if (sectionElement) {
      const tracker = getTracker();
      tracker.observeSection(sectionElement as HTMLElement, sectionId);
      elementRef.current = sectionElement as HTMLElement;
    }

    return () => {
      if (elementRef.current) {
        const tracker = getTracker();
        tracker.unobserveSection(elementRef.current);
      }
    };
  }, [sectionId]);

  return elementRef;
}

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
