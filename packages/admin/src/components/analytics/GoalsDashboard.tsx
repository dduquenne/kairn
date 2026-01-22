"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@kairn/ui";

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  previousPeriod?: number;
  unit?: string;
  description?: string;
}

export interface GoalsDashboardProps {
  /** List of goals to display */
  goals: Goal[];
  /** Title of the dashboard */
  title?: string;
  /** Custom class names */
  className?: string;
  /** Accent color */
  accentColor?: string;
  /** Labels configuration */
  labels?: {
    achieved?: string;
    inProgress?: string;
    behindTarget?: string;
    vsLastPeriod?: string;
  };
}

/**
 * GoalsDashboard - Display progress towards defined goals
 *
 * @example
 * ```tsx
 * const goals = [
 *   { id: '1', name: 'Monthly Visitors', target: 10000, current: 7500 },
 *   { id: '2', name: 'Conversion Rate', target: 5, current: 3.2, unit: '%' },
 * ];
 *
 * <GoalsDashboard goals={goals} title="Monthly Goals" />
 * ```
 */
export function GoalsDashboard({
  goals,
  title = "Objectifs",
  className,
  accentColor = "gold",
  labels = {},
}: GoalsDashboardProps) {
  const {
    achieved = "Atteint",
    inProgress = "En cours",
    behindTarget = "En retard",
    vsLastPeriod = "vs periode precedente",
  } = labels;

  const getProgressPercentage = (goal: Goal) => {
    return Math.min(100, (goal.current / goal.target) * 100);
  };

  const getStatus = (goal: Goal) => {
    const percentage = getProgressPercentage(goal);
    if (percentage >= 100) return "achieved";
    if (percentage >= 70) return "on-track";
    return "behind";
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "achieved":
        return {
          color: "green",
          icon: CheckCircle2,
          label: achieved,
          bgClass: "bg-green-500/20",
          textClass: "text-green-400",
          barClass: "from-green-500 to-green-400",
        };
      case "on-track":
        return {
          color: "gold",
          icon: Target,
          label: inProgress,
          bgClass: "bg-gold/20",
          textClass: "text-gold",
          barClass: "from-gold to-gold/70",
        };
      default:
        return {
          color: "orange",
          icon: AlertCircle,
          label: behindTarget,
          bgClass: "bg-orange-500/20",
          textClass: "text-orange-400",
          barClass: "from-orange-500 to-orange-400",
        };
    }
  };

  const getTrendChange = (goal: Goal) => {
    if (!goal.previousPeriod) return null;
    const change = ((goal.current - goal.previousPeriod) / goal.previousPeriod) * 100;
    return {
      value: change,
      isPositive: change >= 0,
    };
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm",
        `border-${accentColor}/20`,
        className
      )}
    >
      <div className="mb-6 flex items-center gap-2">
        <Target size={20} className={cn(`text-${accentColor}`)} />
        <h3 className={cn("text-lg font-semibold", `text-${accentColor}`)}>{title}</h3>
      </div>

      <div className="space-y-6">
        {goals.map((goal, index) => {
          const percentage = getProgressPercentage(goal);
          const status = getStatus(goal);
          const config = getStatusConfig(status);
          const trend = getTrendChange(goal);
          const StatusIcon = config.icon;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusIcon size={16} className={config.textClass} />
                    <span className="text-sm font-medium text-ivory truncate">{goal.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        config.bgClass,
                        config.textClass
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="mt-1 text-xs text-ivory/50">{goal.description}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-lg font-bold", config.textClass)}>
                      {goal.current.toLocaleString()}
                    </span>
                    <span className="text-xs text-ivory/50">
                      / {goal.target.toLocaleString()} {goal.unit || ""}
                    </span>
                  </div>
                  {trend && (
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {trend.isPositive ? (
                        <TrendingUp size={12} className="text-green-400" />
                      ) : (
                        <TrendingDown size={12} className="text-red-400" />
                      )}
                      <span
                        className={cn(
                          "text-xs",
                          trend.isPositive ? "text-green-400" : "text-red-400"
                        )}
                      >
                        {trend.isPositive ? "+" : ""}
                        {trend.value.toFixed(1)}% {vsLastPeriod}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className={cn("relative h-3 overflow-hidden rounded-full bg-night/60 border", `border-${accentColor}/10`)}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                  className={cn("absolute inset-y-0 left-0 bg-gradient-to-r", config.barClass)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-ivory/80">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
