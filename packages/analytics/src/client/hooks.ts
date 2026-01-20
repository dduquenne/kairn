"use client";

import { useEffect, useCallback, useRef } from 'react';
import { getTracker, initTracker } from './tracker';
import type { ConversionType, TrackerConfig } from '../types';

/**
 * Hook for automatic page tracking
 * Initializes the tracker and tracks page views on route changes
 */
export function usePageTracking(config?: Partial<TrackerConfig>) {
  const trackerRef = useRef(getTracker(config));

  useEffect(() => {
    const tracker = trackerRef.current;
    tracker.init();

    return () => {
      tracker.destroy();
    };
  }, []);

  // Track page view on mount (for route changes)
  useEffect(() => {
    trackerRef.current.trackPageView();
  }, []);

  return trackerRef.current;
}

/**
 * Hook for scroll depth tracking
 * Returns a function to manually trigger scroll tracking
 */
export function useScrollTracking() {
  const tracker = getTracker();

  const trackScroll = useCallback((depth: number) => {
    tracker.trackScrollDepth(depth);
  }, []);

  return { trackScroll };
}

/**
 * Hook for section time tracking
 * Returns ref callback to attach to sections
 */
export function useSectionTimeTracking(sectionId: string, sectionName?: string) {
  const tracker = getTracker();
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    tracker.observeSection(element, sectionId, sectionName);

    return () => {
      tracker.unobserveSection(element);
    };
  }, [sectionId, sectionName]);

  const setRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  return setRef;
}

/**
 * Hook for event tracking
 * Returns preset tracking methods
 */
export function useEventTracking() {
  const tracker = getTracker();

  const trackEvent = useCallback(
    (category: string, action: string, label?: string, value?: number) => {
      tracker.trackEvent(category, action, label, value);
    },
    []
  );

  const trackVideo = useCallback(
    (action: 'play' | 'pause' | 'complete' | 'progress', videoId: string, progress?: number) => {
      tracker.trackEvent('video', action, videoId, progress);
    },
    []
  );

  const trackDownload = useCallback((fileName: string, fileType?: string) => {
    tracker.trackEvent('download', 'click', fileName, undefined, { fileType });
  }, []);

  const trackCTA = useCallback((ctaName: string, ctaLocation: string) => {
    tracker.trackEvent('cta', 'click', ctaName, undefined, { location: ctaLocation });
  }, []);

  const trackForm = useCallback(
    (formName: string, action: 'start' | 'field_focus' | 'submit' | 'error', fieldName?: string) => {
      tracker.trackEvent('form', action, formName, undefined, { field: fieldName });
    },
    []
  );

  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    tracker.trackEvent('search', 'query', query, resultsCount);
  }, []);

  const trackShare = useCallback((platform: string, contentType: string, contentId?: string) => {
    tracker.trackEvent('share', platform, contentType, undefined, { contentId });
  }, []);

  return {
    trackEvent,
    trackVideo,
    trackDownload,
    trackCTA,
    trackForm,
    trackSearch,
    trackShare,
  };
}

/**
 * Hook for funnel tracking
 * Tracks user progress through conversion funnels
 */
export function useFunnelTracking() {
  const tracker = getTracker();

  const trackFunnelStep = useCallback(
    (
      conversionType: ConversionType,
      stepName: string,
      stepOrder: number,
      completed: boolean = false,
      value?: number,
      metadata?: Record<string, unknown>
    ) => {
      tracker.trackConversion(conversionType, stepName, stepOrder, completed, value, metadata);
    },
    []
  );

  // Pre-defined funnels
  const trackAppointmentFunnel = useCallback(
    (step: 'view_form' | 'fill_form' | 'submit_form' | 'confirm_booking', completed = false) => {
      const steps = {
        view_form: 1,
        fill_form: 2,
        submit_form: 3,
        confirm_booking: 4,
      };
      trackFunnelStep('appointment_request', step, steps[step], completed);
    },
    [trackFunnelStep]
  );

  const trackSeminarFunnel = useCallback(
    (step: 'view_seminar' | 'click_register' | 'fill_details' | 'confirm_registration', completed = false) => {
      const steps = {
        view_seminar: 1,
        click_register: 2,
        fill_details: 3,
        confirm_registration: 4,
      };
      trackFunnelStep('seminar_registration', step, steps[step], completed);
    },
    [trackFunnelStep]
  );

  const trackContactFunnel = useCallback(
    (step: 'view_form' | 'start_form' | 'submit_form' | 'success', completed = false) => {
      const steps = {
        view_form: 1,
        start_form: 2,
        submit_form: 3,
        success: 4,
      };
      trackFunnelStep('contact_form', step, steps[step], completed);
    },
    [trackFunnelStep]
  );

  return {
    trackFunnelStep,
    trackAppointmentFunnel,
    trackSeminarFunnel,
    trackContactFunnel,
  };
}

/**
 * Hook for article reading tracking
 * Tracks scroll depth, time on page, and completion
 */
export function useArticleReadingTracker(articleSlug: string) {
  const tracker = getTracker();
  const startTimeRef = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;
    completedRef.current = false;
  }, [articleSlug]);

  const updateScroll = useCallback((scrollPercent: number) => {
    if (scrollPercent > maxScrollRef.current) {
      maxScrollRef.current = scrollPercent;

      // Track completion at 90%+
      if (scrollPercent >= 90 && !completedRef.current) {
        completedRef.current = true;
        const timeOnPage = Date.now() - startTimeRef.current;
        tracker.trackEvent('article', 'complete', articleSlug, timeOnPage);
      }
    }
  }, [articleSlug]);

  const getReadingStats = useCallback(() => {
    return {
      scrollDepth: maxScrollRef.current,
      timeOnPage: Date.now() - startTimeRef.current,
      completed: completedRef.current,
    };
  }, []);

  return {
    updateScroll,
    getReadingStats,
  };
}
