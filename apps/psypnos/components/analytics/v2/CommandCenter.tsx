'use client';

import { motion } from 'framer-motion';
import { RefreshCw, Settings, Bell, Download, Beaker, Users, Target, Clock } from 'lucide-react';
import { useState } from 'react';

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
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        label: 'Excellente',
      };
    } else if (score >= 40) {
      return {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        label: 'Correcte',
      };
    } else {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        label: 'Attention',
      };
    }
  };

  const healthConfig = getHealthConfig(healthScore);

  // Format duration to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-night/95 border-gold/10 sticky top-0 z-40 -mx-4 border-b px-4 py-3 backdrop-blur-xl"
    >
      {/* Row 1: Controls - Period, Simulation, Actions */}
      <div className="mb-3 flex items-center justify-between gap-2">
        {/* Left: Health Score Compact */}
        <div className="flex items-center gap-2">
          <div
            className={`relative h-10 w-10 ${healthConfig.bgColor} ${healthConfig.borderColor} flex items-center justify-center rounded-full border`}
          >
            <span className={`text-sm font-bold ${healthConfig.color}`}>{healthScore}</span>
            {isRealtime && (
              <motion.div
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-green-500"
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
          <div className="relative z-50">{children}</div>

          {/* Simulation Toggle */}
          {onSimulationToggle && (
            <motion.button
              onClick={onSimulationToggle}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all ${
                isSimulationMode
                  ? 'border-purple-500/50 bg-purple-500/20 text-purple-400'
                  : 'border-gold/30 bg-gold/5 text-ivory/60 hover:text-gold'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Beaker size={14} />
              <div
                className={`h-3 w-6 rounded-full transition-colors ${
                  isSimulationMode ? 'bg-purple-500' : 'bg-ivory/20'
                }`}
              >
                <motion.div
                  className="mt-[1px] h-2.5 w-2.5 rounded-full bg-white shadow-sm"
                  animate={{ marginLeft: isSimulationMode ? '12px' : '1px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            </motion.button>
          )}

          {/* Refresh */}
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 rounded-lg border p-2 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </motion.button>

          {/* Alerts */}
          {onAlertsClick && (
            <motion.button
              onClick={onAlertsClick}
              className="border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 relative rounded-lg border p-2 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={16} />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </motion.button>
          )}

          {/* Export */}
          {onExportClick && (
            <motion.button
              onClick={onExportClick}
              className="border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 hidden items-center gap-1.5 rounded-lg border px-2 py-2 transition-colors sm:flex"
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
              className="border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 rounded-lg border p-2 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Row 2: KPIs - Full width, clearly separated */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {/* Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 to-blue-500/5 p-2.5 sm:p-3"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <Users size={12} className="text-blue-400" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-blue-300 sm:text-xs">
              Visiteurs
            </span>
          </div>
          <div className="text-ivory text-lg font-bold sm:text-2xl">
            {isLoading ? (
              <span className="inline-block h-6 w-12 animate-pulse rounded bg-blue-400/20" />
            ) : (
              kpis.visitors.toLocaleString('fr-FR')
            )}
          </div>
          {!isLoading && (
            <div
              className={`text-[10px] font-medium sm:text-xs ${
                kpis.visitorsChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {kpis.visitorsChange >= 0 ? '↑' : '↓'} {Math.abs(kpis.visitorsChange).toFixed(1)}%
            </div>
          )}
        </motion.div>

        {/* Conversion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="from-gold/15 to-gold/5 border-gold/30 rounded-xl border bg-gradient-to-br p-2.5 sm:p-3"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <Target size={12} className="text-gold" />
            <span className="text-gold/90 text-[10px] font-medium uppercase tracking-wide sm:text-xs">
              Conversion
            </span>
          </div>
          <div className="text-ivory text-lg font-bold sm:text-2xl">
            {isLoading ? (
              <span className="bg-gold/20 inline-block h-6 w-10 animate-pulse rounded" />
            ) : (
              `${kpis.conversionRate.toFixed(1)}%`
            )}
          </div>
          {!isLoading && (
            <div
              className={`text-[10px] font-medium sm:text-xs ${
                kpis.conversionChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {kpis.conversionChange >= 0 ? '↑' : '↓'} {Math.abs(kpis.conversionChange).toFixed(1)}{' '}
              pts
            </div>
          )}
        </motion.div>

        {/* Duration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 to-purple-500/5 p-2.5 sm:p-3"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <Clock size={12} className="text-purple-400" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-purple-300 sm:text-xs">
              Durée moy.
            </span>
          </div>
          <div className="text-ivory text-lg font-bold sm:text-2xl">
            {isLoading ? (
              <span className="inline-block h-6 w-10 animate-pulse rounded bg-purple-400/20" />
            ) : (
              formatDuration(kpis.avgDuration)
            )}
          </div>
          {!isLoading && (
            <div
              className={`text-[10px] font-medium sm:text-xs ${
                kpis.durationChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {kpis.durationChange >= 0 ? '↑' : '↓'} {Math.abs(kpis.durationChange)}s
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
