'use client';

import { useEffect, useRef, useCallback } from 'react';

import { getSessionManager } from '@/lib/tracking';

interface ReadingMetrics {
  slug: string;
  scrollDepthPercent: number;
  timeOnPage: number;
  completed: boolean;
}

declare global {
  interface Window {
    clarity?: (method: string, key: string, value: string) => void;
  }
}

/**
 * Gets session ID from the main analytics tracker for correlation,
 * with fallback to a blog-specific session ID.
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const sessionManager = getSessionManager();
    const sessionId = sessionManager.getSessionId();
    if (sessionId) return sessionId;
  } catch {
    // Tracker not initialized yet, use fallback
  }

  let sessionId = sessionStorage.getItem('blog_session_id');
  if (!sessionId) {
    sessionId = `blog_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('blog_session_id', sessionId);
  }
  return sessionId;
}

function sendBeacon(url: string, data: object): void {
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } else {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {});
  }
}

function sendClarityEvent(eventName: string, value: string): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('set', eventName, value);
  }
}

/**
 * Hook to track article reading engagement:
 * - Maximum scroll depth percentage
 * - Time spent on article
 * - Whether article was completed (90%+ scrolled)
 *
 * Sends data to /api/blog/analytics/engagement on page unload.
 * Uses a deduplication flag to prevent multiple beacon sends.
 */
export function useArticleReadingTracker(slug: string) {
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const hasTrackedViewRef = useRef<boolean>(false);
  const lastSentDepthRef = useRef<number>(0);
  const hasSentFinalRef = useRef<boolean>(false);

  const calculateScrollDepth = useCallback((): number => {
    if (typeof window === 'undefined') return 0;

    const scrolled = window.scrollY;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (totalHeight <= 0) return 100;

    return Math.min(100, Math.round((scrolled / totalHeight) * 100));
  }, []);

  const sendEngagementData = useCallback((isFinal: boolean = false) => {
    // Deduplicate: only send final data once
    if (isFinal) {
      if (hasSentFinalRef.current) return;
      hasSentFinalRef.current = true;
    }

    const timeOnPage = Date.now() - startTimeRef.current;
    const scrollDepthPercent = maxScrollDepthRef.current;
    const completed = scrollDepthPercent >= 90;

    const data: ReadingMetrics = {
      slug,
      scrollDepthPercent,
      timeOnPage,
      completed,
    };

    sendBeacon('/api/blog/analytics/engagement', {
      ...data,
      sessionId: getSessionId(),
      isFinal,
    });

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

    const timer = setTimeout(() => {
      fetch('/api/blog/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          sessionId: getSessionId(),
        }),
      }).catch(console.error);

      sendClarityEvent('article_view', slug);
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const currentDepth = calculateScrollDepth();

      if (currentDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = currentDepth;

        const milestones = [25, 50, 75, 90, 100];
        for (const milestone of milestones) {
          if (currentDepth >= milestone && lastSentDepthRef.current < milestone) {
            sendClarityEvent('scroll_milestone', `${milestone}%`);
            lastSentDepthRef.current = milestone;
          }
        }
      }
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [calculateScrollDepth]);

  // Send data on page unload or visibility change
  // Use a single handler with deduplication to avoid sending 2-4 beacons
  useEffect(() => {
    const handlePageLeave = () => {
      sendEngagementData(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendEngagementData(true);
      }
    };

    // visibilitychange fires reliably on modern browsers
    // pagehide is the fallback for older browsers
    // We use the dedup flag in sendEngagementData to prevent multiple sends
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageLeave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageLeave);
    };
  }, [sendEngagementData]);

  // Cleanup: send final data when component unmounts (SPA navigation)
  useEffect(() => {
    return () => {
      sendEngagementData(true);
    };
  }, [sendEngagementData]);
}
