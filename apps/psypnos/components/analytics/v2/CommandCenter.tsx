"use client";

import { motion } from "framer-motion";
import { RefreshCw, Settings, Bell, Download, ChevronDown, Beaker } from "lucide-react";
import { useState, useEffect } from "react";

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
        label: "Excellente performance",
      };
    } else if (score >= 40) {
      return {
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30",
        label: "Performance correcte",
      };
    } else {
      return {
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/30",
        label: "Attention requise",
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

  // Format change with arrow
  const formatChange = (value: number, suffix = "%") => {
    const isPositive = value >= 0;
    const arrow = isPositive ? "▲" : "▼";
    const color = isPositive ? "text-green-400" : "text-red-400";
    return (
      <span className={`text-xs font-medium ${color}`}>
        {arrow} {isPositive ? "+" : ""}
        {value.toFixed(1)}{suffix}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 -mx-4 px-4 py-4 backdrop-blur-xl bg-night/90 border-b border-gold/10 overflow-x-hidden"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 max-w-full">
        {/* Health Score */}
        <div className="flex items-center gap-4">
          <motion.div
            className={`relative w-16 h-16 ${healthConfig.bgColor} ${healthConfig.borderColor} border rounded-full flex items-center justify-center`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <span className={`text-2xl font-bold ${healthConfig.color}`}>
              {healthScore}
            </span>
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-gold/10"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className={healthConfig.color}
                initial={{ strokeDasharray: "0 176" }}
                animate={{
                  strokeDasharray: `${(healthScore / 100) * 176} 176`,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            {isRealtime && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
          <div className="hidden sm:block">
            <p className="text-xs text-ivory/50 uppercase tracking-wider">
              Score santé
            </p>
            <p className={`font-semibold ${healthConfig.color}`}>
              {healthConfig.label}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-12 bg-gold/20" />

        {/* KPIs */}
        <div className="flex flex-1 items-center gap-3 sm:gap-4 lg:gap-6 min-w-0">
          {/* Visitors KPI */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-[10px] sm:text-xs text-ivory/50 uppercase tracking-wider truncate">
              Visiteurs
            </p>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-ivory whitespace-nowrap">
                {isLoading ? (
                  <span className="inline-block w-12 sm:w-16 h-6 sm:h-8 bg-gold/20 animate-pulse rounded" />
                ) : (
                  kpis.visitors.toLocaleString("fr-FR")
                )}
              </span>
              {!isLoading && <span className="hidden sm:inline">{formatChange(kpis.visitorsChange)}</span>}
            </div>
          </motion.div>

          {/* Conversion Rate KPI */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[10px] sm:text-xs text-ivory/50 uppercase tracking-wider truncate">
              Conversions
            </p>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-ivory whitespace-nowrap">
                {isLoading ? (
                  <span className="inline-block w-10 sm:w-12 h-6 sm:h-8 bg-gold/20 animate-pulse rounded" />
                ) : (
                  `${kpis.conversionRate.toFixed(1)}%`
                )}
              </span>
              {!isLoading && <span className="hidden sm:inline">{formatChange(kpis.conversionChange, " pts")}</span>}
            </div>
          </motion.div>

          {/* Duration KPI */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[10px] sm:text-xs text-ivory/50 uppercase tracking-wider truncate">
              Durée moy.
            </p>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-ivory whitespace-nowrap">
                {isLoading ? (
                  <span className="inline-block w-10 sm:w-14 h-6 sm:h-8 bg-gold/20 animate-pulse rounded" />
                ) : (
                  formatDuration(kpis.avgDuration)
                )}
              </span>
              {!isLoading && (
                <span
                  className={`hidden sm:inline text-xs font-medium ${
                    kpis.durationChange >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {kpis.durationChange >= 0 ? "▲" : "▼"}{" "}
                  {kpis.durationChange >= 0 ? "+" : ""}
                  {kpis.durationChange}s
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-wrap justify-end">
          {/* Period Selector (passed as children) */}
          <div className="flex-shrink-0">
            {children}
          </div>

          {/* Simulation Mode Toggle */}
          {onSimulationToggle && (
            <motion.button
              onClick={onSimulationToggle}
              className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg border transition-all flex-shrink-0 ${
                isSimulationMode
                  ? "border-purple-500/50 bg-purple-500/20 text-purple-400"
                  : "border-gold/30 bg-gold/5 text-ivory/60 hover:text-gold hover:bg-gold/10"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title={isSimulationMode ? "Désactiver le mode simulation" : "Activer le mode simulation"}
            >
              <Beaker size={16} className={`flex-shrink-0 ${isSimulationMode ? "text-purple-400" : ""}`} />
              <span className="text-xs font-medium hidden md:inline">
                Simulation
              </span>
              {/* Toggle Switch */}
              <div
                className={`relative w-7 sm:w-8 h-4 rounded-full transition-colors flex-shrink-0 ${
                  isSimulationMode ? "bg-purple-500" : "bg-ivory/20"
                }`}
              >
                <motion.div
                  className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                  animate={{
                    left: isSimulationMode ? "calc(100% - 14px)" : "2px",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
              {isSimulationMode && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"
                />
              )}
            </motion.button>
          )}

          {/* Refresh Button */}
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Rafraîchir"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </motion.button>

          {/* Alerts Button */}
          {onAlertsClick && (
            <motion.button
              onClick={onAlertsClick}
              className="relative p-2.5 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Alertes"
            >
              <Bell size={18} />
              {alertCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {alertCount > 9 ? "9+" : alertCount}
                </motion.span>
              )}
            </motion.button>
          )}

          {/* Export Button */}
          {onExportClick && (
            <motion.button
              onClick={onExportClick}
              className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={18} />
              <span className="text-sm font-medium">Export</span>
            </motion.button>
          )}

          {/* Settings Button */}
          {onSettingsClick && (
            <motion.button
              onClick={onSettingsClick}
              className="p-2.5 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Paramètres"
            >
              <Settings size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
