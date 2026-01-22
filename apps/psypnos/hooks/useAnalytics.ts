// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useEffect, useRef } from "react";
import { UAParser } from "ua-parser-js";

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const key = "psypnos_session_id";
  let sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Enrich page visit data with UTM parameters, device info, browser, OS, etc.
 * This is a MAJOR improvement that automatically collects all analytics data.
 */
function enrichPageVisitData() {
  if (typeof window === "undefined") {
    return {
      sessionId: "",
      page: "",
      referrer: undefined,
      userAgent: undefined,
    };
  }

  // 1. Parse User-Agent for device, browser, OS
  const parser = new UAParser();
  const result = parser.getResult();

  // 2. Extract UTM parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get("utm_source") || undefined;
  const utmMedium = urlParams.get("utm_medium") || undefined;
  const utmCampaign = urlParams.get("utm_campaign") || undefined;
  const utmTerm = urlParams.get("utm_term") || undefined;
  const utmContent = urlParams.get("utm_content") || undefined;

  // 3. Extract referrer domain
  let referrerDomain = undefined;
  if (document.referrer) {
    try {
      const url = new URL(document.referrer);
      referrerDomain = url.hostname;
    } catch (e) {
      // Invalid URL, ignore
    }
  }

  // 4. Detect device type
  const deviceType = result.device.type === "mobile"
    ? "mobile"
    : result.device.type === "tablet"
      ? "tablet"
      : "desktop";

  // 5. Bot detection (simple heuristic)
  const isBot = /bot|crawler|spider|crawling|headless/i.test(navigator.userAgent);

  return {
    sessionId: getSessionId(),
    page: window.location.pathname,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,

    // UTM Attribution
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    referrerDomain,

    // Device & Browser
    deviceType,
    browser: result.browser.name || undefined,
    os: result.os.name || undefined,

    // Bot detection
    isBot,
  };
}

/**
 * Track page visits with enriched data
 * Now automatically collects UTM, device, browser, OS, referrer domain, and bot detection
 */
export function usePageTracking() {
  const hasTrackedRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Early return if server-side or analytics disabled
    if (typeof window === "undefined") return;
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return;

    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    startTimeRef.current = Date.now();

    const trackPageVisit = async () => {
      try {
        const enrichedData = enrichPageVisitData();

        await fetch("/api/analytics/page-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(enrichedData),
        });
      } catch (error) {
        console.error("Failed to track page visit:", error);
      }
    };

    // Send page visit immediately
    trackPageVisit();

    // Track time on page when user leaves
    const sendTimeOnPage = () => {
      const timeOnPage = Date.now() - startTimeRef.current;

      // Use sendBeacon for reliability when page is unloading
      const data = new FormData();
      data.append("sessionId", getSessionId());
      data.append("page", window.location.pathname);
      data.append("timeOnPage", timeOnPage.toString());

      navigator.sendBeacon("/api/analytics/time-on-page", data);
    };

    // Listen to page unload
    window.addEventListener("beforeunload", sendTimeOnPage);

    return () => {
      window.removeEventListener("beforeunload", sendTimeOnPage);
      // Also send on unmount
      sendTimeOnPage();
    };
  }, []);
}

/**
 * Track scroll depth on the page
 * Measures user engagement by how far they scroll
 */
export function useScrollTracking() {
  const maxScrollRef = useRef<number>(0);
  const hasSentRef = useRef<boolean>(false);

  useEffect(() => {
    // Early return if server-side or analytics disabled
    if (typeof window === "undefined") return;
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Calculate scroll percentage
      const scrollPercent = Math.round(
        (scrollTop / (documentHeight - windowHeight)) * 100
      );

      // Track maximum scroll depth
      if (scrollPercent > maxScrollRef.current) {
        maxScrollRef.current = Math.min(scrollPercent, 100);
      }
    };

    const sendScrollDepth = () => {
      if (hasSentRef.current) return;
      hasSentRef.current = true;

      const data = new FormData();
      data.append("sessionId", getSessionId());
      data.append("page", window.location.pathname);
      data.append("scrollDepthPercent", maxScrollRef.current.toString());

      navigator.sendBeacon("/api/analytics/scroll-depth", data);
    };

    // Listen to scroll events (throttled by browser for performance)
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Send scroll depth when user leaves
    window.addEventListener("beforeunload", sendScrollDepth);

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", sendScrollDepth);
      sendScrollDepth();
    };
  }, []);
}

