/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface BarData {
  label: string;
  value: number;
  maxValue?: number;
  trend?: number;
  subtitle?: string;
  onClick?: () => void;
}

interface HorizontalBarChartProps {
  data: BarData[];
  title?: string;
  color?: string;
  showRank?: boolean;
}

export function HorizontalBarChart({
  data,
  title,
  color = "#C9A961",
  showRank = true,
}: HorizontalBarChartProps) {
  // Calculate max value for percentage width
  const maxValue = Math.max(...data.map((d) => d.maxValue || d.value), 1);

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-semibold text-ivory/70 uppercase tracking-wide">
          {title}
        </h3>
      )}

      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={item.onClick}
              className={`group ${item.onClick ? "cursor-pointer" : ""}`}
            >
              <div className="flex items-center gap-3 bg-gold/5 border border-gold/10 rounded-xl p-3 active:bg-gold/10 transition-colors">
                {/* Rank badge */}
                {showRank && (
                  <div
                    className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold shrink-0 ${
                      index === 0
                        ? "bg-gold/20 text-gold"
                        : index === 1
                          ? "bg-ivory/10 text-ivory/60"
                          : index === 2
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-ivory/5 text-ivory/40"
                    }`}
                  >
                    {index + 1}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Label and trend */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-ivory line-clamp-2 flex-1">
                      {item.label}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.trend !== undefined && (
                        <span
                          className={`flex items-center gap-0.5 text-xs font-bold ${
                            item.trend >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {item.trend >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(item.trend)}%
                        </span>
                      )}
                      <span className="text-sm font-bold text-gold">
                        {item.value.toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>

                  {/* Subtitle if present */}
                  {item.subtitle && (
                    <p className="text-xs text-ivory/40 mb-2">{item.subtitle}</p>
                  )}

                  {/* Progress bar */}
                  <div className="h-1.5 bg-gold/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
