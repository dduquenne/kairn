"use client";

import { motion } from "framer-motion";
import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WebVitalMetric {
  name: string;
  value: number;
  unit: string;
  rating: "good" | "needs-improvement" | "poor";
  previousValue?: number;
}

interface WebVitalsPanelProps {
  lcp: WebVitalMetric | null;
  inp: WebVitalMetric | null;
  cls: WebVitalMetric | null;
  fcp: WebVitalMetric | null;
  ttfb: WebVitalMetric | null;
  isLoading?: boolean;
}

const RATING_COLORS = {
  good: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Bon" },
  "needs-improvement": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "À améliorer" },
  poor: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Mauvais" },
};

// Google's recommended thresholds
const THRESHOLDS: Record<string, { good: number; poor: number; unit: string; description: string }> = {
  LCP: { good: 2500, poor: 4000, unit: "ms", description: "Largest Contentful Paint" },
  INP: { good: 200, poor: 500, unit: "ms", description: "Interaction to Next Paint" },
  CLS: { good: 0.1, poor: 0.25, unit: "", description: "Cumulative Layout Shift" },
  FCP: { good: 1800, poor: 3000, unit: "ms", description: "First Contentful Paint" },
  TTFB: { good: 800, poor: 1800, unit: "ms", description: "Time to First Byte" },
};

function VitalCard({ metric }: { metric: WebVitalMetric | null }) {
  if (!metric) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="text-sm text-gray-400">Pas de données</div>
      </div>
    );
  }

  const colors = RATING_COLORS[metric.rating];
  const threshold = THRESHOLDS[metric.name];

  const formatValue = (val: number, name: string) => {
    if (name === "CLS") return val.toFixed(3);
    if (val >= 1000) return `${(val / 1000).toFixed(1)}s`;
    return `${Math.round(val)}ms`;
  };

  const changePercent = metric.previousValue
    ? ((metric.value - metric.previousValue) / metric.previousValue) * 100
    : null;

  // For web vitals, lower is better (except we want to show improvement correctly)
  const isImprovement = changePercent !== null && changePercent < 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{metric.name}</span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
        >
          {colors.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl font-bold ${colors.text}`}>
          {formatValue(metric.value, metric.name)}
        </span>
      </div>

      {threshold && (
        <div className="text-xs text-gray-500 mb-2">{threshold.description}</div>
      )}

      {changePercent !== null && (
        <div className="flex items-center gap-1 text-xs">
          {isImprovement ? (
            <TrendingDown className="w-3 h-3 text-green-600" />
          ) : changePercent > 0 ? (
            <TrendingUp className="w-3 h-3 text-red-600" />
          ) : (
            <Minus className="w-3 h-3 text-gray-400" />
          )}
          <span className={isImprovement ? "text-green-600" : changePercent > 0 ? "text-red-600" : "text-gray-400"}>
            {Math.abs(changePercent).toFixed(1)}% vs période précédente
          </span>
        </div>
      )}

      {/* Threshold bar */}
      {threshold && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-gray-200 relative">
            <div
              className={`absolute h-full rounded-full ${
                metric.rating === "good"
                  ? "bg-green-500"
                  : metric.rating === "needs-improvement"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{
                width: `${Math.min((metric.value / threshold.poor) * 100, 100)}%`,
              }}
            />
            {/* Good threshold marker */}
            <div
              className="absolute top-0 h-full w-px bg-green-600"
              style={{ left: `${(threshold.good / threshold.poor) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>0</span>
            <span>{threshold.good}{threshold.unit}</span>
            <span>{threshold.poor}{threshold.unit}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function WebVitalsPanel({
  lcp,
  inp,
  cls,
  fcp,
  ttfb,
  isLoading = false,
}: WebVitalsPanelProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [lcp, inp, cls, fcp, ttfb].filter(Boolean);
  const goodCount = metrics.filter((m) => m?.rating === "good").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Overall score */}
      <div className="flex items-center gap-3">
        <Gauge className="w-5 h-5 text-gray-500" />
        <div>
          <span className="text-lg font-semibold text-gray-900">
            {goodCount}/{metrics.length}
          </span>
          <span className="text-sm text-gray-500 ml-2">
            métriques dans le vert (seuils Google)
          </span>
        </div>
      </div>

      {/* Core Web Vitals (LCP, INP, CLS) */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VitalCard metric={lcp} />
          <VitalCard metric={inp} />
          <VitalCard metric={cls} />
        </div>
      </div>

      {/* Other metrics (FCP, TTFB) */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Métriques complémentaires</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalCard metric={fcp} />
          <VitalCard metric={ttfb} />
        </div>
      </div>
    </motion.div>
  );
}
