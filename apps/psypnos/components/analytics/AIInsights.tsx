// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface Insight {
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  metric?: string;
  value?: string | number;
}

interface AIInsightsProps {
  timeRange?: "day" | "week" | "month" | "year";
}

export function AIInsights({ timeRange = "week" }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Track if insights have ever been loaded (on-demand generation)
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/insights?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }

      const data = await response.json();
      setInsights(data.insights || []);
      setHasLoaded(true);
    } catch (err) {
      console.error("Error loading AI insights:", err);
      setError("Impossible de charger les insights IA");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInsights();
    setIsRefreshing(false);
  };

  // Handle initial generation button click
  const handleGenerate = () => {
    loadInsights();
  };

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return <TrendingUp className="h-5 w-5" />;
      case "negative":
        return <TrendingDown className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColorClasses = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return {
          border: "border-green-500/30",
          bg: "bg-green-500/10",
          text: "text-green-400",
          badge: "bg-green-500/20 text-green-300",
        };
      case "negative":
        return {
          border: "border-red-500/30",
          bg: "bg-red-500/10",
          text: "text-red-400",
          badge: "bg-red-500/20 text-red-300",
        };
      case "warning":
        return {
          border: "border-yellow-500/30",
          bg: "bg-yellow-500/10",
          text: "text-yellow-400",
          badge: "bg-yellow-500/20 text-yellow-300",
        };
      default:
        return {
          border: "border-blue-500/30",
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          badge: "bg-blue-500/20 text-blue-300",
        };
    }
  };

  const getPriorityLabel = (priority: Insight["priority"]) => {
    switch (priority) {
      case "high":
        return "Haute priorité";
      case "medium":
        return "Priorité moyenne";
      case "low":
        return "Basse priorité";
    }
  };

  const getPriorityColor = (priority: Insight["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300";
      case "low":
        return "bg-blue-500/20 text-blue-300";
    }
  };

  // Show initial state with "Generate" button when insights haven't been loaded yet
  if (!hasLoaded && !loading) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-gold" />
          <h3 className="text-lg font-semibold text-gold">Insights IA (Claude)</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-ivory/60 text-center max-w-md">
            Générez des insights intelligents basés sur vos données analytics.
            L'analyse est effectuée par Claude (Anthropic) pour vous fournir des recommandations personnalisées.
          </p>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-lg bg-gold/20 border border-gold/50 px-6 py-3 text-sm font-medium text-gold hover:bg-gold/30 transition"
          >
            <Sparkles className="h-5 w-5" />
            Générer les insights
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-gold/10 text-xs text-ivory/40 text-center">
          Propulsé par Claude 3.5 Sonnet (Anthropic) • Génération à la demande
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-gold" />
          <h3 className="text-lg font-semibold text-gold">Insights IA (Claude)</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <span className="ml-3 text-ivory/70">Analyse des données en cours...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-gold" />
          <h3 className="text-lg font-semibold text-gold">Insights IA (Claude)</h3>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-gold" />
          <h3 className="text-lg font-semibold text-gold">Insights IA (Claude)</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-medium text-gold hover:bg-gold/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Régénérer les insights"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Régénérer</span>
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-ivory/50">Aucun insight disponible pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {insights.map((insight, index) => {
              const colors = getColorClasses(insight.type);

              return (
                <motion.div
                  key={`${insight.title}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={colors.text}>{getIcon(insight.type)}</div>
                      <div className="flex-1">
                        <h4 className={`font-semibold text-ivory mb-1`}>{insight.title}</h4>
                        {insight.metric && insight.value && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-ivory/60">{insight.metric}:</span>
                            <span className={`text-sm font-bold ${colors.text}`}>
                              {insight.value}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getPriorityColor(insight.priority)}`}
                    >
                      {getPriorityLabel(insight.priority)}
                    </span>
                  </div>

                  <p className="text-sm text-ivory/80 mb-3 ml-8">{insight.description}</p>

                  <div className="ml-8 rounded-lg bg-night/40 p-3 border border-gold/10">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gold mt-0.5">💡</span>
                      <div className="flex-1">
                        <p className="text-xs text-gold font-medium mb-1">
                          Action recommandée:
                        </p>
                        <p className="text-sm text-ivory/90">{insight.action}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gold/10 text-xs text-ivory/40 text-center">
        Propulsé par Claude 3.5 Sonnet (Anthropic) • Génération à la demande
      </div>
    </div>
  );
}
