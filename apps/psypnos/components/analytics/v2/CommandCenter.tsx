"use client";

import { motion } from "framer-motion";
import { RefreshCw, Settings, Bell, Download, Beaker, Users, Target, Clock } from "lucide-react";
import { useState } from "react";

interface KPIData {
  visitors: number;
  visitorsChange: number;
  conversionRate: number;
  conversionChange: number;
  avgDuration: number; // in seconds
  durationChange: number; // in seconds
}

interface CommandCenterProps {
  healthScore: number;
  kpis: KPIData;
  isLoading?: boolean;
  isRealtime?: boolean;
  alertCount?: number;
  isSimulationMode?: boolean;
  onRefresh: () => void;
  onSettingsClick?: () => void;
  onAlertsClick?: () => void;
  onExportClick?: () => void;
  onSimulationToggle?: () => void;
  children?: React.ReactNode; // For PeriodSelector
}

export function CommandCenter({
  healthScore,
  kpis,
  isLoading = false,
  isRealtime = false,
  alertCount = 0,
  isSimulationMode = false,
  onRefresh,
  onSettingsClick,
  onAlertsClick,
  onExportClick,
  onSimulationToggle,
  children,
}: CommandCenterProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Health score color and label
  const getHealthConfig = (score: number) => {
    if (score >= 70) {
      return {
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500/30",
        label: "Excellente",
      };
    } else if (score >= 40) {
      return {
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30",
        label: "Correcte",
      };
    } else {
      return {
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/30",
        label: "Attention",
      };
    }
  };

  const healthConfig = getHealthConfig(healthScore);

  // Format duration to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 -mx-4 px-4 py-3 backdrop-blur-xl bg-night/95 border-b border-gold/10"
    >
      {/* Row 1: Controls - Period, Simulation, Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Left: Health Score Compact */}
        <div className="flex items-center gap-2">
          <div
            className={`relative w-10 h-10 ${healthConfig.bgColor} ${healthConfig.borderColor} border rounded-full flex items-center justify-center`}
          >
            <span className={`text-sm font-bold ${healthConfig.color}`}>
              {healthScore}
            </span>
            {isRealtime && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <span className={`text-xs font-medium ${healthConfig.color} hidden sm:block`}>
            {healthConfig.label}
          </span>
        </div>

        {/* Right: All Controls */}
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="relative z-50">
            {children}
          </div>

          {/* Simulation Toggle */}
          {onSimulationToggle && (
            <motion.button
              onClick={onSimulationToggle}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all ${
                isSimulationMode
                  ? "border-purple-500/50 bg-purple-500/20 text-purple-400"
                  : "border-gold/30 bg-gold/5 text-ivory/60 hover:text-gold"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Beaker size={14} />
              <div
                className={`w-6 h-3 rounded-full transition-colors ${
                  isSimulationMode ? "bg-purple-500" : "bg-ivory/20"
                }`}
              >
                <motion.div
                  className="w-2.5 h-2.5 mt-[1px] bg-white rounded-full shadow-sm"
                  animate={{ marginLeft: isSimulationMode ? "12px" : "1px" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </motion.button>
          )}

          {/* Refresh */}
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </motion.button>

          {/* Alerts */}
          {onAlertsClick && (
            <motion.button
              onClick={onAlertsClick}
              className="relative p-2 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={16} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </motion.button>
          )}

          {/* Export */}
          {onExportClick && (
            <motion.button
              onClick={onExportClick}
              className="hidden sm:flex items-center gap-1.5 px-2 py-2 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} />
              <span className="text-xs font-medium">Export</span>
            </motion.button>
          )}

          {/* Settings */}
          {onSettingsClick && (
            <motion.button
              onClick={onSettingsClick}
              className="p-2 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Row 2: KPIs - Full width, clearly separated */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/30"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={12} className="text-blue-400" />
            <span className="text-[10px] sm:text-xs text-blue-300 font-medium uppercase tracking-wide">
              Visiteurs
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-ivory">
            {isLoading ? (
              <span className="inline-block w-12 h-6 bg-blue-400/20 animate-pulse rounded" />
            ) : (
              kpis.visitors.toLocaleString("fr-FR")
            )}
          </div>
          {!isLoading && (
            <div className={`text-[10px] sm:text-xs font-medium ${
              kpis.visitorsChange >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              {kpis.visitorsChange >= 0 ? "↑" : "↓"} {Math.abs(kpis.visitorsChange).toFixed(1)}%
            </div>
          )}
        </motion.div>

        {/* Conversion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={12} className="text-gold" />
            <span className="text-[10px] sm:text-xs text-gold/90 font-medium uppercase tracking-wide">
              Conversion
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-ivory">
            {isLoading ? (
              <span className="inline-block w-10 h-6 bg-gold/20 animate-pulse rounded" />
            ) : (
              `${kpis.conversionRate.toFixed(1)}%`
            )}
          </div>
          {!isLoading && (
            <div className={`text-[10px] sm:text-xs font-medium ${
              kpis.conversionChange >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              {kpis.conversionChange >= 0 ? "↑" : "↓"} {Math.abs(kpis.conversionChange).toFixed(1)} pts
            </div>
          )}
        </motion.div>

        {/* Duration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-500/5 border border-purple-500/30"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} className="text-purple-400" />
            <span className="text-[10px] sm:text-xs text-purple-300 font-medium uppercase tracking-wide">
              Durée moy.
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-ivory">
            {isLoading ? (
              <span className="inline-block w-10 h-6 bg-purple-400/20 animate-pulse rounded" />
            ) : (
              formatDuration(kpis.avgDuration)
            )}
          </div>
          {!isLoading && (
            <div className={`text-[10px] sm:text-xs font-medium ${
              kpis.durationChange >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              {kpis.durationChange >= 0 ? "↑" : "↓"} {Math.abs(kpis.durationChange)}s
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
