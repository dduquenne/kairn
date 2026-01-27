"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, ArrowRight, ChevronDown, Users, Calendar, Mail } from "lucide-react";

interface ConversionType {
  id: string;
  name: string;
  icon: React.ReactNode;
  clicks: number;
  completed: number;
  rate: number;
  change?: number;
}

interface FunnelStep {
  name: string;
  visitors: number;
  percentage: number;
  dropoff: number;
}

interface Goal {
  id: string;
  name: string;
  type: "destination" | "event" | "duration" | "pages";
  current: number;
  target: number;
  progress: number;
}

interface ConversionsPanelProps {
  totalConversions: number;
  conversionRate: number;
  conversionChange: number;
  conversionTypes: ConversionType[];
  funnelSteps: FunnelStep[];
  goals: Goal[];
  isLoading?: boolean;
}

const DEFAULT_CONVERSION_TYPES: ConversionType[] = [
  {
    id: "appointment",
    name: "Prise de RDV",
    icon: <Calendar size={18} className="text-gold" />,
    clicks: 0,
    completed: 0,
    rate: 0,
  },
  {
    id: "seminar",
    name: "Inscription séminaire",
    icon: <Users size={18} className="text-blue-400" />,
    clicks: 0,
    completed: 0,
    rate: 0,
  },
  {
    id: "contact",
    name: "Formulaire contact",
    icon: <Mail size={18} className="text-green-400" />,
    clicks: 0,
    completed: 0,
    rate: 0,
  },
];

export function ConversionsPanel({
  totalConversions,
  conversionRate,
  conversionChange,
  conversionTypes = DEFAULT_CONVERSION_TYPES,
  funnelSteps,
  goals,
  isLoading = false,
}: ConversionsPanelProps) {
  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:col-span-2 lg:col-span-1 rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 to-night/40 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-gold/20 flex-shrink-0">
              <Target size={24} className="text-gold sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ivory/50 uppercase tracking-wider">
                Taux de conversion
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-ivory">
                  {isLoading ? "..." : `${conversionRate.toFixed(1)}%`}
                </span>
                {!isLoading && conversionChange !== undefined && (
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      conversionChange >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {conversionChange >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(conversionChange).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
              <TrendingUp size={18} className="text-green-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Conversions totales</p>
              <p className="text-lg sm:text-xl font-bold text-ivory truncate">
                {isLoading ? "..." : totalConversions.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-night/60 to-night/40 p-3 sm:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
              <Users size={18} className="text-blue-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ivory/50">Objectifs atteints</p>
              <p className="text-lg sm:text-xl font-bold text-ivory">
                {isLoading
                  ? "..."
                  : `${goals.filter((g) => g.progress >= 100).length}/${goals.length}`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Conversion Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">Par type</h3>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gold/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {conversionTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 sm:p-4 rounded-lg bg-night/50 border border-gold/10"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-ivory/5 flex-shrink-0">{type.icon}</div>
                      <span className="text-xs sm:text-sm font-medium text-ivory truncate">
                        {type.name}
                      </span>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-gold flex-shrink-0">
                      {type.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-ivory/50">
                    <span>{type.clicks.toLocaleString("fr-FR")} clics</span>
                    <ArrowRight size={10} className="sm:w-3 sm:h-3 flex-shrink-0" />
                    <span className="text-green-400">
                      {type.completed.toLocaleString("fr-FR")} complétés
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-night/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${type.rate}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-gold to-gold/60"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Goals Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gold mb-3 sm:mb-4">Objectifs</h3>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gold/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <Target size={40} className="mx-auto text-ivory/20 mb-3" />
              <p className="text-sm text-ivory/50">Aucun objectif configuré</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 sm:p-4 rounded-lg bg-night/50 border border-gold/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ivory">{goal.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        goal.progress >= 100
                          ? "bg-green-500/20 text-green-400"
                          : goal.progress >= 75
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-ivory/10 text-ivory/60"
                      }`}
                    >
                      {goal.progress >= 100 ? "Atteint" : `${goal.progress.toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-night/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(goal.progress, 100)}%` }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          goal.progress >= 100
                            ? "bg-green-400"
                            : "bg-gradient-to-r from-gold to-gold/60"
                        }`}
                      />
                    </div>
                    <span className="text-xs text-ivory/50 w-20 text-right">
                      {goal.current} / {goal.target}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Conversion Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-4 sm:p-6"
      >
        <h3 className="text-base sm:text-lg font-semibold text-gold mb-4 sm:mb-6">Tunnel de conversion</h3>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
          </div>
        ) : funnelSteps.length === 0 ? (
          <div className="text-center py-8">
            <ChevronDown size={40} className="mx-auto text-ivory/20 mb-3" />
            <p className="text-sm text-ivory/50">Aucune donnée de tunnel</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-4">
            {funnelSteps.map((step, index) => {
              const widthPercent = step.percentage;
              const isLast = index === funnelSteps.length - 1;

              return (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-4">
                    {/* Step number */}
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                        index === 0
                          ? "bg-gold/20 text-gold"
                          : "bg-ivory/10 text-ivory/60"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1">
                        <span className="text-xs sm:text-sm font-medium text-ivory truncate">
                          {step.name}
                        </span>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs">
                          <span className="text-ivory/70">
                            {step.visitors.toLocaleString("fr-FR")} visiteurs
                          </span>
                          <span className="text-gold font-semibold bg-gold/10 px-2 py-0.5 rounded">
                            {step.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-6 sm:h-8 bg-night/40 rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 0.6, delay: index * 0.15 }}
                          className="h-full bg-gradient-to-r from-gold to-gold/60 rounded-lg flex items-center justify-end pr-2 sm:pr-3"
                          style={{ minWidth: widthPercent > 0 ? '2rem' : '0' }}
                        >
                          {widthPercent > 25 && (
                            <span className="text-[10px] sm:text-xs font-medium text-night">
                              {step.visitors.toLocaleString("fr-FR")}
                            </span>
                          )}
                        </motion.div>
                      </div>

                      {/* Dropoff indicator - inline on mobile */}
                      {!isLast && step.dropoff > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-400 mt-1 sm:hidden">
                          <ChevronDown size={12} />
                          <span>Perte : {step.dropoff.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropoff indicator - absolute on desktop */}
                  {!isLast && step.dropoff > 0 && (
                    <div className="hidden sm:flex absolute left-3 -bottom-4 items-center text-xs text-red-400 bg-night/80 px-2 py-0.5 rounded">
                      <ChevronDown size={14} />
                      <span>-{step.dropoff.toFixed(1)}%</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
