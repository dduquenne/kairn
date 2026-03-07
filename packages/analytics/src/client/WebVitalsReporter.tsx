'use client';

/**
 * WebVitalsReporter Component
 *
 * Monitore et rapporte les Core Web Vitals au système analytics.
 * Utilise la bibliothèque web-vitals pour capturer LCP, INP, CLS, FCP et TTFB.
 *
 * Ce composant est headless (ne rend rien visuellement).
 *
 * @module analytics/client/WebVitalsReporter
 * @see https://web.dev/vitals/
 */

import { useEffect, useRef } from 'react';

import { getTracker } from './tracker';

/**
 * Représentation d'une métrique Web Vital
 */
export interface WebVitalMetric {
  /** Nom de la métrique (LCP, INP, CLS, etc.) */
  name: string;
  /** Valeur mesurée */
  value: number;
  /** Évaluation de la performance */
  rating: 'good' | 'needs-improvement' | 'poor';
  /** Delta depuis la dernière mesure */
  delta: number;
  /** Identifiant unique de la mesure */
  id: string;
  /** Type de navigation */
  navigationType?: string;
}

/** Seuils des métriques basés sur les recommandations Google */
const THRESHOLDS: Record<string, { good: number; needsImprovement: number }> = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

/**
 * Props du composant WebVitalsReporter
 */
export interface WebVitalsReporterProps {
  /** Activer le logging console en développement */
  debug?: boolean;
  /** Callback personnalisé pour chaque métrique */
  onMetric?: (metric: WebVitalMetric) => void;
  /** Désactiver le tracking des métriques pauvres comme conversions */
  disablePerformanceAlerts?: boolean;
  /** Fonction d'import dynamique de web-vitals (injection de dépendance) */
  webVitalsLoader?: () => Promise<{
    onLCP: (cb: (metric: WebVitalMetric) => void) => void;
    onINP: (cb: (metric: WebVitalMetric) => void) => void;
    onCLS: (cb: (metric: WebVitalMetric) => void) => void;
    onFCP: (cb: (metric: WebVitalMetric) => void) => void;
    onTTFB: (cb: (metric: WebVitalMetric) => void) => void;
  }>;
}

/**
 * Évalue le rating d'une métrique par rapport aux seuils
 */
export function evaluateMetricRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Composant headless de reporting Web Vitals.
 *
 * Capture les Core Web Vitals et les envoie au tracker analytics.
 * Supporte l'injection de dépendance pour la bibliothèque web-vitals
 * afin d'éviter une dépendance directe dans le package analytics.
 *
 * @example
 * ```tsx
 * <WebVitalsReporter
 *   webVitalsLoader={() => import('web-vitals')}
 *   debug={process.env.NODE_ENV === 'development'}
 * />
 * ```
 */
export function WebVitalsReporter({
  debug = false,
  onMetric,
  disablePerformanceAlerts = false,
  webVitalsLoader,
}: WebVitalsReporterProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!webVitalsLoader) return;

    initialized.current = true;

    const handleMetric = (metric: WebVitalMetric) => {
      const { name, value, rating, id, delta, navigationType } = metric;

      if (onMetric) {
        onMetric(metric);
      }

      if (debug) {
        const ratingLabel =
          rating === 'good' ? '[OK]' : rating === 'needs-improvement' ? '[WARN]' : '[POOR]';
        console.warn(
          `[WebVitals] ${ratingLabel} ${name}: ${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'} (${rating})`
        );
      }

      try {
        const tracker = getTracker();

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
            url: typeof window !== 'undefined' ? window.location.pathname : '',
            timestamp: Date.now(),
          })
        );

        if (!disablePerformanceAlerts && rating === 'poor') {
          tracker.trackConversion('performance_issue', `poor_${name.toLowerCase()}`, value, false);
        }
      } catch {
        if (debug) {
          console.warn('[WebVitals] Failed to send metric to tracker');
        }
      }
    };

    webVitalsLoader()
      .then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => {
        onLCP(handleMetric);
        onINP(handleMetric);
        onCLS(handleMetric);
        onFCP(handleMetric);
        onTTFB(handleMetric);

        if (debug) {
          console.warn('[WebVitals] Monitoring initialized');
        }
      })
      .catch(error => {
        if (debug) {
          console.warn('[WebVitals] Failed to load web-vitals library:', error);
        }
      });
  }, [debug, onMetric, disablePerformanceAlerts, webVitalsLoader]);

  return null;
}
