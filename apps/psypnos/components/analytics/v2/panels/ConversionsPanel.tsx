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
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 lg:col-span-1 rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 to-night/40 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gold/20">
              <Target size={28} className="text-gold" />
            </div>
            <div>
              <p className="text-xs text-ivory/50 uppercase tracking-wider">
                Taux de conversion
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-ivory">
                  {isLoading ? "..." : `${conversionRate.toFixed(1)}%`}
                </span>
                {!isLoading && conversionChange !== undefined && (
                  <span
                    className={`text-sm font-medium ${
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
          className="rounded-xl border border-green-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-ivory/50">Conversions totales</p>
              <p className="text-xl font-bold text-ivory">
                {isLoading ? "..." : totalConversions.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-night/60 to-night/40 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-ivory/50">Objectifs atteints</p>
              <p className="text-xl font-bold text-ivory">
                {isLoading
                  ? "..."
                  : `${goals.filter((g) => g.progress >= 100).length}/${goals.length}`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversion Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
        >
          <h3 className="text-lg font-semibold text-gold mb-4">Par type</h3>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gold/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {conversionTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-night/50 border border-gold/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-ivory/5">{type.icon}</div>
                      <span className="text-sm font-medium text-ivory">
                        {type.name}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gold">
                      {type.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ivory/50">
                    <span>{type.clicks.toLocaleString("fr-FR")} clics</span>
                    <ArrowRight size={12} />
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
          className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
        >
          <h3 className="text-lg font-semibold text-gold mb-4">Objectifs</h3>

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
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-night/50 border border-gold/10"
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
        className="rounded-xl border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6"
      >
        <h3 className="text-lg font-semibold text-gold mb-6">Tunnel de conversion</h3>

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
          <div className="space-y-4">
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
                  <div className="flex items-center gap-4">
                    {/* Step number */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-gold/20 text-gold"
                          : "bg-ivory/10 text-ivory/60"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Step content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ivory">
                          {step.name}
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-ivory">
                            {step.visitors.toLocaleString("fr-FR")}
                          </span>
                          <span className="text-gold font-semibold">
                            {step.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-8 bg-night/40 rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 0.6, delay: index * 0.15 }}
                          className="h-full bg-gradient-to-r from-gold to-gold/60 rounded-lg flex items-center justify-end pr-3"
                        >
                          {widthPercent > 20 && (
                            <span className="text-xs font-medium text-night">
                              {step.visitors.toLocaleString("fr-FR")}
                            </span>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Dropoff indicator */}
                  {!isLast && step.dropoff > 0 && (
                    <div className="absolute left-4 -bottom-3 flex items-center text-xs text-red-400">
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
