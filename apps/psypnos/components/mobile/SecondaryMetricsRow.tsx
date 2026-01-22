// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SecondaryMetric {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: "gold" | "green" | "red" | "blue";
}

interface SecondaryMetricsRowProps {
  metrics: SecondaryMetric[];
}

// Trend color helper
function getTrendColor(trend: number): string {
  if (trend > 5) return "text-green-400";
  if (trend < -5) return "text-red-400";
  if (trend > 0) return "text-gold";
  if (trend < 0) return "text-orange-400";
  return "text-gray-400";
}

export function SecondaryMetricsRow({ metrics }: SecondaryMetricsRowProps) {
  const colorClasses = {
    gold: "text-gold",
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 max-w-[100vw]">
      <div className="flex gap-3 pb-2">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 bg-gold/5 border border-gold/20 rounded-xl px-4 py-3 min-w-[120px] flex-shrink-0"
            >
              <div className={`p-2 rounded-lg bg-gold/10 ${colorClasses[metric.color || "gold"]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-ivory/50 uppercase tracking-wide font-medium">
                  {metric.label}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-ivory">
                    {typeof metric.value === "number"
                      ? metric.value.toLocaleString("fr-FR")
                      : metric.value}
                  </span>
                  {metric.trend !== undefined && (
                    <span className={`text-xs font-semibold ${getTrendColor(metric.trend)}`}>
                      {metric.trend >= 0 ? "↑" : "↓"}
                      {Math.abs(metric.trend).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