/**
 * Track time spent on section (only when visible)
 * Uses IntersectionObserver for accurate visibility tracking
 */
export function useSectionTimeTracking(sectionId: string) {
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Early return if analytics are disabled
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") {
      return;
    }

    // If element not provided, start tracking immediately (fallback)
    if (!elementRef.current) {
      startTimeRef.current = Date.now();
      isVisibleRef.current = true;
    }

    // Intersection Observer: Only track when section is visible in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Section became visible
          if (!isVisibleRef.current) {
            startTimeRef.current = Date.now();
            isVisibleRef.current = true;
          }
        } else {
          // Section became hidden - send accumulated time
          if (isVisibleRef.current && startTimeRef.current) {
            const timeSpent = Date.now() - startTimeRef.current;
            isVisibleRef.current = false;

            // Send immediately when section goes out of view
            fetch("/api/analytics/section-time", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: getSessionId(),
                section: sectionId,
                timeSpent,
              }),
            }).catch((error) =>
              console.error("Failed to track section time:", error)
            );
          }
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of section is visible
        rootMargin: "0px",
      }
    );

    // Find the section element
    const sectionElement = document.getElementById(sectionId) ||
      document.querySelector(`[data-section="${sectionId}"]`) ||
      elementRef.current;

    if (sectionElement) {
      observer.observe(sectionElement);
      elementRef.current = sectionElement;
    }

    // Fallback: Send periodic tracking every 30 seconds if visible
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current && startTimeRef.current) {
        const timeSpent = Date.now() - startTimeRef.current;
        fetch("/api/analytics/section-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: getSessionId(),
            section: sectionId,
            timeSpent,
          }),
        }).catch((error) =>
          console.error("Failed to track section time:", error)
        );
        // Reset timer
        startTimeRef.current = Date.now();
      }
    }, 30000);

    return () => {
      // Cleanup
      observer.disconnect();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Send final time if section was visible
      if (isVisibleRef.current && startTimeRef.current) {
        const timeSpent = Date.now() - startTimeRef.current;
        const formData = new FormData();
        formData.append("sessionId", getSessionId());
        formData.append("section", sectionId);
        formData.append("timeSpent", timeSpent.toString());

        navigator.sendBeacon("/api/analytics/section-time", formData);
      }
    };
  }, [sectionId]);

  return elementRef;
}

/**
 * Track conversion events
 * Records user actions in the conversion funnel
 */
export async function trackConversionEvent(
  eventType: "appointment_request" | "seminar_registration" | "contact_form",
  stepName: string,
  completed: boolean,
  metadata?: Record<string, unknown>,
) {
  try {
    await fetch("/api/analytics/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        eventType,
        stepName,
        completed,
        metadata,
      }),
    });
  } catch (error) {
    console.error("Failed to track conversion event:", error);
  }
}

/**
 * Track custom events beyond conversions
 * Useful for tracking any user interaction
 */
export interface CustomEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(event: CustomEvent) {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        timestamp: new Date().toISOString(),
        ...event,
      }),
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

/**
 * Hook for tracking custom events with common presets
 * Provides convenient methods for tracking video, download, CTA clicks, etc.
 */
