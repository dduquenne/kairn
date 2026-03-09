"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Bell,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Insight {
  id: string;
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  description: string;
  metric?: string;
  value?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  progress: number;
  deadline?: string;
}

interface InsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  insights: Insight[];
  alerts: Alert[];
  goals: Goal[];
  isLoadingInsights?: boolean;
  onRefreshInsights?: () => void;
  onMarkAlertRead?: (alertId: string) => void;
}

type DrawerTab = "insights" | "alerts" | "goals";

export function InsightsDrawer({
  isOpen,
  onClose,
  insights,
  alerts,
  goals,
  isLoadingInsights = false,
  onRefreshInsights,
  onMarkAlertRead,
}: InsightsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("insights");

  // Reset to insights tab when drawer opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("insights");
    }
  }, [isOpen]);

  const unreadAlerts = alerts.filter((a) => !a.isRead).length;

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return <TrendingUp size={18} className="text-green-400" />;
      case "negative":
        return <TrendingDown size={18} className="text-red-400" />;
      case "warning":
        return <AlertTriangle size={18} className="text-yellow-400" />;
      default:
        return <Lightbulb size={18} className="text-blue-400" />;
    }
  };

  const getAlertIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle size={18} className="text-red-400" />;
      case "warning":
        return <AlertTriangle size={18} className="text-yellow-400" />;
      default:
        return <Bell size={18} className="text-blue-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-night border-l border-gold/20 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <Sparkles size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ivory">
                    Insights & Alertes
                  </h2>
                  <p className="text-xs text-ivory/50">
                    Intelligence analytique en temps réel
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-ivory/10 transition-colors"
              >
                <X size={20} className="text-ivory/60" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-gold/10">
              <button
                onClick={() => setActiveTab("insights")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "insights"
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-ivory/60 hover:text-ivory"
                }`}
              >
                <Sparkles size={16} />
                Insights
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "alerts"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "text-ivory/60 hover:text-ivory"
                }`}
              >
                <Bell size={16} />
                Alertes
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadAlerts}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("goals")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "goals"
                    ? "bg-green-500/20 text-green-300"
                    : "text-ivory/60 hover:text-ivory"
                }`}
              >
                <Target size={16} />
                Objectifs
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {activeTab === "insights" && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Refresh Button */}
                    {onRefreshInsights && (
                      <button
                        onClick={onRefreshInsights}
                        disabled={isLoadingInsights}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          size={16}
                          className={isLoadingInsights ? "animate-spin" : ""}
                        />
                        <span className="text-sm">
                          {isLoadingInsights
                            ? "Analyse en cours..."
                            : "Actualiser les insights"}
                        </span>
                      </button>
                    )}

                    {isLoadingInsights ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="h-24 bg-purple-500/10 animate-pulse rounded-xl"
                          />
                        ))}
                      </div>
                    ) : insights.length === 0 ? (
                      <div className="text-center py-12">
                        <Sparkles
                          size={40}
                          className="mx-auto text-ivory/20 mb-3"
                        />
                        <p className="text-sm text-ivory/50">
                          Aucun insight disponible
                        </p>
                        <p className="text-xs text-ivory/30 mt-1">
                          Actualisez pour générer des insights
                        </p>
                      </div>
                    ) : (
                      insights.map((insight, index) => (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border ${
                            insight.type === "positive"
                              ? "border-green-500/20 bg-green-500/5"
                              : insight.type === "negative"
                              ? "border-red-500/20 bg-red-500/5"
                              : insight.type === "warning"
                              ? "border-yellow-500/20 bg-yellow-500/5"
                              : "border-blue-500/20 bg-blue-500/5"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-ivory">
                                {insight.title}
                              </h4>
                              <p className="text-xs text-ivory/60 mt-1">
                                {insight.description}
                              </p>
                              {insight.metric && insight.value && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-ivory/40">
                                    {insight.metric}:
                                  </span>
                                  <span
                                    className={`text-sm font-semibold ${
                                      insight.type === "positive"
                                        ? "text-green-400"
                                        : insight.type === "negative"
                                        ? "text-red-400"
                                        : "text-gold"
                                    }`}
                                  >
                                    {insight.value}
                                  </span>
                                </div>
                              )}
                              {insight.action && (
                                <button
                                  onClick={insight.action.onClick}
                                  className="mt-3 flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 transition-colors"
                                >
                                  {insight.action.label}
                                  <ChevronRight size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === "alerts" && (
                  <motion.div
                    key="alerts"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {alerts.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle
                          size={40}
                          className="mx-auto text-green-400/30 mb-3"
                        />
                        <p className="text-sm text-ivory/50">
                          Aucune alerte active
                        </p>
                        <p className="text-xs text-ivory/30 mt-1">
                          Tout fonctionne normalement
                        </p>
                      </div>
                    ) : (
                      alerts.map((alert, index) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => onMarkAlertRead?.(alert.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                            alert.severity === "critical"
                              ? "border-red-500/30 bg-red-500/10"
                              : alert.severity === "warning"
                              ? "border-yellow-500/30 bg-yellow-500/10"
                              : "border-blue-500/20 bg-blue-500/5"
                          } ${
                            !alert.isRead ? "ring-2 ring-gold/30" : "opacity-70"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {getAlertIcon(alert.severity)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-ivory">
                                  {alert.title}
                                </h4>
                                {!alert.isRead && (
                                  <span className="w-2 h-2 bg-gold rounded-full" />
                                )}
                              </div>
                              <p className="text-xs text-ivory/60 mt-1">
                                {alert.message}
                              </p>
                              <div className="mt-2 flex items-center gap-1 text-xs text-ivory/40">
                                <Clock size={12} />
                                {formatTimestamp(alert.timestamp)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === "goals" && (
                  <motion.div
                    key="goals"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {goals.length === 0 ? (
                      <div className="text-center py-12">
                        <Target size={40} className="mx-auto text-ivory/20 mb-3" />
                        <p className="text-sm text-ivory/50">
                          Aucun objectif configuré
                        </p>
                        <p className="text-xs text-ivory/30 mt-1">
                          Créez des objectifs dans les paramètres
                        </p>
                      </div>
                    ) : (
                      goals.map((goal, index) => (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-xl border border-gold/20 bg-night/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-ivory">
                              {goal.name}
                            </h4>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                goal.progress >= 100
                                  ? "bg-green-500/20 text-green-400"
                                  : goal.progress >= 75
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-ivory/10 text-ivory/60"
                              }`}
                            >
                              {goal.progress >= 100
                                ? "Atteint"
                                : `${goal.progress.toFixed(0)}%`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-2 bg-night/40 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(goal.progress, 100)}%`,
                                }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`h-full rounded-full ${
                                  goal.progress >= 100
                                    ? "bg-green-400"
                                    : "bg-gradient-to-r from-gold to-gold/60"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-ivory/50">
                            <span>
                              {goal.current.toLocaleString("fr-FR")} /{" "}
                              {goal.target.toLocaleString("fr-FR")}
                            </span>
                            {goal.deadline && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Échéance:{" "}
                                {new Date(goal.deadline).toLocaleDateString(
                                  "fr-FR",
                                  { day: "numeric", month: "short" }
                                )}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
