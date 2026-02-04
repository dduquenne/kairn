/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ReadingMetrics {
  slug: string;
  scrollDepthPercent: number;
  timeOnPage: number;
  completed: boolean;
}

// Generate a simple session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('blog_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('blog_session_id', sessionId);
  }
  return sessionId;
}

// Send data using Beacon API (works even during page unload)
function sendBeacon(url: string, data: object): void {
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } else {
    // Fallback for browsers without sendBeacon
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {});
  }
}

// Send event to Microsoft Clarity
function sendClarityEvent(eventName: string, value: string): void {
  if (typeof window !== 'undefined' && (window as any).clarity) {
    (window as any).clarity('set', eventName, value);
  }
}

/**
 * Hook to track article reading engagement:
 * - Maximum scroll depth percentage
 * - Time spent on article
 * - Whether article was completed (90%+ scrolled)
 *
 * Sends data to /api/blog/analytics/engagement on page unload
 * Also sends custom events to Microsoft Clarity
 */
export function useArticleReadingTracker(slug: string) {
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const hasTrackedViewRef = useRef<boolean>(false);
  const lastSentDepthRef = useRef<number>(0);

  // Calculate current scroll depth
  const calculateScrollDepth = useCallback((): number => {
    if (typeof window === 'undefined') return 0;

    const scrolled = window.scrollY;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (totalHeight <= 0) return 100;

    return Math.min(100, Math.round((scrolled / totalHeight) * 100));
  }, []);

  // Send engagement data
  const sendEngagementData = useCallback((isFinal: boolean = false) => {
    const timeOnPage = Date.now() - startTimeRef.current;
    const scrollDepthPercent = maxScrollDepthRef.current;
    const completed = scrollDepthPercent >= 90;

    const data: ReadingMetrics = {
      slug,
      scrollDepthPercent,
      timeOnPage,
      completed,
    };

    // Send to our API
    sendBeacon('/api/blog/analytics/engagement', {
      ...data,
      sessionId: getSessionId(),
      isFinal,
    });

    // Send to Clarity
    sendClarityEvent('article_read_depth', `${scrollDepthPercent}%`);
    sendClarityEvent('article_time_spent', `${Math.round(timeOnPage / 1000)}s`);

    if (completed) {
      sendClarityEvent('article_completed', 'true');
    }
  }, [slug]);

  // Track initial view
  useEffect(() => {
    if (hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;

    // Track initial view after short delay
    const timer = setTimeout(() => {
      fetch('/api/blog/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          sessionId: getSessionId(),
        }),
      }).catch(console.error);

      // Send to Clarity
      sendClarityEvent('article_view', slug);
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const currentDepth = calculateScrollDepth();

      // Only update if we scrolled further
      if (currentDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = currentDepth;

        // Send milestone events to Clarity (25%, 50%, 75%, 90%, 100%)
        const milestones = [25, 50, 75, 90, 100];
        for (const milestone of milestones) {
          if (currentDepth >= milestone && lastSentDepthRef.current < milestone) {
            sendClarityEvent('scroll_milestone', `${milestone}%`);
            lastSentDepthRef.current = milestone;
          }
        }
      }
    };

    // Initial calculation
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [calculateScrollDepth]);

  // Send data on page unload or visibility change
  useEffect(() => {
    const handleUnload = () => {
      sendEngagementData(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendEngagementData(false);
      }
    };

    // Modern browsers prefer visibilitychange over beforeunload
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [sendEngagementData]);

  // Cleanup: send final data when component unmounts (SPA navigation)
  useEffect(() => {
    return () => {
      sendEngagementData(true);
    };
  }, [sendEngagementData]);
}