export function useEventTracking() {
  const trackVideoPlay = (videoId: string, videoTitle?: string) => {
    trackEvent({
      category: "Video",
      action: "play",
      label: videoTitle || videoId,
      metadata: { videoId },
    });
  };

  const trackVideoPause = (videoId: string, currentTime: number) => {
    trackEvent({
      category: "Video",
      action: "pause",
      label: videoId,
      value: Math.round(currentTime),
      metadata: { currentTime },
    });
  };

  const trackVideoComplete = (videoId: string, duration: number) => {
    trackEvent({
      category: "Video",
      action: "complete",
      label: videoId,
      value: Math.round(duration),
      metadata: { duration },
    });
  };

  const trackDownload = (fileName: string, fileType?: string) => {
    trackEvent({
      category: "Download",
      action: "click",
      label: fileName,
      metadata: { fileType },
    });
  };

  const trackCtaClick = (ctaName: string, ctaLocation?: string) => {
    trackEvent({
      category: "CTA",
      action: "click",
      label: ctaName,
      metadata: { location: ctaLocation },
    });
  };

  const trackExternalLink = (url: string, linkText?: string) => {
    trackEvent({
      category: "Outbound",
      action: "click",
      label: url,
      metadata: { linkText },
    });
  };

  const trackFormStart = (formName: string) => {
    trackEvent({
      category: "Form",
      action: "start",
      label: formName,
    });
  };

  const trackFormSubmit = (formName: string, success: boolean) => {
    trackEvent({
      category: "Form",
      action: success ? "submit_success" : "submit_error",
      label: formName,
      value: success ? 1 : 0,
    });
  };

  const trackSearch = (searchTerm: string, resultsCount?: number) => {
    trackEvent({
      category: "Search",
      action: "query",
      label: searchTerm,
      value: resultsCount,
    });
  };

  const trackShare = (platform: string, contentType?: string) => {
    trackEvent({
      category: "Share",
      action: platform,
      label: contentType,
    });
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
    trackEvent, // Generic tracking
  };
}

/**
 * Track funnel steps for conversion analysis
 * Use this to track user progress through multi-step processes
 */
export async function trackFunnelStep(
  funnelName: string,
  stepName: string,
  stepOrder: number,
  metadata?: Record<string, unknown>
) {
  try {
    await fetch("/api/analytics/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        funnelName,
        stepName,
        stepOrder,
        metadata,
      }),
    });
  } catch (error) {
    console.error("Failed to track funnel step:", error);
  }
}

/**
 * Hook for tracking funnel progress
 * Provides a convenient way to track multi-step processes
 */
export function useFunnelTracking(funnelName: string) {
  const trackStep = (stepName: string, stepOrder: number, metadata?: Record<string, unknown>) => {
    return trackFunnelStep(funnelName, stepName, stepOrder, metadata);
  };

  // Pre-defined funnel for appointment booking
  const trackAppointmentFunnel = {
    viewPage: () => trackStep("Page vue", 1),
    clickCta: () => trackStep("CTA cliqué", 2),
    openForm: () => trackStep("Formulaire ouvert", 3),
    fillForm: () => trackStep("Formulaire rempli", 4),
    submitForm: () => trackStep("Formulaire soumis", 5),
    confirmBooking: () => trackStep("Réservation confirmée", 6),
  };

  // Pre-defined funnel for seminar registration
  const trackSeminarFunnel = {
    viewSeminar: () => trackStep("Séminaire vu", 1),
    clickRegister: () => trackStep("Inscription cliquée", 2),
    fillDetails: () => trackStep("Détails remplis", 3),
    confirmRegistration: () => trackStep("Inscription confirmée", 4),
  };

  return {
    trackStep,
    trackAppointmentFunnel,
    trackSeminarFunnel,
  };
}

/**
 * Track goal completion for goal-based analytics
 */
export async function trackGoalCompletion(goalId: string, value?: number) {
  try {
    await fetch("/api/analytics/goals/completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        goalId,
        value,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Failed to track goal completion:", error);
  }
}
