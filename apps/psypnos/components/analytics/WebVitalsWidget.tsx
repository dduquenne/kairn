'use client';

/**
 * WebVitalsWidget Component
 *
 * Displays Web Vitals metrics in the admin analytics dashboard.
 * Shows current scores, historical trends, and rating indicators.
 */
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VitalsMetric {
  name: string;
  avg: number;
  p75: number;
  good: number;
  poor: number;
  count: number;
}

interface VitalsData {
  aggregates: Record<string, VitalsMetric>;
  count: number;
}

// Thresholds for each metric
const THRESHOLDS = {
  LCP: {
    good: 2500,
    unit: 'ms',
    label: 'Largest Contentful Paint',
    description: 'Temps de chargement du contenu principal',
  },
  INP: {
    good: 200,
    unit: 'ms',
    label: 'Interaction to Next Paint',
    description: 'Réactivité aux interactions',
  },
  CLS: { good: 0.1, unit: '', label: 'Cumulative Layout Shift', description: 'Stabilité visuelle' },
  FCP: {
    good: 1800,
    unit: 'ms',
    label: 'First Contentful Paint',
    description: 'Premier affichage de contenu',
  },
  TTFB: {
    good: 800,
    unit: 'ms',
    label: 'Time to First Byte',
    description: 'Temps de réponse du serveur',
  },
};

function getRating(value: number, threshold: number): 'good' | 'needs-improvement' | 'poor' {
  if (value <= threshold) return 'good';
  if (value <= threshold * 2) return 'needs-improvement';
  return 'poor';
}

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') {
    if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
    return `${Math.round(value)}ms`;
  }
  return value.toFixed(3);
}

interface WebVitalsWidgetProps {
  className?: string;
}

export function WebVitalsWidget({ className = '' }: WebVitalsWidgetProps) {
  const [data, setData] = useState<VitalsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchVitals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/web-vitals');
      if (!response.ok) throw new Error('Failed to fetch vitals');
      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Impossible de charger les métriques');
      console.error('Error fetching vitals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
    // Refresh every 5 minutes
    const interval = setInterval(fetchVitals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const metrics = Object.entries(THRESHOLDS).map(([name, config]) => {
    const metric = data?.aggregates?.[name];
    return {
      name,
      ...config,
      avg: metric?.avg || 0,
      p75: metric?.p75 || 0,
      goodCount: metric?.good || 0,
      poorCount: metric?.poor || 0,
      count: metric?.count || 0,
    };
  });

  const overallScore = metrics.reduce((acc, metric) => {
    if (metric.count === 0) return acc;
    const rating = getRating(metric.p75, metric.good);
    return acc + (rating === 'good' ? 1 : rating === 'needs-improvement' ? 0.5 : 0);
  }, 0);

  const activeMetrics = metrics.filter(m => m.count > 0).length;
  const scorePercent = activeMetrics > 0 ? Math.round((overallScore / activeMetrics) * 100) : 0;

  return (
    <div className={`border-ivory/10 bg-night/50 rounded-xl border p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <Activity className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-ivory font-semibold">Web Vitals</h3>
            <p className="text-ivory/50 text-xs">Core Web Vitals performance</p>
          </div>
        </div>
        <button
          onClick={fetchVitals}
          disabled={isLoading}
          className="text-ivory/50 hover:bg-ivory/5 hover:text-ivory flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
          aria-label="Rafraîchir"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && !data && (
        <div className="flex items-center justify-center py-8">
          <div className="border-gold h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={fetchVitals} className="mt-2 text-xs text-red-400 hover:text-red-300">
            Réessayer
          </button>
        </div>
      )}

      {/* Data Display */}
      {data && !error && (
        <>
          {/* Overall Score */}
          <div className="bg-ivory/5 mb-6 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-ivory/60 text-sm">Score global</span>
              <span
                className={`text-2xl font-bold ${
                  scorePercent >= 75
                    ? 'text-green-400'
                    : scorePercent >= 50
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {scorePercent}%
              </span>
            </div>
            <div className="bg-ivory/10 mt-2 h-2 w-full overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scorePercent}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  scorePercent >= 75
                    ? 'bg-green-500'
                    : scorePercent >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-ivory/40 mt-2 text-xs">Basé sur {data.count} mesures</p>
          </div>

          {/* Metrics Grid */}
          <div className="space-y-3">
            {metrics.map(metric => {
              const rating = getRating(metric.p75, metric.good);
              const ratingColor =
                rating === 'good'
                  ? 'text-green-400'
                  : rating === 'needs-improvement'
                    ? 'text-yellow-400'
                    : 'text-red-400';
              const bgColor =
                rating === 'good'
                  ? 'bg-green-500/10'
                  : rating === 'needs-improvement'
                    ? 'bg-yellow-500/10'
                    : 'bg-red-500/10';

              return (
                <div
                  key={metric.name}
                  className="border-ivory/5 hover:bg-ivory/5 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgColor}`}
                    >
                      {rating === 'good' ? (
                        <CheckCircle2 className={`h-4 w-4 ${ratingColor}`} />
                      ) : rating === 'needs-improvement' ? (
                        <Clock className={`h-4 w-4 ${ratingColor}`} />
                      ) : (
                        <AlertTriangle className={`h-4 w-4 ${ratingColor}`} />
                      )}
                    </div>
                    <div>
                      <p className="text-ivory text-sm font-medium">{metric.name}</p>
                      <p className="text-ivory/40 text-xs">{metric.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${ratingColor}`}>
                      {metric.count > 0 ? formatValue(metric.p75, metric.unit) : '-'}
                    </p>
                    <p className="text-ivory/40 text-xs">
                      {metric.count > 0 ? `p75 / ${metric.count} mesures` : 'Pas de données'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Last Updated */}
          {lastRefresh && (
            <p className="text-ivory/30 mt-4 text-center text-xs">
              Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </>
      )}

      {/* No Data State */}
      {data && data.count === 0 && (
        <div className="py-8 text-center">
          <Activity className="text-ivory/20 mx-auto mb-3 h-8 w-8" />
          <p className="text-ivory/40 text-sm">Pas encore de données</p>
          <p className="text-ivory/30 mt-1 text-xs">
            Les métriques apparaîtront après quelques visites
          </p>
        </div>
      )}
    </div>
  );
}

export default WebVitalsWidget;
