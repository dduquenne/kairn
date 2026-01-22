"use client";

import { motion } from "framer-motion";
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { cn } from "@kairn/ui";

export interface ExecutiveSummaryComparison {
  current: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
  };
  previous: {
    totalVisits: number;
    uniqueSessions: number;
    averageTimeOnSite: number;
    conversionRate: number;
  };
  comparison: {
    totalVisitsChange: number;
    uniqueSessionsChange: number;
    averageTimeOnSiteChange: number;
    conversionRateChange: number;
  };
}

export interface Insight {
  type: "positive" | "negative" | "neutral" | "warning";
  message: string;
  metric?: string;
  value?: string;
}

export interface ExecutiveSummaryProps {
  /** Comparison data between periods */
  comparison: ExecutiveSummaryComparison | null;
  /** Current time range */
  timeRange: string;
  /** Top section/page name */
  topSection?: string;
  /** Top traffic source */
  topTrafficSource?: string;
  /** Callback when detailed report is clicked */
  onDetailedReportClick?: () => void;
  /** Custom insights to add */
  customInsights?: Insight[];
  /** Custom class names */
  className?: string;
  /** Labels configuration */
  labels?: {
    healthScore?: string;
    keyPoints?: string;
    quickActions?: string;
    viewDetailedReport?: string;
    excellent?: string;
    good?: string;
    needsAttention?: string;
    daily?: string;
    weekly?: string;
    monthly?: string;
    yearly?: string;
  };
}

/**
 * ExecutiveSummary - High-level dashboard summary with health score and insights
 *
 * @example
 * ```tsx
 * <ExecutiveSummary
 *   comparison={analyticsData}
 *   timeRange="weekly"
 *   topSection="Homepage"
 *   topTrafficSource="Google"
 *   onDetailedReportClick={() => router.push('/admin/analytics/details')}
 * />
 * ```
 */
export function ExecutiveSummary({
  comparison,
  timeRange,
  topSection,
  topTrafficSource,
  onDetailedReportClick,
  customInsights = [],
  className,
  labels = {},
}: ExecutiveSummaryProps) {
  const {
    healthScore: healthScoreLabel = "Score de sante",
    keyPoints = "Points cles",
    quickActions = "Actions rapides",
    viewDetailedReport = "Voir le rapport detaille",
    excellent = "Excellente performance",
    good = "Performance correcte",
    needsAttention = "Attention requise",
    daily = "Aujourd'hui",
    weekly = "Cette semaine",
    monthly = "Ce mois",
    yearly = "Cette annee",
  } = labels;

  if (!comparison) return null;

  const insights: Insight[] = [...customInsights];

  // Analyze visits trend
  const visitsChange = comparison.comparison.totalVisitsChange;
  if (Math.abs(visitsChange) > 10) {
    insights.push({
      type: visitsChange > 0 ? "positive" : "negative",
      message:
        visitsChange > 0
          ? `Visits increased by ${visitsChange.toFixed(1)}%`
          : `Visits decreased by ${Math.abs(visitsChange).toFixed(1)}%`,
      metric: "Visits",
      value: `${visitsChange >= 0 ? "+" : ""}${visitsChange.toFixed(1)}%`,
    });
  }

  // Analyze conversion rate
  if (comparison.current.conversionRate > 5) {
    insights.push({
      type: "positive",
      message: `Excellent conversion rate at ${comparison.current.conversionRate.toFixed(1)}%`,
      metric: "Conversion",
      value: `${comparison.current.conversionRate.toFixed(1)}%`,
    });
  } else if (comparison.current.conversionRate < 1) {
    insights.push({
      type: "warning",
      message: "Low conversion rate, consider optimizing CTAs",
      metric: "Conversion",
      value: `${comparison.current.conversionRate.toFixed(1)}%`,
    });
  }

  // Analyze session duration
  const avgTimeMinutes = comparison.current.averageTimeOnSite / 60000;
  if (avgTimeMinutes > 3) {
    insights.push({
      type: "positive",
      message: `Visitors stay an average of ${avgTimeMinutes.toFixed(0)} min`,
      metric: "Engagement",
    });
  } else if (avgTimeMinutes < 1) {
    insights.push({
      type: "warning",
      message: "Low average time on site - check content quality",
      metric: "Engagement",
    });
  }

  // Add top traffic source insight
  if (topTrafficSource) {
    insights.push({
      type: "neutral",
      message: `Top traffic source: ${topTrafficSource}`,
      metric: "Acquisition",
    });
  }

  // Add top section insight
  if (topSection) {
    insights.push({
      type: "neutral",
      message: `Most visited section: ${topSection}`,
      metric: "Content",
    });
  }

  // Calculate health score
  const calculateHealthScore = () => {
    let score = 50;

    if (visitsChange > 10) score += 15;
    else if (visitsChange > 0) score += 5;
    else if (visitsChange < -10) score -= 15;
    else if (visitsChange < 0) score -= 5;

    if (comparison.current.conversionRate > 5) score += 20;
    else if (comparison.current.conversionRate > 2) score += 10;
    else if (comparison.current.conversionRate < 1) score -= 10;

    if (avgTimeMinutes > 3) score += 15;
    else if (avgTimeMinutes < 1) score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const healthColor =
    healthScore >= 70
      ? "text-green-400"
      : healthScore >= 40
        ? "text-yellow-400"
        : "text-red-400";
  const healthBg =
    healthScore >= 70
      ? "bg-green-500/20"
      : healthScore >= 40
        ? "bg-yellow-500/20"
        : "bg-red-500/20";
  const healthLabel =
    healthScore >= 70 ? excellent : healthScore >= 40 ? good : needsAttention;

  const timeRangeLabels: Record<string, string> = {
    daily,
    weekly,
    monthly,
    yearly,
  };
  const timeRangeLabel = timeRangeLabels[timeRange] || timeRange;

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return <CheckCircle2 size={16} className="text-green-400" />;
      case "negative":
        return <TrendingDown size={16} className="text-red-400" />;
      case "warning":
        return <AlertTriangle size={16} className="text-yellow-400" />;
      default:
        return <Lightbulb size={16} className="text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-gold/30 bg-gradient-to-r from-gold/5 via-night/60 to-gold/5 p-5 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Health Score */}
        <div className="flex items-center gap-4 lg:border-r lg:border-gold/20 lg:pr-6">
          <div
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full",
              healthBg
            )}
          >
            <span className={cn("text-2xl font-bold", healthColor)}>{healthScore}</span>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-gold/10"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${(healthScore / 100) * 176} 176`}
                className={healthColor}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ivory/50">
              {healthScoreLabel}
            </p>
            <p className={cn("font-semibold", healthColor)}>{healthLabel}</p>
            <p className="text-xs text-ivory/40">{timeRangeLabel}</p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="flex-1">
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-ivory/50">
            <Lightbulb size={14} />
            {keyPoints}
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                {getInsightIcon(insight.type)}
                <span className="line-clamp-2 text-ivory/80">{insight.message}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {onDetailedReportClick && (
          <div className="flex flex-col gap-2 lg:border-l lg:border-gold/20 lg:pl-6">
            <p className="text-xs uppercase tracking-wider text-ivory/50">{quickActions}</p>
            <button
              onClick={onDetailedReportClick}
              className="flex cursor-pointer items-center gap-2 text-sm text-gold transition hover:text-gold/80"
            >
              <ArrowRight size={14} />
              <span>{viewDetailedReport}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
