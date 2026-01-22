"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@kairn/ui";
import { Sparkline, SparklineData, AccentColor } from "../common/StatCard";

export interface HeroStatCardProps {
  /** Label describing the stat */
  label: string;
  /** Main value to display */
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
  /** Label for the change period */
  changeLabel?: string;
  /** Sparkline data */
  sparklineData?: SparklineData[];
  /** Color theme */
  accentColor?: AccentColor;
  /** Description tooltip */
  description?: string;
  /** Whether this is a "hero" card (larger) */
  isHero?: boolean;
  /** Custom class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * HeroStatCard - Enhanced stat card for hero/featured metrics
 *
 * @example
 * ```tsx
 * <HeroStatCard
 *   label="Total Revenue"
 *   value="$12,345"
 *   icon="💰"
 *   change={{ value: 15.5, isPositive: true }}
 *   changeLabel="vs last month"
 *   isHero
 *   accentColor="green"
 * />
 * ```
 */
export function HeroStatCard({
  label,
  value,
  icon,
  iconComponent: IconComponent,
  change,
  changeLabel,
  sparklineData,
  accentColor = "gold",
  description,
  isHero = false,
  className,
  onClick,
}: HeroStatCardProps) {
  const colorMap = {
    gold: {
      bg: "from-gold/20 via-gold/10 to-gold/5",
      border: "border-gold/40",
      icon: "bg-gold/30 text-gold",
      value: "text-gold",
      sparkline: "#D4AF37",
    },
    green: {
      bg: "from-green-500/20 via-green-500/10 to-green-500/5",
      border: "border-green-500/40",
      icon: "bg-green-500/30 text-green-400",
      value: "text-green-400",
      sparkline: "#4ADE80",
    },
    blue: {
      bg: "from-blue-500/20 via-blue-500/10 to-blue-500/5",
      border: "border-blue-500/40",
      icon: "bg-blue-500/30 text-blue-400",
      value: "text-blue-400",
      sparkline: "#60A5FA",
    },
    purple: {
      bg: "from-purple-500/20 via-purple-500/10 to-purple-500/5",
      border: "border-purple-500/40",
      icon: "bg-purple-500/30 text-purple-400",
      value: "text-purple-400",
      sparkline: "#C084FC",
    },
    red: {
      bg: "from-red-500/20 via-red-500/10 to-red-500/5",
      border: "border-red-500/40",
      icon: "bg-red-500/30 text-red-400",
      value: "text-red-400",
      sparkline: "#F87171",
    },
    orange: {
      bg: "from-orange-500/20 via-orange-500/10 to-orange-500/5",
      border: "border-orange-500/40",
      icon: "bg-orange-500/30 text-orange-400",
      value: "text-orange-400",
      sparkline: "#FB923C",
    },
  };

  const colors = colorMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-sm transition-all",
        colors.border,
        colors.bg,
        isHero ? "p-8" : "p-6",
        onClick && "cursor-pointer",
        "hover:shadow-xl hover:shadow-gold/10",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-gold/5 to-transparent blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Label */}
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "font-medium text-ivory/70 truncate",
                isHero ? "text-base" : "text-sm"
              )}
            >
              {label}
            </p>
            {description && (
              <span className="group relative">
                <span className="cursor-help text-xs text-ivory/30">i</span>
                <span className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-gold/20 bg-night px-2 py-1 text-xs text-ivory/80 opacity-0 transition-opacity group-hover:opacity-100">
                  {description}
                </span>
              </span>
            )}
          </div>

          {/* Value */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "mt-2 font-bold tracking-tight",
              colors.value,
              isHero ? "text-5xl" : "text-3xl"
            )}
          >
            {value}
          </motion.p>

          {/* Change indicator */}
          {change && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                  Math.abs(change.value) < 0.5
                    ? "bg-ivory/10 text-ivory/60"
                    : change.isPositive
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                )}
              >
                {change.isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                <span>
                  {change.value >= 0 ? "+" : ""}
                  {change.value.toFixed(1)}%
                </span>
              </div>
              {changeLabel && <span className="text-xs text-ivory/40">{changeLabel}</span>}
            </motion.div>
          )}

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <Sparkline
                data={sparklineData}
                color={colors.sparkline}
                width={isHero ? 120 : 80}
                height={isHero ? 32 : 24}
              />
            </motion.div>
          )}
        </div>

        {/* Icon */}
        {(IconComponent || icon) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "shrink-0 rounded-2xl",
              colors.icon,
              isHero ? "p-5" : "p-4"
            )}
          >
            {IconComponent ? (
              <IconComponent size={isHero ? 32 : 24} />
            ) : (
              <span className={isHero ? "text-4xl" : "text-2xl"}>{icon}</span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
