// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

interface VitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  timestamp: number;
}

/**
 * Envoie les métriques Web Vitals à l'API analytics
 */
function sendToAnalytics(metric: Metric) {
  const { name, value, rating, delta, id } = metric;

  const vitalsData: VitalsMetric = {
    id,
    name,
    value,
    rating,
    delta,
    timestamp: Date.now(),
  };

  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', vitalsData);
  }

  // Envoyer à l'API en production
  if (typeof navigator.sendBeacon === 'function') {
    const body = JSON.stringify(vitalsData);
    navigator.sendBeacon('/api/analytics/web-vitals', body);
  } else {
    // Fallback pour navigateurs sans sendBeacon
    fetch('/api/analytics/web-vitals', {
      body: JSON.stringify(vitalsData),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(console.error);
  }
}

/**
 * Initialise le monitoring des Web Vitals
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics); // INP a remplacé FID dans web-vitals v3
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);

    console.log('✅ Web Vitals monitoring initialisé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des Web Vitals:', error);
  }
}

/**
 * Obtient un rapport des Web Vitals actuels
 */
export async function getWebVitalsReport(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const vitals: Record<string, number> = {};

    const checkComplete = () => {
      if (Object.keys(vitals).length >= 5) {
        resolve(vitals);
      }
    };

    onCLS((metric) => {
      vitals.CLS = metric.value;
      checkComplete();
    });

    onINP((metric) => {
      vitals.INP = metric.value;
      checkComplete();
    });

    onFCP((metric) => {
      vitals.FCP = metric.value;
      checkComplete();
    });

    onLCP((metric) => {
      vitals.LCP = metric.value;
      checkComplete();
    });

    onTTFB((metric) => {
      vitals.TTFB = metric.value;
      checkComplete();
    });

    // Timeout après 10 secondes
    setTimeout(() => resolve(vitals), 10000);
  });
}

/**
 * Évalue si les Web Vitals sont bons
 */
export function evaluateWebVitals(vitals: Record<string, number>) {
  const thresholds = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const results: Record<string, 'good' | 'needs-improvement' | 'poor'> = {};

  Object.entries(vitals).forEach(([metric, value]) => {
    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) {
      results[metric] = 'good';
      return;
    }

    if (value <= threshold.good) {
      results[metric] = 'good';
    } else if (value <= threshold.poor) {
      results[metric] = 'needs-improvement';
    } else {
      results[metric] = 'poor';
    }
  });

  return results;
}
