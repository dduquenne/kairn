'use client';

/**
 * WebVitalsReporter Component
 *
 * Monitors and reports Core Web Vitals metrics to the analytics system.
 * Uses the web-vitals library to capture LCP, FID, CLS, FCP, and TTFB.
 *
 * Metrics are sent to:
 * 1. The internal analytics tracker (for dashboard)
 * 2. Console in development mode (for debugging)
 *
 * @see https://web.dev/vitals/
 */
import { useEffect, useRef } from 'react';
import type { Metric } from 'web-vitals';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import { getTracker } from '@/lib/tracking';

// Metric thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay (deprecated, using INP)
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

type MetricName = keyof typeof THRESHOLDS;

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

interface WebVitalsReporterProps {
  /** Enable console logging in development */
  debug?: boolean;
  /** Custom callback for handling metrics */
  onMetric?: (metric: Metric) => void;
}

export function WebVitalsReporter({
  debug = process.env.NODE_ENV === 'development',
  onMetric,
}: WebVitalsReporterProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initialized.current) return;
    initialized.current = true;

    const handleMetric = (metric: Metric) => {
      const { name, value, rating, id, navigationType, delta } = metric;

      // Custom callback if provided
      if (onMetric) {
        onMetric(metric);
      }

      // Debug logging
      if (debug) {
        const ratingEmoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(
          `[WebVitals] ${ratingEmoji} ${name}: ${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'} (${rating})`
        );
      }

      // Send to analytics tracker
      try {
        const tracker = getTracker();

        // Track as custom event with all metric details
        tracker.trackEvent(
          'web_vitals',
          name.toLowerCase(),
          JSON.stringify({
            metric: name,
            value: Math.round(value * 100) / 100,
            rating,
            delta: Math.round(delta * 100) / 100,
            navigationType,
            id,
            url: window.location.pathname,
            timestamp: Date.now(),
          })
        );

        // Also track poor performance as conversion events for alerting
        if (rating === 'poor') {
          tracker.trackConversion('performance_issue', `poor_${name.toLowerCase()}`, value, false);
        }
      } catch (error) {
        // Tracker might not be initialized yet
        if (debug) {
          console.warn('[WebVitals] Failed to send metric to tracker:', error);
        }
      }
    };

    // Register all Web Vitals observers
    onLCP(handleMetric);
    onINP(handleMetric);
    onCLS(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);

    // Log initialization
    if (debug) {
      console.log('[WebVitals] Monitoring initialized');
    }
  }, [debug, onMetric]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to get current Web Vitals metrics
 * Useful for displaying metrics in admin dashboard
 */
export function useWebVitalsMetrics() {
  const metricsRef = useRef<Map<string, Metric>>(new Map());

  useEffect(() => {
    const updateMetric = (metric: Metric) => {
      metricsRef.current.set(metric.name, metric);
    };

    onLCP(updateMetric);
    onINP(updateMetric);
    onCLS(updateMetric);
    onFCP(updateMetric);
    onTTFB(updateMetric);
  }, []);

  return metricsRef;
}

export default WebVitalsReporter;
