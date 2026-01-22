"use client";

import { ReactNode } from "react";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@kairn/ui";

export interface SparklineData {
  value: number;
}

export type AccentColor = "gold" | "green" | "blue" | "purple" | "red" | "orange";

export interface StatCardProps {
  /** Label describing the stat */
  label: string;
  /** The main value to display */
  value: string | number;
  /** Emoji or ReactNode icon */
  icon?: ReactNode;
  /** Lucide icon component */
  iconComponent?: LucideIcon;
  /** Change compared to previous period */
  change?: {
    value: number;
    isPositive: boolean;
  };
  /** Label describing the change period */
  changeLabel?: string;
  /** Data points for the sparkline */
  sparklineData?: SparklineData[];
  /** Color theme for the card */
  accentColor?: AccentColor;
  /** Tooltip description for the stat */
  description?: string;
  /** Custom class names */
  className?: string;
}

const ACCENT_COLORS = {
  gold: {
    bg: "from-gold/10 to-gold/5",
    border: "border-gold/30",
    icon: "bg-gold/20 text-gold",
    value: "text-gold",
    sparkline: "#D4AF37",
  },
  green: {
    bg: "from-green-500/10 to-green-500/5",
    border: "border-green-500/30",
    icon: "bg-green-500/20 text-green-400",
    value: "text-green-400",
    sparkline: "#4ADE80",
  },
  blue: {
    bg: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/30",
    icon: "bg-blue-500/20 text-blue-400",
    value: "text-blue-400",
    sparkline: "#60A5FA",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/30",
    icon: "bg-purple-500/20 text-purple-400",
    value: "text-purple-400",
    sparkline: "#C084FC",
  },
  red: {
    bg: "from-red-500/10 to-red-500/5",
    border: "border-red-500/30",
    icon: "bg-red-500/20 text-red-400",
    value: "text-red-400",
    sparkline: "#F87171",
  },
  orange: {
    bg: "from-orange-500/10 to-orange-500/5",
    border: "border-orange-500/30",
    icon: "bg-orange-500/20 text-orange-400",
    value: "text-orange-400",
    sparkline: "#FB923C",
  },
};

/**
 * Sparkline - Mini inline chart for showing trends
 */
export function Sparkline({
  data,
  color = "#D4AF37",
  width = 80,
  height = 24,
}: {
  data: SparklineData[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * StatCard - Statistics card for admin dashboards
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Visitors"
 *   value="12,345"
 *   icon="📊"
 *   change={{ value: 12.5, isPositive: true }}
 *   changeLabel="vs last month"
 *   accentColor="green"
 * />
 * ```
 */
export function StatCard({
  label,
  value,
  icon,
  iconComponent: IconComponent,
  change,
  changeLabel,
  sparklineData,
  accentColor = "gold",
  description,
  className,
}: StatCardProps) {
  const colors = ACCENT_COLORS[accentColor];

  const getTrendIcon = () => {
    if (!change) return null;
    if (Math.abs(change.value) < 0.5) {
      return <Minus size={14} className="text-ivory/50" />;
    }
    return change.isPositive ? (
      <TrendingUp size={14} className="text-green-400" />
    ) : (
      <TrendingDown size={14} className="text-red-400" />
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-gold/5",
        colors.border,
        colors.bg,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Label with optional description tooltip */}
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-ivory/70">{label}</p>
            {description && (
              <span className="group relative">
                <span className="cursor-help text-xs text-ivory/30">i</span>
                <span className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-gold/20 bg-night px-2 py-1 text-xs text-ivory/80 opacity-0 transition-opacity group-hover:opacity-100">
                  {description}
                </span>
              </span>
            )}
          </div>

          {/* Value with trend indicator */}
          <div className="mt-2 flex items-baseline gap-2">
            <p className={cn("text-3xl font-bold tracking-tight", colors.value)}>{value}</p>
            {getTrendIcon()}
          </div>

          {/* Change indicator */}
          {change && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  Math.abs(change.value) < 0.5
                    ? "bg-ivory/10 text-ivory/60"
                    : change.isPositive
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                )}
              >
                {change.isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span>
                  {change.value >= 0 ? "+" : ""}
                  {change.value.toFixed(1)}%
                </span>
              </div>
              {changeLabel && <span className="text-xs text-ivory/40">{changeLabel}</span>}
            </div>
          )}

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3">
              <Sparkline data={sparklineData} color={colors.sparkline} />
            </div>
          )}
        </div>

        {/* Icon */}
        {(IconComponent || icon) && (
          <div className={cn("shrink-0 rounded-xl p-3", colors.icon)}>
            {IconComponent ? (
              <IconComponent size={24} />
            ) : (
              <span className="text-2xl">{icon}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
