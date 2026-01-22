// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb, ArrowRight } from "lucide-react";

interface ExecutiveSummaryProps {
  comparison: {
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
  } | null;
  timeRange: string;
  topSection?: string;
  topTrafficSource?: string;
  onDetailedReportClick?: () => void;
}

interface Insight {
  type: "positive" | "negative" | "neutral" | "warning";
  message: string;
  metric?: string;
  value?: string;
}

export function ExecutiveSummary({
  comparison,
  timeRange,
  topSection,
  topTrafficSource,
  onDetailedReportClick,
}: ExecutiveSummaryProps) {
  if (!comparison) return null;

  const insights: Insight[] = [];

  // Analyze visits trend
  const visitsChange = comparison.comparison.totalVisitsChange;
  if (Math.abs(visitsChange) > 10) {
    insights.push({
      type: visitsChange > 0 ? "positive" : "negative",
      message: visitsChange > 0
        ? `Les visites ont augmenté de ${visitsChange.toFixed(1)}%`
        : `Les visites ont diminué de ${Math.abs(visitsChange).toFixed(1)}%`,
      metric: "Visites",
      value: `${visitsChange >= 0 ? "+" : ""}${visitsChange.toFixed(1)}%`,
    });
  }

  // Analyze conversion rate
  const conversionChange = comparison.comparison.conversionRateChange;
  if (comparison.current.conversionRate > 5) {
    insights.push({
      type: "positive",
      message: `Excellent taux de conversion à ${comparison.current.conversionRate.toFixed(1)}%`,
      metric: "Conversion",
      value: `${comparison.current.conversionRate.toFixed(1)}%`,
    });
  } else if (comparison.current.conversionRate < 1) {
    insights.push({
      type: "warning",
      message: "Le taux de conversion est faible, envisagez d'optimiser vos CTAs",
      metric: "Conversion",
      value: `${comparison.current.conversionRate.toFixed(1)}%`,
    });
  }

  // Analyze session duration
  const avgTimeMinutes = comparison.current.averageTimeOnSite / 60000;
  if (avgTimeMinutes > 3) {
    insights.push({
      type: "positive",
      message: `Les visiteurs restent en moyenne ${avgTimeMinutes.toFixed(0)} min sur le site`,
      metric: "Engagement",
    });
  } else if (avgTimeMinutes < 1) {
    insights.push({
      type: "warning",
      message: "Temps moyen sur site faible - vérifiez la qualité du contenu",
      metric: "Engagement",
    });
  }

  // Add top traffic source insight
  if (topTrafficSource) {
    insights.push({
      type: "neutral",
      message: `Source principale de trafic : ${topTrafficSource}`,
      metric: "Acquisition",
    });
  }

  // Add top section insight
  if (topSection) {
    insights.push({
      type: "neutral",
      message: `Section la plus visitée : ${topSection}`,
      metric: "Contenu",
    });
  }

  // Calculate overall health score
  const calculateHealthScore = () => {
    let score = 50; // Base score

    // Visits trend impact
    if (visitsChange > 10) score += 15;
    else if (visitsChange > 0) score += 5;
    else if (visitsChange < -10) score -= 15;
    else if (visitsChange < 0) score -= 5;

    // Conversion rate impact
    if (comparison.current.conversionRate > 5) score += 20;
    else if (comparison.current.conversionRate > 2) score += 10;
    else if (comparison.current.conversionRate < 1) score -= 10;

    // Session duration impact
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
    healthScore >= 70
      ? "Excellente performance"
      : healthScore >= 40
        ? "Performance correcte"
        : "Attention requise";

  const timeRangeLabel = {
    daily: "Aujourd'hui",
    weekly: "Cette semaine",
    monthly: "Ce mois",
    yearly: "Cette année",
  }[timeRange] || "Période actuelle";

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
      className="rounded-xl border border-gold/30 bg-gradient-to-r from-gold/5 via-night/60 to-gold/5 p-5 backdrop-blur-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Health Score */}
        <div className="flex items-center gap-4 lg:border-r lg:border-gold/20 lg:pr-6">
          <div className={`relative w-16 h-16 ${healthBg} rounded-full flex items-center justify-center`}>
            <span className={`text-2xl font-bold ${healthColor}`}>{healthScore}</span>
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
            <p className="text-xs text-ivory/50 uppercase tracking-wider">Score de santé</p>
            <p className={`font-semibold ${healthColor}`}>{healthLabel}</p>
            <p className="text-xs text-ivory/40">{timeRangeLabel}</p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="flex-1">
          <p className="text-xs text-ivory/50 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lightbulb size={14} />
            Points clés
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                {getInsightIcon(insight.type)}
                <span className="text-ivory/80 line-clamp-2">{insight.message}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-2 lg:border-l lg:border-gold/20 lg:pl-6">
          <p className="text-xs text-ivory/50 uppercase tracking-wider">Actions rapides</p>
          <button
            onClick={onDetailedReportClick}
            className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition cursor-pointer"
          >
            <ArrowRight size={14} />
            <span>Voir le rapport détaillé</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
